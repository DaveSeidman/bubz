import React, { forwardRef } from 'react';
import { RigidBody } from '@react-three/rapier';

const Bubble = forwardRef(({ bubble, texture, balls }, ref) => (
  <RigidBody
    ref={ref}
    colliders="ball"
    // sensor
    position={bubble.position}
    rotation={bubble.rotation}
    type="dynamic"
    linearDamping={1}
    angularDamping={10}
    friction={0.01}
    mass={bubble.scale}
    restitution={0.1}
    canSleep={false}
    onReady={(body) => {
      body.applyImpulse(
        {
          x: Math.random() * 0.5 - 0.25,
          y: Math.random() * 0.5 - 0.25,
          z: 1,
        },
        true,
      );
    }}
  >
    <mesh
      castShadow
      receiveShadow
      scale={[bubble.scale, bubble.scale, bubble.scale]}
    >
      <sphereGeometry args={[1, 16, 8]} />
      <meshStandardMaterial
        map={texture}
        visible={balls}
        envMapIntensity={1}
        metalness={0.1}
        roughness={0.1}
        color={0xbbbbbb}
      />
    </mesh>
  </RigidBody>
));

export default Bubble;
