import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { EffectComposer, SSAO } from '@react-three/postprocessing';
import { Perf } from 'r3f-perf';
import Environment from './Environment';
import Bubbles from './Bubbles';
import Blobs from './Blobs';
import './index.scss';

export default function Scene({ loops, width, height, noiseThreshold, currentVolume, videoElement, mcResolution, mcPolyCount, debug }) {
  const [bubbles, setBubbles] = useState([]);

  return (
    <Canvas
      className="scene"
      style={{ width, height }}
      gl={{ alpha: true, stencil: false, depth: false, antialias: false }}
      shadows
      onCreated={(state) => (state.gl.toneMappingExposure = 1.5)}
    >
      <Perf position="bottom-left" />
      <Environment videoElement={videoElement} />
      <PerspectiveCamera
        makeDefault
        fov={10}
        near={0.01}
        far={10}
        position={[0, 0, 3]}
      />
      <OrbitControls />
      {/* <ambientLight intensity={3} /> */}
      {/* <directionalLight castShadow intensity={2} position={[2, 3, 4]} /> */}
      <spotLight position={[4, 2, 2]} intensity={300} penumbra={0.1} angle={2} color="white" castShadow shadow-mapSize={[64, 64]} />
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
          bubbles={bubbles}
          mcPolyCount={mcPolyCount}
          mcResolution={mcResolution}
        />
      )}

    </Canvas>
  );
}
