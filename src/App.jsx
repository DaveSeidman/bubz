import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { handConnections, distance } from './utils';

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
  const touchingThreshold = 0.15; // TODO: base this on the size of the hand

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
    // if (hands[0]) console.log(hands[0][0].z);
    ctx.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); // Clear canvas before drawing

    ctx.current.strokeStyle = 'black';
    ctx.current.lineWidth = 0.5;
    ctx.current.beginPath();
    hands.forEach((hand) => {
      handConnections.forEach(([startIdx, endIdx]) => {
        const start = hand[startIdx];
        const end = hand[endIdx];
        ctx.current.moveTo(start.x * width, start.y * height);
        ctx.current.lineTo(end.x * width, end.y * height);
      });
    });
    ctx.current.stroke();

    const loops = [];
    hands.forEach((hand) => {
      // if thumb and finger 1 are touching
      if (distance(hand[4], hand[8]) < touchingThreshold) {
        loops.push({
          color: 'rgba(34, 77, 34, .5)',
          points:
            [
              { x: hand[2].x * width, y: hand[2].y * height },
              { x: hand[3].x * width, y: hand[3].y * height },
              { x: hand[4].x * width, y: hand[4].y * height },
              { x: hand[8].x * width, y: hand[8].y * height },
              { x: hand[7].x * width, y: hand[7].y * height },
              { x: hand[6].x * width, y: hand[6].y * height },
              { x: hand[5].x * width, y: hand[5].y * height },
            ],
        });
      }
      // if thumb and finger 2 are touching
      if (distance(hand[4], hand[12]) < touchingThreshold) {
        loops.push({
          color: 'rgba(44, 77, 34, .5)',
          points:
            [
              { x: hand[2].x * width, y: hand[2].y * height },
              { x: hand[3].x * width, y: hand[3].y * height },
              { x: hand[4].x * width, y: hand[4].y * height },
              { x: hand[12].x * width, y: hand[12].y * height },
              { x: hand[11].x * width, y: hand[11].y * height },
              { x: hand[10].x * width, y: hand[10].y * height },
              { x: hand[9].x * width, y: hand[9].y * height },
            ],
        });
      }
      // if thumb and finger 3 are touching
      if (distance([hand[4]], hand[16]) < touchingThreshold) {
        loops.push({
          color: 'rgba(72, 77, 34, .5)',
          points:
            [
              { x: hand[2].x * width, y: hand[2].y * height },
              { x: hand[3].x * width, y: hand[3].y * height },
              { x: hand[4].x * width, y: hand[4].y * height },
              { x: hand[16].x * width, y: hand[16].y * height },
              { x: hand[15].x * width, y: hand[15].y * height },
              { x: hand[14].x * width, y: hand[14].y * height },
              { x: hand[13].x * width, y: hand[13].y * height },
            ],
        });
      }
      // if thumb and finger 3 are touching
      if (distance([hand[4]], hand[20]) < touchingThreshold) {
        loops.push({
          color: 'rgba(77, 60, 34, .5)',
          points:
            [
              // thumb base to tip
              { x: hand[2].x * width, y: hand[2].y * height },
              { x: hand[3].x * width, y: hand[3].y * height },
              { x: hand[4].x * width, y: hand[4].y * height },
              // finger 3 tip to base
              { x: hand[20].x * width, y: hand[20].y * height },
              { x: hand[19].x * width, y: hand[19].y * height },
              { x: hand[18].x * width, y: hand[18].y * height },
              { x: hand[17].x * width, y: hand[17].y * height },
            ],
        });
      }
    });

    if (hands.length === 2) {
      if (distance(hands[0][4], hands[1][4]) < (touchingThreshold / 2)
        && distance(hands[0][8], hands[1][8]) < (touchingThreshold / 2)) {
        loops.push({
          color: '#FF44FF',
          points: [
            // left thumb base to tip
            { x: hands[0][2].x * width, y: hands[0][2].y * height },
            { x: hands[0][3].x * width, y: hands[0][3].y * height },
            { x: hands[0][4].x * width, y: hands[0][4].y * height },
            // right thumb tip to base
            { x: hands[1][4].x * width, y: hands[1][4].y * height },
            { x: hands[1][3].x * width, y: hands[1][3].y * height },
            { x: hands[1][2].x * width, y: hands[1][2].y * height },
            // right finger 1 base to tip
            { x: hands[1][5].x * width, y: hands[1][5].y * height },
            { x: hands[1][6].x * width, y: hands[1][6].y * height },
            { x: hands[1][7].x * width, y: hands[1][7].y * height },
            { x: hands[1][8].x * width, y: hands[1][8].y * height },
            // left finger 1 tip to base
            { x: hands[0][8].x * width, y: hands[0][8].y * height },
            { x: hands[0][7].x * width, y: hands[0][7].y * height },
            { x: hands[0][6].x * width, y: hands[0][6].y * height },
            { x: hands[0][5].x * width, y: hands[0][5].y * height },
          ],
        });
      }
    }

    if (loops.length) {
      ctx.current.lineWidth = 4;
      loops.forEach(({ color, points }) => {
        ctx.current.beginPath();
        ctx.current.strokeStyle = color;
        ctx.current.moveTo(points[0].x, points[0].y);
        points.forEach((point) => {
          ctx.current.lineTo(point.x, point.y);
        });
        ctx.current.lineTo(points[0].x, points[0].y);
        ctx.current.stroke();
      });
    }
  }, [hands]);

  const handleFrame = async (now) => {
    let timestamp = now * 1000;
    if (timestamp <= lastTimestamp.current) { timestamp = lastTimestamp.current + 1; }
    lastTimestamp.current = timestamp;

    const results = await handLandmarker.detectForVideo(videoRef.current, timestamp);
    setHands(results.landmarks.length ? results.landmarks : []);

    videoRef.current.requestVideoFrameCallback((now, metadata) => {
      handleFrameRef.current(now, metadata);
    });
  };

  handleFrameRef.current = handleFrame;

  const toggleCamera = async () => {
    // console.log('toggleCamera');
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
      setWidth(videoTrack.getSettings().width);
      setHeight(videoTrack.getSettings().height);
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
