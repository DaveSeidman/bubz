import React, { useRef, useEffect, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { distance, findLoops, jointConnections } from '../../utils';
import './index.scss';

export default function Bones({ handleFrameRef, bones, setLoops, handLandmarker, loops, setHandLandmarker, videoElementRef, width, height }) {
  const basePath = import.meta.env.BASE_URL || '/';

  const [hands, setHands] = useState([]);
  const previousHands = useRef([]); // Store previous hands for smoothing
  const previousLoops = useRef([]); // Store previous loops for smoothing
  const minArea = 0.003;
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const lastTimestamp = useRef(0);
  const touchingThreshold = 0.1; // TODO: base this on the size of the hand
  const loopIdCounter = useRef(1);
  const confirmationThreshold = 3; // Number of consecutive frames before assigning an ID
  const missingFramesThreshold = 3; // Number of frames before removing a loop

  const options = {
    baseOptions: {
      modelAssetPath: `${basePath}/hand_landmarker.task`,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
  };

  // Smooth positions by averaging with the previous frame
  const smoothPositions = (current, previous, smoothingFactor = 0.25) => {
    if (!previous || current.length !== previous.length) {
      return current; // No smoothing if dimensions don't match
    }
    return current.map((point, i) => ({
      x: previous[i].x * smoothingFactor + point.x * (1 - smoothingFactor),
      y: previous[i].y * smoothingFactor + point.y * (1 - smoothingFactor),
    }));
  };

  // Initialize Hand Landmarker
  useEffect(() => {
    const initializeHandLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(`${basePath}/wasm`);
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

    // Smooth the hand positions
    const smoothedHands = hands.map((hand, index) => {
      const previousHand = previousHands.current[index];
      return smoothPositions(hand, previousHand);
    });

    previousHands.current = smoothedHands; // Store smoothed hands for the next frame

    // Draw joints and bones
    smoothedHands.forEach((landmarks) => {
      ctx.current.strokeStyle = 'white';
      ctx.current.lineWidth = 1;
      jointConnections.forEach(([start, end]) => {
        const startJoint = landmarks[start];
        const endJoint = landmarks[end];
        if (startJoint && endJoint) {
          ctx.current.beginPath();
          ctx.current.moveTo(startJoint.x * width, startJoint.y * height);
          ctx.current.lineTo(endJoint.x * width, endJoint.y * height);
          ctx.current.stroke();
        }
      });

      landmarks.forEach((joint) => {
        ctx.current.beginPath();
        ctx.current.arc(joint.x * width, joint.y * height, 2.5, 0, Math.PI * 2);
        ctx.current.fillStyle = 'white';
        ctx.current.fill();
      });
    });

    // Detect loops using smoothed positions
    const nextLoops = findLoops({ hands: smoothedHands, touchingThreshold, minArea });

    // Update loops state
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

      previousLoops.current = updatedLoops; // Store updated loops for the next frame
      return updatedLoops;
    });
  }, [hands]);

  useEffect(() => {
    if (!ctx.current) return;
    const { width, height } = canvasRef.current;
    ctx.current.lineWidth = 5;

    loops.forEach(({ points, confirmed, missingFrames }) => {
      if (confirmed || missingFrames > 0) {
        // Render even if missingFrames > 0
        ctx.current.fillStyle = `rgba(255, 255, 255, ${missingFrames > 0 ? 0.2 : 0.33})`; // Dim loops with missing frames
        ctx.current.beginPath();
        ctx.current.moveTo(points[0].x * width, points[0].y * height);
        points.forEach((point) => {
          ctx.current.lineTo(point.x * width, point.y * height);
        });
        ctx.current.closePath();
        ctx.current.stroke();
        ctx.current.fill();
      }
    });
  }, [loops]);

  // Frame Handling
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

  useEffect(() => {
    videoElementRef.current.requestVideoFrameCallback((now, metadata) => {
      handleFrameRef.current(now, metadata);
    });
  }, [videoElementRef]);

  useEffect(() => {
    canvasRef.current.width = width;
    canvasRef.current.height = height;
  }, [width, height]);

  return (
    <div className="bones">
      <canvas
        className={`bones-bones ${bones ? '' : 'hidden'}`}
        ref={canvasRef}
      />
    </div>
  );
}
