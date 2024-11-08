import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

function App() {
  const [handLandmarker, setHandLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [roundedJoints, setRoundedJoints] = useState([]);
  const [videoMode, setVideoMode] = useState('webcam');
  const roundTo = 0.025;
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
    numHands: 4,
  };

  const HAND_CONNECTIONS = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4], // Thumb
    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8], // Index finger
    [0, 9],
    [9, 10],
    [10, 11],
    [11, 12], // Middle finger
    [0, 13],
    [13, 14],
    [14, 15],
    [15, 16], // Ring finger
    [0, 17],
    [17, 18],
    [18, 19],
    [19, 20], // Pinky
  ];

  useEffect(() => {
    const initializeHandLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm',
      );
      const handLandmarkerInstance = await HandLandmarker.createFromOptions(vision, options);
      setHandLandmarker(handLandmarkerInstance);
    };
    initializeHandLandmarker();
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      ctx.current = canvasRef.current.getContext('2d');
    }
  }, []); // Run once when the component mounts

  useEffect(() => {
    ctx.current.fillStyle = 'purple';
    ctx.current.lineWidth = 2;

    ctx.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); // Clear canvas before drawing

    for (const hand of roundedJoints) {
      ctx.current.beginPath();
      HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const start = hand[startIdx];
        const end = hand[endIdx];
        if (start && end) { // Add null checks
          ctx.current.moveTo(
            start.x * ctx.current.canvas.width,
            start.y * ctx.current.canvas.height,
          );
          ctx.current.lineTo(
            end.x * ctx.current.canvas.width,
            end.y * ctx.current.canvas.height,
          );
        }
      });
      ctx.current.stroke();
    }
  }, [roundedJoints]);

  const handleFrame = async (now, metadata) => {
    let timestamp = now * 1000; // Convert from milliseconds to microseconds

    if (timestamp <= lastTimestamp.current) {
      timestamp = lastTimestamp.current + 1;
    }
    lastTimestamp.current = timestamp;

    const results = await handLandmarker.detectForVideo(videoRef.current, timestamp);
    if (results.landmarks && results.landmarks.length) {
      const nextJoints = results.landmarks.map((hand) => hand.map((joint) => ({
        x: Math.round(joint.x / roundTo) * roundTo,
        y: Math.round(joint.y / roundTo) * roundTo,
      })));
      setRoundedJoints(nextJoints);
    } else {
      setRoundedJoints([]);
    }

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
      const { width, height } = videoTrack.getSettings();
      canvasRef.current.width = width;
      canvasRef.current.height = height;
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
        style={{ display: 'block' }}
        autoPlay
        playsInline
        muted
      />
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
    </div>
  );
}

export default App;
