import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useVideoTexture } from '@react-three/drei';
import { PMREMGenerator } from 'three';

export default function Environment({ videoElement }) {
  const { gl, scene } = useThree();
  const pmremGenerator = new PMREMGenerator(gl);
  const videoTexture = useVideoTexture(videoElement.srcObject, {
    width: 640,
    height: 480,
  });

  useEffect(() => {
    if (!videoTexture || !videoElement) return;

    let preTexture = pmremGenerator.fromEquirectangular(videoTexture);
    scene.environment = preTexture.texture;

    const handleTimeUpdate = () => {
      preTexture.dispose();
      preTexture = pmremGenerator.fromEquirectangular(videoTexture);
      scene.environment = preTexture.texture;
    };

    const interval = setInterval(handleTimeUpdate, 60);

    return () => {
      clearInterval(interval);
      preTexture.texture.dispose();
      pmremGenerator.dispose();
      videoTexture.dispose();
    };
  }, [videoTexture, videoElement]);
}
