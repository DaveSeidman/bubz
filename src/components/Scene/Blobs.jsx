import React from 'react';
import { MarchingCubes, MarchingCube, MeshTransmissionMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

extend({ MeshTransmissionMaterial });

export default function Blobs({ bubbles, mcResolution, mcPolyCount }) {
  return (
    <MarchingCubes
      resolution={mcResolution}
      maxPolyCount={mcPolyCount}
    // TODO: re-enable uvs give each bubble a random color
    // enableUvs
    // enableColors
    // visible={false}
    >
      {bubbles.map((bubble) => {
        if (bubble.ref.current) {
          const { x, y, z } = bubble.ref.current.translation();
          return (
            <MarchingCube
              key={bubble.id}
              position={[x, y, z]}
              strength={bubble.scale * 10}
              subtract={64}
            />
          );
        }
      })}
      {/* <MarchingPlane
        planeType="z"
        strength={4}
        subtract={1}
      /> */}
      <MeshTransmissionMaterial
        transmission={0.98}
        roughness={0.1}
        thickness={0.02}
        // distortion={0.2}
        // distortionScale={0.5}
        backside
        // samples={16}
        // envMapIntensity={200}
        chromaticAberration={20}
        // opacity={0.1}
        color={0xeeeeee}
        metalness={0.25}
      />
    </MarchingCubes>
  );
}
