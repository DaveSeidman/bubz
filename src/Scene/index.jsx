import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  PerspectiveCamera,
  OrbitControls,
} from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Perf } from 'r3f-perf';
import Environment from './Environment';
import Bubbles from './Bubbles'; // Import your Bubbles component
import './index.scss';

export default function Scene({
  loops,
  width,
  height,
  noiseThreshold,
  currentVolume,
  videoElement,
  mcResolution,
  mcPolyCount,
}) {
  const [bubbles, setBubbles] = useState([]);

  return (
    <Canvas className="scene" style={{ width, height }}>
      <Perf position="bottom-left" />
      <Environment videoElement={videoElement} />
      <PerspectiveCamera
        makeDefault
        fov={10}
        near={0.1}
        far={100}
        position={[0, 0, 3]}
      />
      <OrbitControls />
      <directionalLight intensity={1} position={[2, 3, 4]} />
      <Physics gravity={[0, 0.2, 0]}>
        <Bubbles
          bubbles={bubbles}
          setBubbles={setBubbles}
          loops={loops}
          noiseThreshold={noiseThreshold}
          currentVolume={currentVolume}
        />
      </Physics>
    </Canvas>
  );
}
