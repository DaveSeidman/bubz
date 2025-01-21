import React, { useRef } from 'react';
import './index.scss';

export default function Webcam({ setWidth, setHeight, setAudioSource, webcamRunning, setWebcamRunning, videoElementRef }) {
  const stream = useRef();

  const startCamera = async () => {
    const constraints = { video: true, audio: true };
    stream.current = await navigator.mediaDevices.getUserMedia(constraints);
    const videoTrack = stream.current.getVideoTracks()[0];
    const { width, height } = videoTrack.getSettings();
    setWidth(width);
    setHeight(height);
    videoElementRef.current.srcObject = stream.current;
    setAudioSource(stream.current);
    setWebcamRunning(true);
  };

  return (
    <div className="webcam">
      <video
        ref={videoElementRef}
        className="webcam-video"
        autoPlay
        muted
      />
      <button
        className={`webcam-start ${webcamRunning ? 'hidden' : ''}`}
        type="button"
        onClick={startCamera}
      >
        Start Webcam
      </button>
    </div>
  );
}
