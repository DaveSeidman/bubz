import React, { useRef, useEffect, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { distance, findLoops, getColors } from '../utils';
import './index.scss';

export default function Bones({ setAudioSource, webcamRunning, setWidth, setHeight, bones, setLoops, handLandmarker, loops, setWebcamRunning, setHandLandmarker, videoElementRef }) {
  const basePath = import.meta.env.BASE_URL || '/';


  const [hands, setHands] = useState([]);
  const minArea = 0.003;
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const stream = useRef();
  const handleFrameRef = useRef();
  const lastTimestamp = useRef(0);
  const touchingThreshold = 0.1; // TODO: base this on the size of the hand
  const loopIdCounter = useRef(1);
  const confirmationThreshold = 3; // Number of consecutive frames before assigning an ID
  const missingFramesThreshold = 3; // Number of frames before removing a loop
  const colorAmount = 6;
  const colors = getColors(colorAmount);

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
        `${basePath}/wasm`,
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

    ctx.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

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

    const { width, height } = canvasRef.current;
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
  }, [loops]);

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

  const startCamera = async () => {
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

  return (
    <div className="bones">
      <video
        ref={videoElementRef}
        className="webcam"
        autoPlay
        muted
      />
      <canvas
        className={`bones-bones ${bones ? '' : 'hidden'}`}
        ref={canvasRef}
      // style={{ width, height }}
      />
      <button
        className={`controls-webcam ${webcamRunning ? 'hidden' : ''}`}
        type="button"
        onClick={startCamera}
      >
        Start Webcam
      </button>
    </div>
  );
}
