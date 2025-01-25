// App.js
import React, { useRef, useState } from 'react';
import { Leva, useControls } from 'leva';
import Scene from './Scene';
import Webcam from './Webcam';
import Bones from './Bones';
// import useAudioMonitor from './AudioMonitor';
import AudioMonitor from './AudioMonitor';

import Tutorial from './Tutorial';

function App() {
  const [step, setStep] = useState(0);

  const [handLandmarker, setHandLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const handleFrameRef = useRef();
  const [loops, setLoops] = useState([]);
  const [bubbles, setBubbles] = useState([]);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [currentVolume, setCurrentVolume] = useState(0);

  const [audioSource, setAudioSource] = useState(null); // New state for audio source

  // const currentVolume = useAudioMonitor(audioSource);
  const videoElementRef = useRef();
  const {
    bones,
    balls,
    blobs,
  } = useControls({
    bones: { value: true },
    balls: { value: false },
    blobs: { value: true },
  });

  const [noiseThreshold, setNoiseThreshold] = useState(0.5);
  const mcResolution = 100;
  const mcPolyCount = 20000;

  return (
    <div className="app">

      <div
        className="container"
        style={{
          transform: `translate(-50%, -50%) scale(${(innerHeight - 150) / height})`, // TODO: use (innerHeight - 0) on mobile to save space
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
          // setAudioSource={setAudioSource}
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
          bubbles={bubbles}
          setBubbles={setBubbles}
          currentVolume={currentVolume}
          noiseThreshold={noiseThreshold}
          videoElement={videoElementRef.current}
          mcResolution={mcResolution}
          mcPolyCount={mcPolyCount}
        />

      </div>
      <div className="ui">
        <h1 className="ui-header">bubz!</h1>
        <div className="ui-footer">
          <span>Another</span>
          <a target="github" href="https://github.com/DaveSeidman/bubz">Digital Stunt</a>
          <span>by</span>
          <a target="daveseidman" href="https://daveseidman.com">Dave Seidman</a>
        </div>
      </div>
      <Tutorial
        step={step}
        setStep={setStep}
        webcamRunning={webcamRunning}
        loops={loops}
        bubbles={bubbles}
      />
      <AudioMonitor
        handLandmarker={handLandmarker}
        webcamRunning={webcamRunning}
        audioSource={audioSource}
        currentVolume={currentVolume}
        setCurrentVolume={setCurrentVolume}
        noiseThreshold={noiseThreshold}
        setNoiseThreshold={setNoiseThreshold}
      />
      <Leva collapsed />

      {/* {handLandmarker && (
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
              style={{ left: `${noiseThreshold * 100}%` }}
            >
              Min
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}

export default App;
