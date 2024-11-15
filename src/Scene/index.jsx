import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, MarchingCubes, MarchingCube, MarchingPlane, OrbitControls } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { Color, Vector3 } from 'three';
import './index.scss';

function Bubble({ bubble, debug }) {
  const [position, setPosition] = useState(bubble.position);

  useFrame(() => {
    setPosition((prevPosition) => {
      if (prevPosition[1] > 1) bubble.offscreen = true;
      return [prevPosition[0], prevPosition[1] + (bubble.attached ? 0 : 0.005), prevPosition[2] + 0.01];
    });
  });

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.2, 8, 16]} />
      <meshNormalMaterial />
    </mesh>
  );
}

function Bubbles({ loops, noiseThreshold, currentVolume }) {
  const [bubbles, setBubbles] = useState([]);
  const maxBubbleRate = 200;
  const lastBubbleTime = useRef(new Date().getTime());
  useFrame(() => {
    const currentTime = new Date().getTime();
    if (
      currentVolume > noiseThreshold
      && currentTime - lastBubbleTime.current > maxBubbleRate
      && loops.length) {
      const randomLoop = loops[Math.floor(Math.random() * loops.length)];
      console.log(randomLoop);

      // setBubbleds((prevBubbles) => {
      //   const nextBubbles = [...prevBubbles].push({
      //     loopId:
      //   })

      // })
      lastBubbleTime.current = currentTime;
    }
  });

  return (
    <group>
      {bubbles.map((bubble) => (
        <Bubble
          key={bubble.id}
          bubble={bubble}
          debug={debug}
        />
      ))}
    </group>
  );
}

export default function Scene({ loops, width, height, debug, noiseThreshold, currentVolume }) {
  return (
    <Canvas
      className="scene"
      style={{ width, height }}
    >
      <Environment preset="city" />
      <PerspectiveCamera makeDefault fov={4} near={0.1} far={50} position={[0, 0, 24]} />
      <OrbitControls />
      <directionalLight />
      <Bubbles
        loops={loops}
        noiseThreshold={noiseThreshold}
        currentVolume={currentVolume}
      />
    </Canvas>
  );
}
