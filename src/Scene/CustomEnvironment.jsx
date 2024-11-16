import React, { useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useVideoTexture } from '@react-three/drei';
import { PMREMGenerator } from 'three';

export default function CustomEnvironment({ videoElement }) {
  const { gl, scene } = useThree();
  const pmremGenerator = new PMREMGenerator(gl);
  const videoTexture = useVideoTexture(videoElement.src || videoElement.srcObject, { width: 640, height: 480 });

  useFrame(() => {
    videoTexture.needsUpdate = true;
    const preTexture = pmremGenerator.fromEquirectangular(videoTexture);
    const envMap = preTexture.texture;
    scene.environment = envMap;
  });

  useEffect(() => {
    pmremGenerator.compileEquirectangularShader();
    return (() => {
      videoTexture.dispose();
      pmremGenerator.dispose();
    });
  }, [videoElement]);
}
