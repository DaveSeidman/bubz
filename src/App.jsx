// App.js
import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { useControls } from 'leva';
import { distance, findLoops, getColors } from './utils';
import Scene from './Scene';
import testVid from './assets/test-vid.mp4';
import useAudioMonitor from './AudioMonitor'; // Import the custom hook

function App() {
  const basePath = import.meta.env.BASE_URL || '/';

  // State variables
  const [handLandmarker, setHandLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [hands, setHands] = useState([]);
  const [loops, setLoops] = useState([]);
  const [videoMode, setVideoMode] = useState('webcam');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [windowHeight, setWindowHeight] = useState(innerHeight)
  const [audioSource, setAudioSource] = useState(null); // New state for audio source

  // Use the custom hook to get the current volume
  const currentVolume = useAudioMonitor(audioSource);

  // Refs
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const stream = useRef();
  const handleFrameRef = useRef();
  const lastTimestamp = useRef(0);
  const videoElementRef = useRef(null);

  // Constants
  const touchingThreshold = 0.1; // TODO: base this on the size of the hand
  const loopIdCounter = useRef(1);
  const confirmationThreshold = 3; // Number of consecutive frames before assigning an ID
  const missingFramesThreshold = 3; // Number of frames before removing a loop
  const colorAmount = 10;
  const colors = getColors(colorAmount);

  // Controls
  const {
    minArea,
    noiseThreshold,
    mcResolution,
    mcPolyCount,
    balls,
    blobs
  } = useControls({
    minArea: { value: 0.003, min: 0, max: 0.05 },
    noiseThreshold: { value: 0.05, min: 0, max: 1 },
    mcResolution: { label: 'Blob Resolution', value: 60, min: 10, max: 120 },
    mcPolyCount: { label: 'Blob PolyCount', value: 20000, min: 1000, max: 100000 },
    bones: { value: false }, // TODO: use for drawing joint connections or not
    balls: { value: true },
    blobs: { value: true },
  });

  const options = {
    baseOptions: {
      modelAssetPath: `${basePath}/hand_landmarker.task`,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
  };

  // Initialize Hand Landmarker
  useEffect(() => {
    const initializeHandLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        `${basePath}/wasm`
      );
      const handLandmarkerInstance = await HandLandmarker.createFromOptions(vision, options);
      setHandLandmarker(handLandmarkerInstance);
      loadVideo();
    };

    if (canvasRef.current) {
      ctx.current = canvasRef.current.getContext('2d');
    }

    if (!handLandmarker) initializeHandLandmarker();
  }, [handLandmarker]);

  // Process Hands and Loops
  useEffect(() => {
    if (!ctx.current || !canvasRef.current) return;

    ctx.current.clearRect(0, 0, width, height);

    const nextLoops = findLoops({ hands, touchingThreshold, minArea });

    setLoops((prevLoops) => {
      const updatedLoops = [];
      const unmatchedPrevLoops = [...prevLoops];

      nextLoops.forEach((nextLoop) => {
        let matched = false;
        for (let i = 0; i < unmatchedPrevLoops.length; i++) {
          const prevLoop = unmatchedPrevLoops[i];
          if (distance(nextLoop.center, prevLoop.center) < 0.2) {
            matched = true;
            const updatedLoop = {
              ...prevLoop,
              points: nextLoop.points,
              center: nextLoop.center,
              missingFrames: 0,
              age: (prevLoop.age || 1) + 1,
            };
            if (prevLoop.confirmed) {
              updatedLoops.push(updatedLoop);
            } else {
              if (updatedLoop.age >= confirmationThreshold) {
                updatedLoop.id = loopIdCounter.current++;
                updatedLoop.confirmed = true;
              }
              updatedLoops.push(updatedLoop);
            }
            unmatchedPrevLoops.splice(i, 1);
            break;
          }
        }
        if (!matched) {
          const newLoop = {
            ...nextLoop,
            age: 1,
            missingFrames: 0,
            confirmed: false,
          };
          updatedLoops.push(newLoop);
        }
      });

      // Handle unmatched previous loops
      unmatchedPrevLoops.forEach((prevLoop) => {
        prevLoop.missingFrames = (prevLoop.missingFrames || 0) + 1;
        if (prevLoop.missingFrames <= missingFramesThreshold) {
          updatedLoops.push(prevLoop);
        }
      });

      return updatedLoops;
    });
  }, [hands]);

  // Render Loops
  useEffect(() => {
    if (!ctx.current) return;

    ctx.current.lineWidth = 2;
    ctx.current.font = '16px Courier';
    ctx.current.textAlign = 'center';
    ctx.current.textBaseline = 'middle';
    loops.forEach(({ id, points, center, confirmed }) => {
      ctx.current.beginPath();
      ctx.current.strokeStyle = colors[id % colorAmount];
      ctx.current.fillStyle = colors[id % colorAmount];
      ctx.current.moveTo(points[0].x * width, points[0].y * height);
      points.forEach((point) => {
        ctx.current.lineTo(point.x * width, point.y * height);
      });
      ctx.current.closePath();
      ctx.current.stroke();
      if (confirmed) {
        ctx.current.save();
        ctx.current.translate(center.x * width, center.y * height);
        ctx.current.scale(-1, 1);
        ctx.current.fillText(id, 0, 0);
        ctx.current.restore();
      }
    });
  }, [loops, width, height]);

  // Handle Video Frames
  const handleFrame = async (now) => {
    let timestamp = now * 1000;
    if (timestamp <= lastTimestamp.current) {
      timestamp = lastTimestamp.current + 1;
    }
    lastTimestamp.current = timestamp;

    const results = await handLandmarker.detectForVideo(videoElementRef.current, timestamp);
    setHands(results.landmarks.length ? results.landmarks : []);

    videoElementRef.current.requestVideoFrameCallback((now, metadata) => {
      handleFrameRef.current(now, metadata);
    });
  };

  handleFrameRef.current = handleFrame;

  // Toggle Camera
  const toggleCamera = async () => {
    if (webcamRunning) {
      // Stop webcam
      stream.current.getTracks().forEach((track) => {
        track.stop();
      });
      videoElementRef.current.srcObject = null;
      videoElementRef.current.pause();
      setWebcamRunning(false);

      // Clean up audio
      setAudioSource(null);
    } else {
      // Stop video if playing
      if (videoMode === 'video' && videoElementRef.current) {
        videoElementRef.current.pause();
        videoElementRef.current.src = '';
        videoElementRef.current.load();
      }
      // Start webcam with microphone access
      const constraints = { video: true, audio: true }; // Include audio
      stream.current = await navigator.mediaDevices.getUserMedia(constraints);
      const videoTrack = stream.current.getVideoTracks()[0];
      canvasRef.current.width = videoTrack.getSettings().width;
      canvasRef.current.height = videoTrack.getSettings().height;
      setWidth(videoTrack.getSettings().width);
      setHeight(videoTrack.getSettings().height);

      // Create a new video element
      const videoElement = document.createElement('video');
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.muted = true; // Mute if necessary
      videoElement.srcObject = stream.current;
      videoElementRef.current = videoElement;

      videoElement.requestVideoFrameCallback((now, metadata) => {
        handleFrameRef.current(now, metadata);
      });

      // Initialize audio processing for microphone
      setAudioSource(stream.current);

      setWebcamRunning(true);
      setVideoMode('webcam');
    }
  };

  // Load Video
  const loadVideo = () => {
    // Stop webcam if running
    if (webcamRunning) {
      toggleCamera();
    }
    setVideoMode('video');
    // Clean up existing video element
    if (videoElementRef.current) {
      videoElementRef.current.pause();
      videoElementRef.current.src = '';
      videoElementRef.current.load();
    }
    // Create a new video element
    const videoElement = document.createElement('video');
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.src = testVid;
    videoElement.loop = true;
    videoElement.onloadedmetadata = () => {
      canvasRef.current.width = videoElement.videoWidth;
      canvasRef.current.height = videoElement.videoHeight;
      setWidth(videoElement.videoWidth);
      setHeight(videoElement.videoHeight);

      videoElement.requestVideoFrameCallback((now, metadata) => {
        handleFrameRef.current(now, metadata);
      });

      // Initialize audio processing for video
      setAudioSource(videoElement);
    };
    videoElementRef.current = videoElement;
  };

  useEffect(() => {
    const resize = () => {
      setWindowHeight(innerHeight)
    }
    addEventListener('resize', resize);

    return (() => {
      removeEventListener('resize', resize);
    })
  }, [])

  return (
    <div className="app"    >

      <div className='container'
        style={{
          transform: `translateX(${(window.innerWidth - (640 * (windowHeight / 480))) / 2}px) scale(${windowHeight / 480})`
        }}
      >
        {videoElementRef.current && (
          <div
            ref={(node) => {
              if (node) {
                node.innerHTML = '';
                node.appendChild(videoElementRef.current);
              }
            }}
          />
        )}
        <canvas
          ref={canvasRef}
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
      </div>

      {handLandmarker && (
        <div className="controls">
          <button
            type="button"
            onClick={toggleCamera}
          >
            {webcamRunning ? 'Stop Webcam' : 'Start Webcam'}
          </button>
          <button
            type="button"
            onClick={loadVideo}
          >
            Start Video
          </button>
          <div
            className="volume"
          >
            Current Volume: {(currentVolume * 100).toFixed(2)}%
          </div>
        </div>
      )}
    </div >
  );
}

export default App;
