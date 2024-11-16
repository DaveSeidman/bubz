import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useVideoTexture } from '@react-three/drei';
import { VideoTexture, PMREMGenerator } from 'three';
// import videoSrc from '../assets/test-vid.mp4';

function CustomEnvironment({ videoElement, setEnvMap }) {
  const { gl } = useThree();
  const count = useRef(0);

  useEffect(() => {
    const timeupdate = () => {
      count.current += 1;
      const videoTexture = new VideoTexture(videoElement);
      videoTexture.needsUpdate = true; // Important to update the texture
      const pmremGenerator = new PMREMGenerator(gl);
      pmremGenerator.compileEquirectangularShader();
      if (count.current) setEnvMap(pmremGenerator.fromEquirectangular(videoTexture).texture);
      videoTexture.dispose();
      pmremGenerator.dispose();
    };
    console.log('here');
    videoElement.addEventListener('timeupdate', timeupdate);

    return (() => {
      videoElement.removeEventListener('timeupdate', timeupdate);
    });
  }, [videoElement]);

  return null;
}

export default CustomEnvironment;
