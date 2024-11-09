import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { handConnections } from './utils';

function App() {
  const [handLandmarker, setHandLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [hands, setHands] = useState([]);
  const [videoMode, setVideoMode] = useState('webcam');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const stream = useRef();
  const handleFrameRef = useRef();
  const lastTimestamp = useRef(0);

  const options = {
    baseOptions: {
      modelAssetPath: '/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
  };

  useEffect(() => {
    const initializeHandLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm');
      const handLandmarkerInstance = await HandLandmarker.createFromOptions(vision, options);
      setHandLandmarker(handLandmarkerInstance);
    };

    if (canvasRef.current) {
      ctx.current = canvasRef.current.getContext('2d');
    }

    if (!handLandmarker) initializeHandLandmarker();
  }, [handLandmarker]);

  useEffect(() => {
    ctx.current.lineWidth = 0.5;

    ctx.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); // Clear canvas before drawing
    for (const hand of hands) {
      ctx.current.beginPath();
      handConnections.forEach(([startIdx, endIdx]) => {
        const start = hand[startIdx];
        const end = hand[endIdx];
        // if (start && end) { // Add null checks
        ctx.current.moveTo(
          start.x * width,
          start.y * height,
        );
        ctx.current.lineTo(
          end.x * width,
          end.y * height,
        );
        // }
      });
      ctx.current.stroke();
    }
  }, [hands]);

  const handleFrame = async (now) => {
    let timestamp = now * 1000; // Convert from milliseconds to microseconds

    if (timestamp <= lastTimestamp.current) {
      timestamp = lastTimestamp.current + 1;
    }
    lastTimestamp.current = timestamp;

    const results = await handLandmarker.detectForVideo(videoRef.current, timestamp);

    setHands(results.landmarks.length ? results.landmarks : []);

    videoRef.current.requestVideoFrameCallback((now, metadata) => {
      handleFrameRef.current(now, metadata);
    });
  };

  handleFrameRef.current = handleFrame;

  const toggleCamera = async () => {
    if (webcamRunning) {
      // Stop webcam
      stream.current.getTracks().forEach((track) => {
        track.stop();
      });
      videoRef.current.srcObject = null;
      videoRef.current.pause();
      setWebcamRunning(false);
    } else {
      // Stop video if playing
      if (videoMode === 'video') {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        videoRef.current.src = null;
      }
      // Start webcam
      const constraints = { video: true };
      stream.current = await navigator.mediaDevices.getUserMedia(constraints);
      const videoTrack = stream.current.getVideoTracks()[0];
      canvasRef.current.width = videoTrack.getSettings().width;
      canvasRef.current.height = videoTrack.getSettings().height;
      videoRef.current.srcObject = stream.current;
      videoRef.current.src = null;
      videoRef.current.play();
      videoRef.current.requestVideoFrameCallback((now, metadata) => {
        handleFrameRef.current(now, metadata);
      });
      setWebcamRunning(true);
      setVideoMode('webcam');
    }
  };

  const loadVideo = () => {
    // Stop webcam if running
    if (webcamRunning) {
      toggleCamera();
    }
    setVideoMode('video');
    // Stop any existing srcObject
    if (videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
    videoRef.current.src = 'test-vid.mp4'; // Ensure the path is correct
    videoRef.current.loop = true;
    videoRef.current.onloadedmetadata = () => {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      setWidth(videoRef.current.videoWidth);
      setHeight(videoRef.current.videoHeight);
      videoRef.current.play();
      videoRef.current.requestVideoFrameCallback((now, metadata) => {
        handleFrameRef.current(now, metadata);
      });
    };
  };

  return (
    <div>
      {handLandmarker && (
        <div>
          <button
            type="button"
            style={{ position: 'absolute', zIndex: 10 }}
            onClick={toggleCamera}
          >
            {webcamRunning ? 'Stop Webcam' : 'Start Webcam'}
          </button>
          <button
            type="button"
            style={{ position: 'absolute', zIndex: 10, left: '120px' }}
            onClick={loadVideo}
          >
            Load Video
          </button>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
      />
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
    </div>
  );
}

export default App;
