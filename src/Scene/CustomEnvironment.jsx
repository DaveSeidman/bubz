import React, { useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useVideoTexture } from '@react-three/drei';
import { PMREMGenerator } from 'three';

export default function CustomEnvironment({ videoElement }) {
  const { gl, scene } = useThree();
  const pmremGenerator = new PMREMGenerator(gl);
  const videoTexture = useVideoTexture(videoElement.src || videoElement.srcObject, { width: 640, height: 480 });
  let lastTexture = null; // Keep track of the last texture to dispose of it.

  useFrame(() => {
    videoTexture.needsUpdate = true;

    // Generate a new texture for the environment
    const preTexture = pmremGenerator.fromEquirectangular(videoTexture);
    const envMap = preTexture.texture;

    // Dispose of the previous texture if it exists
    if (lastTexture) {
      lastTexture.dispose();
    }

    // Set the environment map and track the current texture
    scene.environment = envMap;
    lastTexture = preTexture;
  });

  useEffect(() => {
    pmremGenerator.compileEquirectangularShader();

    return () => {
      // Cleanup resources on component unmount
      if (lastTexture) {
        lastTexture.dispose();
      }
      videoTexture.dispose();
      pmremGenerator.dispose();
    };
  }, [videoElement]);

  return null;
}
