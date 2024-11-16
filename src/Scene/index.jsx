import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, MarchingCubes, MarchingCube, MarchingPlane, OrbitControls, TorusKnot } from '@react-three/drei';
import { Color } from 'three';
import { randomPointInPolygon } from '../utils';
import CustomEnvironment from './CustomEnvironment';
import './index.scss';

function Bubble({ bubble, blob }) {
  const [position, setPosition] = useState(bubble.position);

  useFrame(() => {
    setPosition((prevPosition) => {
      bubble.velocity[1] += 0.00025;
      const nextPosition = [...prevPosition];
      nextPosition[0] += bubble.velocity[0];
      nextPosition[1] += bubble.velocity[1];
      nextPosition[2] += bubble.velocity[2];
      if (prevPosition[1] > 1) bubble.offscreen = true;
      return nextPosition;
    });
  });

  return blob
    ? (<MarchingCube args={[0.0025]} position={position} strength={0.1} subtract={12} />)
    : (
      <mesh position={position} visible={false}>
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
    <>
      <group>
        {bubbles.map((bubble) => (
          <Bubble
            key={bubble.id}
            bubble={bubble}
            debug={debug}
          />
        ))}
      </group>
      {/* <mesh>
        <torusKnotGeometry args={[0.1, 0.03, 128]} />
        <meshStandardMaterial
          metalness={1}
          roughness={0}
        />
      </mesh> */}
      <MarchingCubes
        resolution={50}
        maxPolyCount={50000}
        enableUvs
        enableColors
      >
        {bubbles.map((bubble) => (
          <Bubble
            key={bubble.id}
            bubble={bubble}
            blob
          />
        ))}
        <MarchingPlane
          planeType="z"
          strength={0.5}
          subtract={6}
        />
        <meshPhysicalMaterial
          envMapIntensity={10} // Adjust the intensity of the environment reflection
          metalness={0.3} // Increase metalness for better reflections
          roughness={0.2} // Reduce roughness for sharper reflections
          transmission={0.5}
          reflectivity={1}
          opacity={0.5}
          color={new Color(0xddeecc)}
        />
      </MarchingCubes>
    </>
  );
}

export default function Scene({ loops, width, height, noiseThreshold, currentVolume, videoElement }) {
  return (
    <Canvas
      className="scene"
      style={{ width, height }}
    >
      <CustomEnvironment
        videoElement={videoElement}
      />
      <PerspectiveCamera makeDefault fov={15} near={0.1} far={50} position={[0, 0, 3]} />
      <OrbitControls />
      <directionalLight intensity={10} />
      <Bubbles
        loops={loops}
        noiseThreshold={noiseThreshold}
        currentVolume={currentVolume}
      />
      {/* <gridHelper args={[1, 10]} rotation={[Math.PI / 2, 0, 0]} /> */}
    </Canvas>
  );
}
