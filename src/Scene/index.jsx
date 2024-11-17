import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, MarchingCubes, MarchingCube, MarchingPlane, OrbitControls, TorusKnot } from '@react-three/drei';
import { Color } from 'three';
import { randomPointInPolygon } from '../utils';
import CustomEnvironment from './CustomEnvironment';
import './index.scss';
import { Physics, RigidBody, useRapier } from '@react-three/rapier';

function Bubble({ bubble }) {
  const bubbleRef = useRef();
  useFrame(() => {
    if (bubbleRef.current) {
      const position = bubbleRef.current.translation();
      if (position.x < -2 || position.x > 2 || position.y < -2 || position.y > 2) {
        bubble.offscreen = true;
      }
    }
  });

  return (
    <RigidBody
      ref={bubbleRef}
      position={bubble.position}
      type="dynamic"
      onReady={(body) => {
        console.log('here', body);
        body.applyImpulse(
          { x: (Math.random() - 0.5) * 0.1, y: Math.random() * 0.1 + 0.2, z: 0 },
          true,
        );
      }}
    >
      <mesh>
        <sphereGeometry args={[0.2, 12, 6]} />
        <meshNormalMaterial />
      </mesh>
    </RigidBody>
  );
}

function Bubbles({ loops, noiseThreshold, currentVolume, mcResolution, mcPolyCount, debug }) {
  const [bubbles, setBubbles] = useState([]);
  const maxBubbleRate = 50;
  const lastBubbleTime = useRef(new Date().getTime());
  useFrame(() => {
    console.log(bubbles.length);
    const currentTime = new Date().getTime();
    if (currentVolume > noiseThreshold
      && currentTime - lastBubbleTime.current > maxBubbleRate
      && loops.length) {
      const randomLoop = loops[Math.floor(Math.random() * loops.length)];
      const point = randomPointInPolygon(randomLoop.points);

      setBubbles((prevBubbles) => {
        const nextBubbles = [...prevBubbles];
        // blow more bubbles depending on volume
        for (let i = 0; i < currentVolume * 10; i += 1) {
          nextBubbles.push({
            id: Math.random(),
            position: [point.x - 0.5, -point.y + 0.5, -1],
            velocity: [Math.random() * 0.005 - 0.0025, 0, 0.01],
          });
        }

        return (nextBubbles);
      });
      lastBubbleTime.current = currentTime;
    }

    setBubbles((prevBubbles) => prevBubbles.filter((bubble) => !bubble.offscreen));
  });

  return (
    // debug
    //   ? (
    <Physics gravity={[0, -0.1, 0]}>
      <group>
        {bubbles.map((bubble) => (
          <Bubble
            key={bubble.id}
            bubble={bubble}
            debug={debug}
          />
        ))}
      </group>
    </Physics>
  );
}

export default function Scene({ loops, width, height, noiseThreshold, currentVolume, videoElement, mcResolution, mcPolyCount, debug }) {
  return (
    <Canvas
      className="scene"
      style={{ width, height }}
    >
      <CustomEnvironment
        videoElement={videoElement}
      />
      <PerspectiveCamera
        makeDefault
        fov={15}
        near={0.1}
        // far={3.82}
        far={100}
        position={[0, 0, 3]}
      />
      <OrbitControls />
      <directionalLight intensity={1} />
      <Bubbles
        debug={debug}
        loops={loops}
        noiseThreshold={noiseThreshold}
        currentVolume={currentVolume}
        mcResolution={mcResolution}
        mcPolyCount={mcPolyCount}
      />
      {/* <gridHelper args={[1, 10]} rotation={[Math.PI / 2, 0, 0]} /> */}
    </Canvas>
  );
}
