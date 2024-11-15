import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, MarchingCubes, MarchingCube, MarchingPlane, OrbitControls } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { Color, Vector3 } from 'three';
import { randomPointInPolygon } from '../utils';
import './index.scss';

function Bubble({ bubble, debug }) {
  const [position, setPosition] = useState(bubble.position);

  useFrame(() => {
    setPosition((prevPosition) => {
      bubble.velocity[1] += 0.0005;
      const nextPosition = [...prevPosition];
      nextPosition[0] += bubble.velocity[0];
      nextPosition[1] += bubble.velocity[1];
      nextPosition[2] += bubble.velocity[2];

      if (prevPosition[1] > 1) bubble.offscreen = true;

      return nextPosition;
      // return [prevPosition[0], prevPosition[1] + (bubble.attached ? 0 : 0.005), prevPosition[2] + 0.01];
    });
  });

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.025, 4, 2]} />
      <meshNormalMaterial flatShading />
    </mesh>
  );
}

function Bubbles({ loops, noiseThreshold, currentVolume }) {
  const [bubbles, setBubbles] = useState([]);
  const maxBubbleRate = 50;
  const lastBubbleTime = useRef(new Date().getTime());

  useFrame(() => {
    const currentTime = new Date().getTime();
    if (currentVolume > noiseThreshold
      && currentTime - lastBubbleTime.current > maxBubbleRate
      && loops.length) {
      const randomLoop = loops[Math.floor(Math.random() * loops.length)];
      const point = randomPointInPolygon(randomLoop.points);

      setBubbles((prevBubbles) => {
        const nextBubbles = [...prevBubbles];
        nextBubbles.push({
          id: Math.random(),
          position: [point.x - 0.5, -point.y + 0.5, 0],
          velocity: [0, 0, 0.001],
        });

        return (nextBubbles);
      });
      lastBubbleTime.current = currentTime;
    }

    setBubbles((prevBubbles) => prevBubbles.filter((bubble) => !bubble.offscreen));
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
      <PerspectiveCamera makeDefault fov={15} near={0.1} far={50} position={[0, 0, 3.8]} />
      <OrbitControls />
      <directionalLight />
      <Bubbles
        loops={loops}
        noiseThreshold={noiseThreshold}
        currentVolume={currentVolume}
      />
      <gridHelper args={[1, 10]} rotation={[Math.PI / 2, 0, 0]} />
    </Canvas>
  );
}
