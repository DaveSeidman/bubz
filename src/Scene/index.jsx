import React, { useMemo } from 'react';
import { Canvas, extend } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import './index.scss';

function ExtrudedShape({ points, width, height, age }) {
  // console.log(points);
  // Create a shape based on the points provided
  const shape = useMemo(() => {
    const newShape = new THREE.Shape();
    newShape.moveTo((points[0].x / (width)) - 0.5, points[0].y / (height / -1) + 0.5);
    points.slice(1).forEach((point) => {
      newShape.lineTo((point.x / (width)) - 0.5, point.y / (height / -1) + 0.5);
    });
    newShape.closePath();
    return newShape;
  }, [points]);

  // Extrusion settings
  const extrudeSettings = { depth: 3, bevelEnabled: true };

  return (
    <mesh position={[0, 0, -2]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshPhysicalMaterial
        transmission={1}
        thickness={0.01}
        roughness={0}
        clearcoat={1}
        clearcoatRoughness={0}
        reflectivity={0.9}
        attenuationTint={new THREE.Color(0.2, 0.6, 1)}
        attenuationDistance={0.1}
        envMapIntensity={1}
        specularIntensity={0.8}
        ior={1.33}
      />
    </mesh>
  );
}

export default function Scene({ loops, width, height }) {
  return (
    <Canvas className="scene" style={{ width, height }}>
      <Environment preset="city" />

      <PerspectiveCamera makeDefault fov={4} position={[0, 0, 14]} />
      <ambientLight />
      <directionalLight position={[10, 10, 10]} />

      {loops.map((loop, index) => (
        <ExtrudedShape
          key={index}
          points={loop.points}
          width={width}
          height={height}
          age={loop.age}
        />
      ))}
    </Canvas>
  );
}
