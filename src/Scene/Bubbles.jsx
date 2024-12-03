import React, { createRef, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Physics } from '@react-three/rapier';

import { RepeatWrapping } from 'three';
import Bubble from './Bubble'; // Import your Bubble component
import plusImage from '../assets/plus.png';
import { randomPointInPolygon } from '../utils';

function Bubbles({ bubbles, setBubbles, loops, noiseThreshold, currentVolume, balls }) {
  const maxBubbleRate = 20;
  const lastBubbleTime = useRef(new Date().getTime());
  const texture = useTexture(plusImage);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 2);

  const inView = (bubble) => {
    if (bubble.ref.current) {
      const position = bubble.ref.current.translation();
      return (position.x > -0.5
        && position.x < 0.5
        && position.y > -0.5
        && position.y < 0.5
      );
    }
    return true;
  };

  const bubbleCount = useRef(0);

  useFrame(() => {
    const currentTime = new Date().getTime();

    setBubbles((prevBubbles) => {
      const nextBubbles = [];

      prevBubbles.forEach((bubble) => {
        if (inView(bubble)) {
          if (bubble.ref.current) {
            // get this bubbles position
            const position = bubble.ref.current.translation();
            const attractionForce = { x: 0, y: 0, z: 0 };
            // in relation to all oother bubbles
            prevBubbles.forEach((otherBubble, i) => {
              if (otherBubble !== bubble && otherBubble.ref.current) {
                const otherPosition = otherBubble.ref.current.translation();

                const dx = otherPosition.x - position.x;
                const dy = otherPosition.y - position.y;
                const dz = otherPosition.z - position.z;
                const distanceSq = dx * dx + dy * dy + dz * dz;

                const minDistanceSq = 0.1 * 0.1; // Avoid division by zero
                const maxDistanceSq = 0.3 * 0.3; // Limit attraction range
                // if a bubble is close enough, add a small attraction force
                if (distanceSq > minDistanceSq && distanceSq < maxDistanceSq) {
                  const strength = 0.00000025 / distanceSq; // Force inversely proportional to distance squared
                  attractionForce.x += dx * strength;
                  attractionForce.y += dy * strength;
                  attractionForce.z += dz * strength;
                }
              }
            });

            bubble.ref.current.applyImpulse(attractionForce, true);
          }
          nextBubbles.push(bubble);
        }
      });

      if (
        currentVolume > noiseThreshold
        // && currentTime - lastBubbleTime.current > maxBubbleRate
        && loops.length
      ) {
        for (let i = 0; i < currentVolume * 5; i += 1) {
          const randomLoop = loops[Math.floor(Math.random() * loops.length)];
          const randomPoint = randomPointInPolygon(randomLoop.points);
          const newBubble = {
            id: bubbleCount.current,
            position: [randomPoint.x - 0.5, -randomPoint.y + 0.5, Math.random() * 0.5 - 0.5],
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
            scale: Math.random() * 0.025 + 0.025,
            ref: createRef(),
          };
          nextBubbles.push(newBubble);
          bubbleCount.current += 1;
        }
        lastBubbleTime.current = currentTime;
      }

      return nextBubbles;
    });
  });

  return (
    <Physics
      gravity={[0, 0.2, 0]}
      timeStep={1 / 60}
      maxCcdSubsteps={2}
      numSolverIterations={1}
    >
      {bubbles.map((bubble) => (
        <Bubble
          ref={bubble.ref}
          key={bubble.id}
          bubble={bubble}
          texture={texture}
          balls={balls}
        />
      ))}
    </Physics>
  );
}

export default Bubbles;
