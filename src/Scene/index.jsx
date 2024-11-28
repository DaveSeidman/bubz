// TODO: add post processing for debug view, ssao

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, MarchingCubes, MarchingCube, MarchingPlane, useTexture } from '@react-three/drei';
import { Color, Texture, SphereGeometry, RepeatWrapping, MeshStandardMaterial, TextureLoader } from 'three';
import { Physics, RigidBody } from '@react-three/rapier';
import { Perf } from 'r3f-perf';
import { randomPointInPolygon } from '../utils';
import plusImage from '../assets/plus.png';
import CustomEnvironment from './CustomEnvironment';

import './index.scss';

function Blobs({ mcResolution, mcPolyCount, bubbles }) {
  // console.log(bubblePositions.length)
  return (
    <MarchingCubes
      resolution={mcResolution}
      maxPolyCount={mcPolyCount}
    // enableUvs
    // enableColors
    // visible={false}
    >
      {bubbles.map((bubble) => (
        <MarchingCube
          key={bubble.id}
          position={[bubble.position[0] * 1, bubble.position[1] * 1, bubble.position[2] + 2]}
          strength={.3}
          subtract={12}
        // bubble={bubble}
        />
      ))}
      {/* <MarchingPlane
        planeType="z"
        strength={0.5}
        subtract={2}
      /> */}
      <meshPhysicalMaterial
        envMapIntensity={4} // Adjust the intensity of the environment reflection
        metalness={0.1} // Increase metalness for better reflections
        roughness={0.2} // Reduce roughness for sharper reflections
        transmission={0.99}
        reflectivity={0.9}
        // opacity={0.5}
        color={new Color(0xbbddee)}
      />
    </MarchingCubes>
  );
}

function Bubble({ bubble, bubbles, index, sharedGeometry, sharedMaterial }) {
  const bubbleRef = useRef();

  useFrame(() => {
    if (bubbleRef.current) {
      const position = bubbleRef.current.translation();
      // bubblePositions[index] = { x: position.x, y: position.y, z: position.z };

      if (position.x < -1.5 || position.x > 1.5 || position.y < -1.5 || position.y > 1.5) {
        bubble.offscreen = true;
      }

      // Attraction logic
      const attractionForce = { x: 0, y: 0, z: 0 };


      bubbles.forEach((otherBubble, i) => {
        if (i === index) {
          // console.log(otherBubble)
        }
        if (i !== index) {
          const dx = otherBubble.position.x - position.x;
          const dy = otherBubble.position.y - position.y;
          const dz = otherBubble.position.z - position.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance > 0.01 && distance < 0.3) { // Avoid division by zero and limit attraction range
            const strength = 0.0000025 / (distance * distance); // Force inversely proportional to distance squared
            attractionForce.x += dx * strength;
            attractionForce.y += dy * strength;
            attractionForce.z += dz * strength;
          }
        }
      });

      // Apply the attraction force
      bubbleRef.current.applyImpulse(attractionForce, true);
    }
  });

  return (
    <RigidBody
      colliders="ball"
      ref={bubbleRef}
      position={bubble.position}
      // rotation={bubble.rotation}
      type="dynamic"
      linearDamping={1}
      friction={0.01}
      restitution={0.1}
      softCcdPrediction={0}
      // enabledRotations={[true, true, true]}
      // canSleep
      onReady={(body) => {
        body.applyImpulse(
          {
            x: (Math.random() * 0.5) - 0.25,
            y: (Math.random() * 0.5) - 0.25,
            z: 1,
          }
        );
      }}
    // mass={1}
    // angularDamping={2000} // Added angular damping to prevent erratic rotation
    // restitution={0.1} // Reduce bounce
    // friction={0.2}
    >
      <mesh scale={bubble.scale} rotation={bubble.rotation} geometry={sharedGeometry} material={sharedMaterial} />
    </RigidBody>
  );
}

function Bubbles({ bubbles, setBubbles, loops, noiseThreshold, currentVolume, sharedGeometry, sharedMaterial }) {
  // const [bubbles, setBubbles] = useState([]);
  // const bubblePositions = useRef([]); // Shared array to track bubble positions
  const maxBubbleRate = 50;
  const lastBubbleTime = useRef(new Date().getTime());


  useFrame(() => {
    const currentTime = new Date().getTime();
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
        const nextBubbles = [...prevBubbles.filter(bubble => !bubble.offscreen)];
        // make more or less bubbles depending on the volume
        for (let i = 0; i < currentVolume * 10; i += 1) {

          const randomScale = ((Math.random() * 2) + 1) / 3
          nextBubbles.push({
            id: Math.random(),
            position: [point.x - 0.5, -point.y + 0.5, Math.random() - 3],
            rotation: [Math.random(), Math.random(), Math.random()],
            scale: [randomScale, randomScale, randomScale],
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
      // interpolate={false}
      maxVelocityIterations={1}
      maxPositionIterations={1}
    >
      <group>
        {bubbles.map((bubble, index) => (
          <Bubble
            key={bubble.id}
            bubble={bubble}
            bubbles={bubbles}
            // bubblePositions={bubblePositions.current}
            index={index}
            sharedGeometry={sharedGeometry}
            sharedMaterial={sharedMaterial}
          />
        ))}
      </group>
    </Physics>
  );
}

export default function Scene({ loops, width, height, noiseThreshold, currentVolume, videoElement, mcResolution, mcPolyCount }) {
  const [bubbles, setBubbles] = useState([])
  // const [bubblePositions, setBubblePositions] = useState([]);
  const sharedGeometry = new SphereGeometry(0.1, 12, 24);
  const sharedMaterial = useRef(new MeshStandardMaterial({
    color: new Color(0xffffff),
    metalness: .3,
    roughness: .8,
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
      }
    );
  }, []);

  return (
    <Canvas
      className="scene"
      style={{ width, height }}
    >
      <Perf
        position="bottom-left"
      // style={'transform: scaleX(-1)'}
      // deepAnalyze
      />
      <CustomEnvironment videoElement={videoElement} />
      <PerspectiveCamera makeDefault fov={10} near={0.1} far={100} position={[0, 0, 3]} />
      <OrbitControls />
      <directionalLight intensity={1} position={[2, 3, 4]} />
      <Bubbles
        bubbles={bubbles}
        setBubbles={setBubbles}
        loops={loops}
        noiseThreshold={noiseThreshold}
        currentVolume={currentVolume}
        // setBubblePositions={setBubblePositions}
        sharedGeometry={sharedGeometry}
        sharedMaterial={sharedMaterial.current}
      />
      {/* <Blobs
        mcResolution={mcResolution}
        mcPolyCount={mcPolyCount}
        // bubblePositions={bubblePositions}
        bubbles={bubbles}
      /> */}
    </Canvas>
  );
}
