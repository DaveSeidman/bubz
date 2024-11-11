import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Extrude } from '@react-three/drei';
import * as THREE from 'three';
import './index.scss';

function ExtrudedShape({ points, width, height }) {
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
  const extrudeSettings = { depth: 1, bevelEnabled: false };

  return (
    <mesh position={[0, 0, -2]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshNormalMaterial transparent opacity={0.5} />
    </mesh>
  );
}

export default function Scene({ loops, width, height }) {
  return (
    <Canvas className="scene" style={{ width, height }}>
      <PerspectiveCamera makeDefault fov={4} position={[0, 0, 10]} />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />

      {loops.map((loop, index) => (
        <ExtrudedShape key={index} points={loop.points} width={width} height={height} />
      ))}
    </Canvas>
  );
}
