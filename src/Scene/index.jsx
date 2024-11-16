import React, { useEffect, useState, useRef, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, useVideoTexture, Environment, MarchingCubes, MarchingCube, MarchingPlane, OrbitControls, TorusKnot } from '@react-three/drei';
import { PMREMGenerator, Texture, Color, BackSide, EquirectangularRefractionMapping } from 'three';
import { randomPointInPolygon } from '../utils';
import './index.scss';

const VideoEnvironment = memo(({ videoElement, setEnvMap }) => {
  const videoSrc = videoElement.srcObject || videoElement.src;
  const videoTexture = useVideoTexture(videoSrc);

  const { scene } = useThree();

  useEffect(() => {
    // Set the environment map of the scene to the video texture
    scene.environment = videoTexture;
    scene.background = videoTexture;
    // scene.environment.mapping = EquirectangularRefractionMapping; // Ensure correct mapping
    setEnvMap(videoTexture);
  }, []);

  return null; // No need to render a sphere with the texture
});

function Bubble({ bubble, blob }) {
  const [position, setPosition] = useState(bubble.position);

  useFrame(() => {
    setPosition((prevPosition) => {
      bubble.velocity[1] += 0.00025;
      const nextPosition = [...prevPosition];
      nextPosition[0] += bubble.velocity[0];
      nextPosition[1] += bubble.velocity[1];
      nextPosition[2] += bubble.velocity[2];
      if (prevPosition[1] > 1) bubble.offscreen = true;
      return nextPosition;
    });
  });

  return blob
    ? (<MarchingCube args={[0.0025]} position={position} strength={0.1} subtract={12} />)
    : (
      <mesh position={position} visible={false}>
        <sphereGeometry args={[0.025, 4, 2]} />
        <meshNormalMaterial flatShading />
      </mesh>
    );
}

function Bubbles({ loops, noiseThreshold, currentVolume, envMap }) {
  const [bubbles, setBubbles] = useState([]);
  const maxBubbleRate = 50;
  const lastBubbleTime = useRef(new Date().getTime());
  useFrame(() => {
    const currentTime = new Date().getTime();
    if (currentVolume > noiseThreshold
      && currentTime - lastBubbleTime.current > maxBubbleRate
      && loops.length) {
      const randomLoop = loops[Math.floor(Math.random() * loops.length)];
      const point = randomPointInPolygon(randomLoop.points);

      setBubbles((prevBubbles) => {
        const nextBubbles = [...prevBubbles];
        // blow more bubbles depending on volume
        for (let i = 0; i < currentVolume * 10; i += 1) {
          nextBubbles.push({
            id: Math.random(),
            position: [point.x - 0.5, -point.y + 0.5, -1],
            velocity: [Math.random() * 0.005 - 0.0025, 0, 0.01],
          });
        }

        return (nextBubbles);
      });
      lastBubbleTime.current = currentTime;
    }

    setBubbles((prevBubbles) => prevBubbles.filter((bubble) => !bubble.offscreen));
  });

  return (
    <>
      <group>
        {bubbles.map((bubble) => (
          <Bubble
            key={bubble.id}
            bubble={bubble}
            debug={debug}
          />
        ))}
      </group>
      <mesh>
        <torusKnotGeometry args={[0.1, 0.03, 128]} />
        <meshStandardMaterial
          envMap={envMap}
          metalness={.5}
          reflectivity={.9}
          roughness={.1}
        />
      </mesh>
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
            blob
          />
        ))}
        <MarchingPlane
          planeType="z"
          strength={0.5}
          subtract={6}
        />
        <meshPhysicalMaterial
          envMap={envMap}
          envMapIntensity={1} // Adjust the intensity of the environment reflection
          metalness={0.3} // Increase metalness for better reflections
          roughness={0.2} // Reduce roughness for sharper reflections
          transmission={0.5}
          reflectivity={1}
          opacity={0.5}
          color="red"
        />
      </MarchingCubes>
    </>
  );
}

function CustomEnvironment({ videoElement, setEnvMap }) {
  const { scene, gl } = useThree();

  useEffect(() => {
    const img = document.createElement('img');
    img.src = `${import.meta.env.BASE_URL || '/'}/checker.png`;
    // img.crossOrigin = 'anonymous'; // Ensure cross-origin compatibility
    img.addEventListener('load', () => {
      const texture = new Texture(img);
      texture.needsUpdate = true; // Important to update the texture
      const pmremGenerator = new PMREMGenerator(gl);
      pmremGenerator.compileEquirectangularShader();

      const envMap = pmremGenerator.fromEquirectangular(texture).texture;

      // Set the environment and background of the scene
      // scene.environment = envMap;
      // scene.background = envMap;

      // Clean up resources
      texture.dispose();
      pmremGenerator.dispose();

      // Optionally, update any state or callbacks
      setEnvMap(envMap);
    })
  }, []);

  return null;
}

export default function Scene({ loops, width, height, debug, noiseThreshold, currentVolume, videoElement }) {
  const [envMap, setEnvMap] = useState(null);

  return (
    <Canvas
      className="scene"
      style={{ width, height }}
    >
      {/* <Environment preset="city" /> */}
      {/* <VideoEnvironment videoElement={videoElement} setEnvMap={setEnvMap} /> */}
      <CustomEnvironment videoElement={videoElement} setEnvMap={setEnvMap} />
      <PerspectiveCamera makeDefault fov={15} near={0.1} far={50} position={[0, 0, 3]} />
      <OrbitControls />
      <directionalLight intensity={10} />
      <Bubbles
        envMap={envMap}
        loops={loops}
        noiseThreshold={noiseThreshold}
        currentVolume={currentVolume}
      />
      {/* <gridHelper args={[1, 10]} rotation={[Math.PI / 2, 0, 0]} /> */}
    </Canvas>
  );
}
