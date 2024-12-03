// TODO: add post processing for debug view, ssao

import React, { forwardRef, useMemo, createRef, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshStandardMaterial, SphereGeometry, RepeatWrapping, TextureLoader, Color } from 'three';
import { PerspectiveCamera, OrbitControls, MarchingCubes, MarchingCube, MarchingPlane, useTexture } from '@react-three/drei';
import { Physics, RigidBody, useRapier } from '@react-three/rapier';
import { Perf } from 'r3f-perf';
import { randomPointInPolygon } from '../utils';
import plusImage from '../assets/plus.png';
import CustomEnvironment from './CustomEnvironment';

import './index.scss';

function Blobs({ mcResolution, mcPolyCount, bubblePositions }) {
  return (
    <MarchingCubes
      resolution={mcResolution}
      maxPolyCount={mcPolyCount}
    >
      {bubblePositions.map((position, index) => (
        <MarchingCube
          key={index}
          position={[position.x, position.y, position.z]}
          strength={0.2}
          subtract={40}
        />
      ))}
      <meshPhysicalMaterial
        envMapIntensity={4} // Adjust the intensity of the environment reflection
        metalness={0.1} // Increase metalness for better reflections
        roughness={0.2} // Reduce roughness for sharper reflections
        transmission={0.99}
        reflectivity={0.9}
        color={new Color(0xbbddee)}
      />
    </MarchingCubes>
  );
}

const Bubble = forwardRef(({ bubble, bubblePositions, sharedGeometry, sharedMaterial }, ref) => {
  const { world } = useRapier();
  // console.log(world);
  const geometry = useMemo(() => new SphereGeometry(bubble.scale[0] / 10, 12, 18), []);
  const material = useMemo(() => new MeshStandardMaterial({ roughness: 0.1, metalness: 0.8 }), []);
  const { position } = bubble;
  if (position[0] < -0.25 || position[0] > 0.25 || position[1] < -0.25 || position[1] > 0.25) {
    bubble.offscreen = true;
    // console.log(world, bubble);
  }

  return (
    <RigidBody
      colliders="ball"
      // ref={ref}
      position={bubble.position}
      rotation={bubble.rotation}
      type="dynamic"
      linearDamping={2}
      friction={0.01}
      restitution={0.1}
      canSleep
      ref={ref}
      onReady={(body) => {
        // Apply an initial impulse to the bubble when it is created
        body.applyImpulse(
          {
            x: (Math.random() * 0.5) - 0.25,
            y: (Math.random() * 0.5) - 0.25,
            z: 1,
          },
          true,
        );
      }}
    >
      <mesh scale={bubble.scale} geometry={geometry} material={material} />
    </RigidBody>
  );
});

function Bubbles({ bubbles, bubblePositions, setBubbles, setBubblePositions, loops, noiseThreshold, currentVolume, sharedGeometry, sharedMaterial }) {
  const maxBubbleRate = 50;
  const lastBubbleTime = useRef(new Date().getTime());
  const { scene } = useThree();

  useFrame(() => {
    const currentTime = new Date().getTime();

    // Update `bubblePositions` with real-time positions from the physics world
    // const updatedPositions = bubbles.map((bubble) => {
    //   const bubbleRef = bubble.ref?.current;
    //   if (bubbleRef) {
    //     // const position = bubbleRef.translation();
    //     // return { x: position.x, y: position.y, z: position.z };
    //   }
    //   return null;
    // })
    // .filter(Boolean); // Remove any null values
    // setBubblePositions(updatedPositions);

    bubbles.forEach((bubble) => {
      if (bubble.ref.offscreen) bubble.ref.current.sleep();
    });

    const nextBubbles = bubbles.filter((bubble) => !bubble.offscreen);
    if (
      // if the user is blowing
      currentVolume > noiseThreshold
      // and it's been long enough since we've created a bubble
      && currentTime - lastBubbleTime.current > maxBubbleRate
      // and they're making a loop with their fingers
      && loops.length
    ) {
      // add a bubble
      const randomLoop = loops[Math.floor(Math.random() * loops.length)];
      const point = randomPointInPolygon(randomLoop.points);

      setBubbles((prevBubbles) => {
        // Keep only the bubbles that are not offscreen
        // const nextBubbles = prevBubbles.filter((bubble) => !bubble.offscreen);

        // Add new bubbles based on the current volume
        for (let i = 0; i < currentVolume * 10; i += 1) {
          const randomScale = (Math.random() * 1 + 0.5) / 2;
          nextBubbles.push({
            id: Math.random(),
            position: [point.x - 0.5, -point.y + 0.5, Math.random() - 1],
            rotation: [Math.random(), Math.random(), Math.random()],
            scale: [randomScale, randomScale, randomScale],
            ref: createRef(), // Add a ref for each bubble
          });
        }

        return nextBubbles;
      });

      lastBubbleTime.current = currentTime;
    }
  });

  return (
    <Physics
      gravity={[0, 0.5, 0]}
      timestep={1 / 90}
      maxVelocityIterations={1}
      maxPositionIterations={1}
    >
      <group>
        {bubbles.map((bubble, index) => (
          <Bubble
            key={bubble.id}
            bubble={bubble}
            bubblePositions={bubblePositions}
            ref={bubble.ref}
            sharedGeometry={sharedGeometry}
            sharedMaterial={sharedMaterial}
          />
        ))}
      </group>
    </Physics>
  );
}

export default function Scene({ loops, width, height, noiseThreshold, currentVolume, videoElement, mcResolution, mcPolyCount }) {
  const [bubbles, setBubbles] = useState([]);
  const [bubblePositions, setBubblePositions] = useState([]);
  const sharedGeometry = new SphereGeometry(0.1, 12, 24);
  const sharedMaterial = useRef(new MeshStandardMaterial({
    color: new Color(0xeeeeee),
    metalness: 0.3,
    roughness: 0.8,
  }));

  useEffect(() => {
    const loader = new TextureLoader();
    loader.load(
      plusImage,
      (texture) => {
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.repeat.set(3, 2);
        sharedMaterial.current.map = texture;
        sharedMaterial.current.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.error('Texture loading failed', error);
      },
    );
  }, []);

  // useEffect(() => {
  //   console.log(bubblePositions.length)
  // }, [bubblePositions])

  return (
    <Canvas
      className="scene"
      style={{ width, height }}
    >
      <Perf position="bottom-left" />
      <CustomEnvironment videoElement={videoElement} />
      <PerspectiveCamera makeDefault fov={10} near={0.1} far={100} position={[0, 0, 3]} />
      <OrbitControls />
      <directionalLight intensity={1} position={[2, 3, 4]} />
      <Bubbles
        bubbles={bubbles}
        setBubbles={setBubbles}
        setBubblePositions={setBubblePositions}
        bubblePositions={bubblePositions}
        loops={loops}
        noiseThreshold={noiseThreshold}
        currentVolume={currentVolume}
        sharedGeometry={sharedGeometry}
        sharedMaterial={sharedMaterial.current}
      />
      {/*
        < Blobs
        mcResolution={mcResolution}
      mcPolyCount={mcPolyCount}
      bubblePositions={bubblePositions}
      /> */}
    </Canvas>
  );
}
