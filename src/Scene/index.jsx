import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer, SSAO } from '@react-three/postprocessing';
import { Perf } from 'r3f-perf';
import Environment from './Environment';
import Bubbles from './Bubbles';
import Blobs from './Blobs';

export default function Scene({ stats, loops, width, height, noiseThreshold, currentVolume, videoElement, mcResolution, mcPolyCount, balls, blobs }) {
  const [bubbles, setBubbles] = useState([]);

  return (
    <Canvas
      className="scene"
      style={{ width, height }}
      gl={{ alpha: true, stencil: false, depth: true, antialias: false }}
      dpr={0.75}
    // shadows
    // onCreated={(state) => (state.gl.toneMappingExposure = 2)}
    >
      <Perf position="bottom-left" className={`stats ${stats ? '' : 'hidden'}`} />
      <Environment videoElement={videoElement} />
      <PerspectiveCamera
        makeDefault
        fov={10}
        near={0.01}
        far={10}
        position={[0, 0, 5]}
      />
      {/* <OrbitControls /> */}
      {/* <ambientLight intensity={3} /> */}
      <directionalLight intensity={2} position={[2, 3, 4]} />
      {/* <spotLight position={[1, 2, 1]} intensity={300} penumbra={0.1} angle={2} color="white" castShadow shadow-mapSize={[64, 64]} /> */}
      <Bubbles
        balls={balls}
        bubbles={bubbles}
        setBubbles={setBubbles}
        loops={loops}
        noiseThreshold={noiseThreshold}
        currentVolume={currentVolume}
      />
      {blobs && (
        <Blobs
          bubbles={bubbles}
          mcPolyCount={mcPolyCount}
          mcResolution={mcResolution}
        />
      )}
      {/* <EffectComposer>
        <Bloom
          luminanceThreshold={0.7}
          intensity={3}
        // resolutionScale={2}
        />
      </EffectComposer> */}
    </Canvas>
  );
}
