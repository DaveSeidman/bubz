import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, MarchingCubes } from '@react-three/drei';
import { Perf } from 'r3f-perf';
import Environment from './Environment';
import Bubbles from './Bubbles';
import Blobs from './Blobs';
import './index.scss';

export default function Scene({ loops, width, height, noiseThreshold, currentVolume, videoElement, mcResolution, mcPolyCount, debug }) {
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    console.log(debug);
  }, [debug]);

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
      <Bubbles
        debug={debug}
        bubbles={bubbles}
        setBubbles={setBubbles}
        loops={loops}
        noiseThreshold={noiseThreshold}
        currentVolume={currentVolume}
      />
      {!debug && (
        <Blobs
          // debug={debug}
          bubbles={bubbles}
          mcPolyCount={mcPolyCount}
          mcResolution={mcResolution}
        />
      )}
    </Canvas>
  );
}
