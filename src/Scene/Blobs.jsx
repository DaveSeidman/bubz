import React, { useEffect, useState } from 'react';
import { MarchingCubes, MarchingCube, MarchingPlane, MeshTransmissionMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { MeshBasicMaterial } from 'three';

extend({ MeshTransmissionMaterial });

export default function Blobs({ bubbles, mcResolution, mcPolyCount }) {
  return (
    <MarchingCubes
      resolution={mcResolution}
      maxPolyCount={mcPolyCount}
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
              strength={0.2}
              subtract={24}
            />
          );
        }
      })}
      {/* <MarchingPlane
        planeType="z"
        strength={4}
        subtract={1}
      /> */}
      {/* <MeshTransmissionMaterial
        transmission={0.9}
        roughness={0.01}
        // opacity={0.1}
        color="0xffffff"
        distortion={1}
      /> */}
      <meshPhysicalMaterial
        envMapIntensity={1} // Adjust the intensity of the environment reflection
        metalness={0.6} // Increase metalness for better reflections
        roughness={0.1} // Reduce roughness for sharper reflections
        transmission={0.9}
        reflectivity={0.9}
      />
      {/* <meshNormalMaterial /> */}
    </MarchingCubes>
  );
}
