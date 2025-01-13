// App.js
import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { useControls } from 'leva';
import { distance, findLoops, getColors } from './utils';
import Scene from './Scene';
import useAudioMonitor from './AudioMonitor';

function App() {
  const basePath = import.meta.env.BASE_URL || '/';

  const [handLandmarker, setHandLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [hands, setHands] = useState([]);
  const [loops, setLoops] = useState([]);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [windowHeight, setWindowHeight] = useState(innerHeight)
  const [audioSource, setAudioSource] = useState(null); // New state for audio source

  const currentVolume = useAudioMonitor(audioSource);

  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const stream = useRef();
  const handleFrameRef = useRef();
  const lastTimestamp = useRef(0);
  const videoElementRef = useRef(null);

  const touchingThreshold = 0.1; // TODO: base this on the size of the hand
  const loopIdCounter = useRef(1);
  const confirmationThreshold = 3; // Number of consecutive frames before assigning an ID
  const missingFramesThreshold = 3; // Number of frames before removing a loop
  const colorAmount = 6;
  const colors = getColors(colorAmount);

  const {
    bones,
    balls,
    blobs
  } = useControls({
    bones: { value: true },
    balls: { value: true },
    blobs: { value: true },
  });

  const minArea = .003;
  const noiseThreshold = .05;
  const mcResolution = 60;
  const mcPolyCount = 20000

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
    // Start webcam with microphone access
    const constraints = { video: true, audio: true }; // Include audio
    stream.current = await navigator.mediaDevices.getUserMedia(constraints);
    const videoTrack = stream.current.getVideoTracks()[0];
    const { width, height } = videoTrack.getSettings();
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    setWidth(width);
    setHeight(height);
    videoElementRef.current.srcObject = stream.current;
    videoElementRef.current.requestVideoFrameCallback((now, metadata) => {
      handleFrameRef.current(now, metadata);
    });

    setAudioSource(stream.current);
    setWebcamRunning(true);
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
    <div className="app">

      <div className='container'
        style={{
          transform: `translate(-50%, -50%) scale(${innerHeight / height})`
        }}
      >
        <video
          ref={videoElementRef}
          className="webcam"
          autoPlay
          muted
        ></video>
        <canvas
          className={`bones ${bones ? '' : 'hidden'}`}
          ref={canvasRef}
          style={{ width, height }}
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
            className={`controls-webcam ${webcamRunning ? 'hidden' : ''}`}
            type="button"
            onClick={toggleCamera}
          >
            Start Webcam
          </button>
          <div className={`volume ${webcamRunning ? '' : 'hidden'}`}>
            <div className="volume-amount" style={{ width: `${currentVolume * 100}%` }}></div>
          </div>
        </div>
      )}
    </div >
  );
}

export default App;
