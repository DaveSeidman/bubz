import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { randomPointInPolygon } from '../utils';
import CustomEnvironment from './CustomEnvironment';
import './index.scss';
import { Physics, RigidBody } from '@react-three/rapier';

function Bubble({ bubble, bubblePositions, index }) {
  const bubbleRef = useRef();

  useFrame(() => {
    if (bubbleRef.current) {
      const position = bubbleRef.current.translation();

      // Update the shared array with the current bubble's position
      bubblePositions[index] = { x: position.x, y: position.y, z: position.z };

      // Check if the bubble is offscreen
      if (position.x < -2 || position.x > 2 || position.y < -2 || position.y > 2) {
        bubble.offscreen = true;
      }

      // Attraction logic
      const attractionForce = { x: 0, y: 0, z: 0 };
      bubblePositions.forEach((otherPosition, i) => {
        if (i !== index) {
          const dx = otherPosition.x - position.x;
          const dy = otherPosition.y - position.y;
          const dz = otherPosition.z - position.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance > 0.01 && distance < 0.3) { // Avoid division by zero and limit attraction range
            const strength = 0.001 / (distance * distance); // Force inversely proportional to distance squared
            attractionForce.x += dx * strength;
            attractionForce.y += dy * strength;
            attractionForce.z += dz * strength;
          }
        }
      });

      // Apply the attraction force
      bubbleRef.current.applyImpulse(attractionForce, true);
    }
  });

  return (
    <RigidBody
      colliders="ball"
      ref={bubbleRef}
      position={bubble.position}
      type="dynamic"
      linearDamping={10000}
      friction={0.2}
      // mass={1}
      // angularDamping={2000} // Added angular damping to prevent erratic rotation
      // restitution={0.1} // Reduce bounce
      // softCcdPrediction={0}
      enabledRotations={[false, false, false]}
      // friction={0.2}
      onReady={(body) => {
        body.applyImpulse(
          {
            x: (Math.random() * 0.5) - 0.25,
            y: (Math.random() * 0.5) - 0.25,
            z: 1,
          },
          true,
        );
      }}
    >
      <mesh>
        <sphereGeometry args={[bubble.size, 6, 6]} />
        <meshNormalMaterial />
      </mesh>
    </RigidBody>
  );
}

function Bubbles({ loops, noiseThreshold, currentVolume }) {
  const [bubbles, setBubbles] = useState([]);
  const bubblePositions = useRef([]); // Shared array to track bubble positions
  const maxBubbleRate = 50;
  const lastBubbleTime = useRef(new Date().getTime());

  useFrame(() => {
    const currentTime = new Date().getTime();
    if (
      currentVolume > noiseThreshold
      && currentTime - lastBubbleTime.current > maxBubbleRate
      && loops.length
    ) {
      const randomLoop = loops[Math.floor(Math.random() * loops.length)];
      const point = randomPointInPolygon(randomLoop.points);

      setBubbles((prevBubbles) => {
        const nextBubbles = [...prevBubbles];
        for (let i = 0; i < currentVolume * 10; i += 1) {
          nextBubbles.push({
            id: Math.random(),
            position: [point.x - 0.5, -point.y + 0.5, -1],
            size: 0.05 + (Math.random() * 0.02),
          });
        }

        // Resize the positions array to match the bubbles array
        bubblePositions.current = nextBubbles.map((bubble, index) => bubblePositions.current[index] || { x: 0, y: 0, z: 0 });

        return nextBubbles;
      });
      lastBubbleTime.current = currentTime;
    }

    setBubbles((prevBubbles) => prevBubbles.filter((bubble) => !bubble.offscreen));
  });

  return (
    <Physics
      gravity={[0, -0.9, 0]}
      timestep={1 / 90}
      maxVelocityIterations={2}
      maxPositionIterations={2}
    >
      <group>
        {bubbles.map((bubble, index) => (
          <Bubble
            key={bubble.id}
            bubble={bubble}
            bubblePositions={bubblePositions.current}
            index={index}
          />
        ))}
      </group>
    </Physics>
  );
}

export default function Scene({ loops, width, height, noiseThreshold, currentVolume, videoElement }) {
  return (
    <Canvas
      className="scene"
      style={{ width, height }}
    >
      <CustomEnvironment videoElement={videoElement} />
      <PerspectiveCamera makeDefault fov={15} near={0.1} far={100} position={[0, 0, 3]} />
      <OrbitControls />
      <directionalLight intensity={1} />
      <Bubbles
        loops={loops}
        noiseThreshold={noiseThreshold}
        currentVolume={currentVolume}
      />
    </Canvas>
  );
}
