import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, MarchingCubes, MarchingCube, MarchingPlane, OrbitControls } from '@react-three/drei';
import { Shape, Color } from 'three';
import './index.scss';

function ExtrudedShape({ points, width, height, age }) {
  const shape = useMemo(() => {
    const newShape = new Shape();
    newShape.moveTo((points[0].x / (width / 2)) - 1, (points[0].y / (height / -2)) + 1);
    points.slice(1).forEach((point) => {
      newShape.lineTo((point.x / (width / 2)) - 1, (point.y / (height / -2)) + 1);
    });
    newShape.closePath();
    return newShape;
  }, [points]);

  const extrudeSettings = {
    depth: age / 10,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.2,
    bevelOffset: -0.1,
    bevelSegments: 12,
    steps: 6,
  };

  return (
    <mesh position={[0, 0, 0]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshPhysicalMaterial
        transmission={0.9}
        metalness={0.3}
        roughness={0.05}
        clearcoat={1}
        clearcoatRoughness={0}
        reflectivity={1}
        envMapIntensity={3}
        ior={1.33}
        attenuationTint={new Color(0.2, 0.6, 1)}
        attenuationDistance={0.1}
      />
    </mesh>
  );
}

function Bubble({ bubble }) {
  const [position, setPosition] = useState(bubble.position);

  useFrame(() => {
    setPosition((prevPosition) => {
      if (prevPosition[1] > 1) bubble.offscreen = true;
      return [prevPosition[0], prevPosition[1] + (bubble.attached ? 0 : 0.005), prevPosition[2] + 0.01];
    });
  });

  return (
    <MarchingCube position={position} strength={0.5} subtract={6} />
  );
}

export default function Scene({ loops, width, height }) {
  const [bubbles, setBubbles] = useState([]);
  const prevLoops = useRef([]);

  useEffect(() => {
    const loopsAdded = loops.filter((loop) => !prevLoops.current.some((prevLoop) => loop.id === prevLoop.id));
    const loopsRemoved = prevLoops.current.filter((prevLoop) => !loops.some((loop) => loop.id === prevLoop.id));

    setBubbles((prevBubbles) => {
      const nextBubbles = [...prevBubbles];
      // Add new bubbles for added loops
      loopsAdded.forEach((loop) => {
        nextBubbles.push({
          id: loop.id,
          center: loop.center,
          color: loop.color,
          position: [(loop.center.x / (width / 2)) - 1, (loop.center.y / (height / -2)) + 1, -1],
          velocity: { x: 0, y: 0, z: 0.1 },
          attached: true,
          offscreen: false,
        });
      });
      // Detach bubbles if the corresponding loop has disappeared
      nextBubbles.forEach((bubble) => {
        if (loopsRemoved.some((removedLoop) => removedLoop.id === bubble.id)) {
          bubble.attached = false;
        }
      });

      return nextBubbles.filter((bubble) => !bubble.offscreen);
    });

    prevLoops.current = loops;
  }, [loops, width, height]);

  return (
    <Canvas className="scene" style={{ width, height }}>
      <Environment preset="city" />
      <PerspectiveCamera makeDefault fov={4} near={0.1} far={50} position={[0, 0, 24]} />
      <OrbitControls />
      <directionalLight />
      <MarchingCubes
        resolution={50}
        maxPolyCount={50000}
        enableUvs
        enableColors
      >
        {bubbles.map((bubble) => (
          <Bubble key={bubble.id} bubble={bubble} />
        ))}
        <MarchingPlane
          planeType="z"
          strength={0.5}
          subtract={6}
        />
        <meshPhysicalMaterial
          color={new Color('rgb(200, 200, 200)')}
          transmission={0.9}
          roughness={0.1}
          metalness={0.3}
        />
      </MarchingCubes>
    </Canvas>
  );
}
