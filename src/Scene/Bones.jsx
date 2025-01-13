// Bones.jsx
import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { distance, findLoops } from '../utils';

function Bones({ setLoops, setVideoElement, width, height, basePath }) {
  const [handLandmarker, setHandLandmarker] = useState(null);
  const [hands, setHands] = useState([]);

  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const videoElementRef = useRef(null);
  const lastTimestamp = useRef(0);

  const touchingThreshold = 0.1; // TODO: base this on the size of the hand
  const loopIdCounter = useRef(1);
  const confirmationThreshold = 3; // Number of consecutive frames before assigning an ID
  const missingFramesThreshold = 3; // Number of frames before removing a loop

  useEffect(() => {
    const initializeHandLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(`${basePath}/wasm`);
      const handLandmarkerInstance = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `${basePath}/hand_landmarker.task`,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
      });
      setHandLandmarker(handLandmarkerInstance);
    };

    initializeHandLandmarker();
  }, [basePath]);

  useEffect(() => {
    if (!ctx.current && canvasRef.current) {
      ctx.current = canvasRef.current.getContext('2d');
    }

    if (!handLandmarker || !videoElementRef.current) return;

    const handleFrame = async (now) => {
      let timestamp = now * 1000;
      if (timestamp <= lastTimestamp.current) {
        timestamp = lastTimestamp.current + 1;
      }
      lastTimestamp.current = timestamp;

      const results = await handLandmarker.detectForVideo(videoElementRef.current, timestamp);
      setHands(results.landmarks.length ? results.landmarks : []);

      videoElementRef.current.requestVideoFrameCallback((now) => {
        handleFrame(now);
      });
    };

    videoElementRef.current.requestVideoFrameCallback((now) => {
      handleFrame(now);
    });

    // Expose the video element reference to the parent
    if (setVideoElement) {
      setVideoElement(videoElementRef.current);
    }
  }, [handLandmarker, setVideoElement]);

  useEffect(() => {
    if (!ctx.current || !canvasRef.current) return;

    ctx.current.clearRect(0, 0, width, height);

    const nextLoops = findLoops({ hands, touchingThreshold, minArea: 0.003 });

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

      unmatchedPrevLoops.forEach((prevLoop) => {
        prevLoop.missingFrames = (prevLoop.missingFrames || 0) + 1;
        if (prevLoop.missingFrames <= missingFramesThreshold) {
          updatedLoops.push(prevLoop);
        }
      });

      return updatedLoops;
    });
  }, [hands, setLoops, width, height]);

  return (
    <div style={{ display: 'none' }}>
      <canvas ref={canvasRef} width={width} height={height} />
      <video ref={videoElementRef} playsInline autoPlay muted />
    </div>
  );
}

export default Bones;
