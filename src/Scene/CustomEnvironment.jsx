import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useVideoTexture } from '@react-three/drei';
import { PMREMGenerator } from 'three';

export default function CustomEnvironment({ videoElement }) {
  const { gl, scene } = useThree();
  const pmremGenerator = new PMREMGenerator(gl);
  const videoTexture = useVideoTexture(videoElement.src || videoElement.srcObject, {
    width: 640,
    height: 480,
  });

  useEffect(() => {
    if (!videoTexture || !videoElement) return;

    let preTexture = pmremGenerator.fromEquirectangular(videoTexture);
    scene.environment = preTexture.texture;

    const handleTimeUpdate = () => {
      // preTexture.texture.dispose();
      preTexture.dispose();
      preTexture = pmremGenerator.fromEquirectangular(videoTexture);
      scene.environment = preTexture.texture;
    };

    // videoElement.addEventListener('timeupdate', handleTimeUpdate);
    const interval = setInterval(handleTimeUpdate, 100);

    return () => {
      clearInterval(interval);
      // videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      preTexture.texture.dispose();
      pmremGenerator.dispose();
      videoTexture.dispose();
    };
  }, [videoTexture, videoElement]);

  return null;
}
