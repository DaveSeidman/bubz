// App.js
import React, { useRef, useState } from 'react';
import { useControls } from 'leva';
import Scene from './Scene';
import Webcam from './Webcam';
import Bones from './Bones';
import useAudioMonitor from './AudioMonitor';
import Tutorial from './Tutorial';

function App() {
  const [step, setStep] = useState(0);

  const [handLandmarker, setHandLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const handleFrameRef = useRef();
  const [loops, setLoops] = useState([]);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [audioSource, setAudioSource] = useState(null); // New state for audio source

  const currentVolume = useAudioMonitor(audioSource);
  const videoElementRef = useRef();
  const {
    bones,
    balls,
    blobs,
  } = useControls({
    bones: { value: true },
    balls: { value: true },
    blobs: { value: true },
  });

  const [noiseThreshold, setNoiseThreshold] = useState(0.05);
  const mcResolution = 60;
  const mcPolyCount = 20000;

  return (
    <div className="app">

      <div
        className="container"
        style={{
          transform: `translate(-50%, -50%) scale(${innerHeight / height})`,
        }}
      >
        <Webcam
          setWidth={setWidth}
          setHeight={setHeight}
          webcamRunning={webcamRunning}
          setWebcamRunning={setWebcamRunning}
          setAudioSource={setAudioSource}
          videoElementRef={videoElementRef}
          handleframeRef={handleFrameRef}
        />
        <Bones
          handleFrameRef={handleFrameRef}
          bones={bones}
          handLandmarker={handLandmarker}
          setHandLandmarker={setHandLandmarker}
          setWebcamRunning={setWebcamRunning}
          setAudioSource={setAudioSource}
          width={width}
          height={height}
          loops={loops}
          setLoops={setLoops}
          webcamRunning={webcamRunning}
          videoElementRef={videoElementRef}
        />
        <Scene
          loops={loops}
          width={width}
          height={height}
          balls={balls}
          blobs={blobs}
          currentVolume={currentVolume}
          noiseThreshold={noiseThreshold}
          videoElement={videoElementRef.current}
          mcResolution={mcResolution}
          mcPolyCount={mcPolyCount}
        />
        <Tutorial
          step={step}
          setStep={setStep}
        />
      </div>
      {handLandmarker && (
        <div className="controls">
          <div
            className={`volume ${webcamRunning ? '' : 'hidden'}`}
            onPointerDown={(e) => {
              const { left, width } = e.currentTarget.getBoundingClientRect();
              console.log('pointerdown', (e.clientX - left) / width);
              setNoiseThreshold((e.clientX - left) / width);
            }}
            onPointerMove={(e) => {
              // console.log('pointermove', e.clientX);
            }}
          >
            <div
              className="volume-amount"
              style={{ width: `${currentVolume * 100}%` }}
            />
            <div
              className="volume-threshold"
              style={{ width: `${noiseThreshold * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
