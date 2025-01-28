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
    // TODO: this flattens out the volume bar :(
    // videoElementRef.current.volume = 0.0;
    // videoElementRef.current.muted = true;
    setAudioSource(stream.current);
    setWebcamRunning(true);
  };

  return (
    <div className="webcam">
      <video
        ref={videoElementRef}
        className={`webcam-video ${webcamRunning ? '' : 'hidden'}`}
        autoPlay
        playsInline
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
