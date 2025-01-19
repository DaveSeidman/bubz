import React, { useRef } from 'react';

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
    <>
      <video
        ref={videoElementRef}
        className="webcam"
        autoPlay
        muted
      />
      <button
        className={`controls-webcam ${webcamRunning ? 'hidden' : ''}`}
        type="button"
        onClick={startCamera}
      >
        Start Webcam
      </button>
    </>
  );
}
