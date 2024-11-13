import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, MarchingCubes, MarchingCube, MarchingPlane, OrbitControls } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { Color, Vector3 } from 'three';
import './index.scss';

function Bubble({ bubble, debug }) {
  const [position, setPosition] = useState(bubble.position);

  useFrame(() => {
    setPosition((prevPosition) => {
      if (prevPosition[1] > 1) bubble.offscreen = true;
      return [prevPosition[0], prevPosition[1] + (bubble.attached ? 0 : 0.005), prevPosition[2] + 0.01];
    });
  });

  return (debug ? (
    <mesh position={position}>
      <sphereGeometry args={[0.2, 8, 16]} />
      <meshNormalMaterial />
    </mesh>
  )
    : (<MarchingCube position={position} strength={0.5} subtract={6} />)
  );
}

function BouncingSphere({ bubbles, impulseTrigger }) {
  const sphereRef = useRef();
  const maxSpeed = 0.005;

  useEffect(() => {
    if (impulseTrigger && sphereRef.current) {
      // sphereRef.current.applyImpulse({ x: 0, y: 0.1, z: 0 }, true);
      sphereRef.current.setTranslation({ x: 0, y: 0, z: 0 }, true);
    }
  }, [impulseTrigger]);

  useFrame(() => {
    if (bubbles.length && sphereRef.current) {
      const bubblePosition = new Vector3(...bubbles[0].position);
      const spherePosition = new Vector3().copy(sphereRef.current.translation());

      // Calculate the direction vector from the sphere to the bubble
      const direction = bubblePosition.sub(spherePosition);
      const distance = direction.length();

      // Normalize the direction and calculate speed based on inverse-square law
      direction.normalize();
      const speed = Math.min(maxSpeed, 0.05 / (distance * distance)); // Cap speed based on distance
      const velocity = direction.multiplyScalar(speed);

      // Set the linear velocity directly
      sphereRef.current.addForce(velocity, true);
    }
  });

  return (
    <RigidBody
      ref={sphereRef}
      restitution={0.8}
      friction={0.2}
      linearDamping={5}
    >
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </RigidBody>
  );
}

function GroundPlane() {
  return (
    <RigidBody type="fixed" restitution={0.8} friction={0.5}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="lightgrey" />
      </mesh>
    </RigidBody>
  );
}

export default function Scene({ loops, width, height, debug }) {
  const [bubbles, setBubbles] = useState([]);
  const prevLoops = useRef([]);
  const [impulseTrigger, setImpulseTrigger] = useState(false); // State to trigger the impulse

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

  useEffect(() => {
    setImpulseTrigger(false);
  }, [impulseTrigger]);

  return (
    <Canvas
      className="scene"
      style={{ width, height }}
      onClick={() => { setImpulseTrigger(true); }}
    >
      <Environment preset="city" />
      <PerspectiveCamera makeDefault fov={4} near={0.1} far={50} position={[0, 0, 24]} />
      <OrbitControls />
      <directionalLight />

      {debug ? (
        <group>
          {bubbles.map((bubble) => (
            <Bubble
              key={bubble.id}
              bubble={bubble}
              debug={debug}
            />
          ))}
        </group>
      )
        : (
          <MarchingCubes
            resolution={50}
            maxPolyCount={50000}
            enableUvs
            enableColors
          >
            {bubbles.map((bubble) => (
              <Bubble
                key={bubble.id}
                bubble={bubble}
              />
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
        )}
      <Physics gravity={[0, 0.01, 0]}>
        <BouncingSphere
          impulseTrigger={impulseTrigger}
          bubbles={bubbles}
        />
        <GroundPlane />
      </Physics>
    </Canvas>
  );
}
