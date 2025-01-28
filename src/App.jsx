// App.js
import React, { useRef, useState } from 'react';
import { Leva, useControls } from 'leva';
import AudioMonitor from './components/AudioMonitor';
import Tutorial from './components/Tutorial';
import Info from './components/Info';
import Bones from './components/Bones';
import Webcam from './components/Webcam';
import Scene from './components/Scene';

function App() {
  const [step, setStep] = useState(0);

  const [handLandmarker, setHandLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const handleFrameRef = useRef();
  const [loops, setLoops] = useState([]);
  const [bubbles, setBubbles] = useState([]);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(640);
  const [currentVolume, setCurrentVolume] = useState(0);

  const [audioSource, setAudioSource] = useState(null); // New state for audio source

  const videoElementRef = useRef();
  const { bones, balls, blobs } = useControls({ bones: { value: true }, balls: { value: false }, blobs: { value: true } });

  const [noiseThreshold, setNoiseThreshold] = useState(0.2);
  const [showInfo, setShowInfo] = useState(false);
  const mcResolution = 100;
  const mcPolyCount = 20000;

  return (
    <div className="app">
      <div
        // TODO: use (innerHeight - 0) on mobile to save space
        // all elements in this get scaled based on window size and camera dimensions
        className="container"
        style={{ transform: `translate(-50%, -50%) scale(${(innerHeight - 150) / height})` }}
      >
        <Webcam
          webcamRunning={webcamRunning}
          videoElementRef={videoElementRef}
          handleframeRef={handleFrameRef}
          setWebcamRunning={setWebcamRunning}
          setAudioSource={setAudioSource}
          setWidth={setWidth}
          setHeight={setHeight}
        />
        <Bones
          handleFrameRef={handleFrameRef}
          bones={bones}
          handLandmarker={handLandmarker}
          width={width}
          height={height}
          loops={loops}
          webcamRunning={webcamRunning}
          videoElementRef={videoElementRef}
          setHandLandmarker={setHandLandmarker}
          setWebcamRunning={setWebcamRunning}
          setLoops={setLoops}

        />
        <Scene
          loops={loops}
          width={width}
          height={height}
          balls={balls}
          blobs={blobs}
          bubbles={bubbles}
          currentVolume={currentVolume}
          noiseThreshold={noiseThreshold}
          videoElement={videoElementRef.current}
          mcResolution={mcResolution}
          mcPolyCount={mcPolyCount}
          setBubbles={setBubbles}
        />
      </div>
      <div className="ui">
        <h1 className="ui-header">🫧 bubz!</h1>
        <div className="ui-footer">
          <span>Another</span>
          <a target="github" href="https://github.com/DaveSeidman/bubz">Digital Stunt</a>
          <span>by</span>
          <a target="daveseidman" href="https://daveseidman.com">Dave Seidman</a>
        </div>
      </div>
      <AudioMonitor
        handLandmarker={handLandmarker}
        webcamRunning={webcamRunning}
        audioSource={audioSource}
        currentVolume={currentVolume}
        noiseThreshold={noiseThreshold}
        setCurrentVolume={setCurrentVolume}
        setNoiseThreshold={setNoiseThreshold}
      />
      <Tutorial
        step={step}
        setStep={setStep}
        webcamRunning={webcamRunning}
        loops={loops}
        bubbles={bubbles}
      />
      <Info
        showInfo={showInfo}
        setShowInfo={setShowInfo}
      />
      <Leva collapsed />
    </div>
  );
}

export default App;
