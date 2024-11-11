import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { handConnections, findLoops } from './utils';

function App() {
  const [handLandmarker, setHandLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [hands, setHands] = useState([]);
  const [loops, setLoops] = useState([]);
  const [videoMode, setVideoMode] = useState('webcam');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const stream = useRef();
  const handleFrameRef = useRef();
  const lastTimestamp = useRef(0);
  const touchingThreshold = 0.05; // TODO: base this on the size of the hand

  // Added state and refs for audio processing
  const [currentVolume, setCurrentVolume] = useState(0); // Measured volume level
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  // Add this ref to store the animation frame ID
  const animationFrameIdRef = useRef(null);

  // New ref to manage the dynamically created video element
  const videoElementRef = useRef(null);

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
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );
      const handLandmarkerInstance = await HandLandmarker.createFromOptions(vision, options);
      setHandLandmarker(handLandmarkerInstance);
    };

    if (canvasRef.current) {
      ctx.current = canvasRef.current.getContext('2d');
    }

    if (!handLandmarker) initializeHandLandmarker();
  }, [handLandmarker]);

  useEffect(() => {
    if (!ctx.current || !canvasRef.current) return;

    ctx.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); // Clear canvas before drawing

    // ctx.current.strokeStyle = 'black';
    // ctx.current.lineWidth = 0.5;
    // ctx.current.beginPath();
    // hands.forEach((hand) => {
    //   handConnections.forEach(([startIdx, endIdx]) => {
    //     const start = hand[startIdx];
    //     const end = hand[endIdx];
    //     ctx.current.moveTo(start.x * width, start.y * height);
    //     ctx.current.lineTo(end.x * width, end.y * height);
    //   });
    // });
    // ctx.current.stroke();

    const nextLoops = findLoops(hands, touchingThreshold, width, height);
    nextLoops.forEach(loop => {

    })
    setLoops(nextLoops);

    if (nextLoops.length) {
      ctx.current.lineWidth = 4;
      ctx.current.font = '20px Arial';
      nextLoops.forEach(({ id, color, points, center }, index) => {
        ctx.current.beginPath();
        ctx.current.strokeStyle = color;
        ctx.current.fillStyle = color;
        ctx.current.moveTo(points[0].x, points[0].y);
        points.forEach((point) => {
          ctx.current.lineTo(point.x, point.y);
        });
        ctx.current.closePath();
        ctx.current.stroke();
        ctx.current.fillText(index, center.x, center.y);
      });
    }

    // Optionally, display current volume level
    // For example, you might want to draw it on the canvas or update some element
  }, [hands, width, height, touchingThreshold]);

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

  // Updated function to initialize audio processing
  const initializeAudio = (audioSource) => {
    // Close the previous audio context if it exists
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    // Cancel the previous animation frame
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    let sourceNode;
    if (audioSource instanceof MediaStream) {
      sourceNode = audioContext.createMediaStreamSource(audioSource);
    } else if (audioSource instanceof HTMLMediaElement) {
      sourceNode = audioContext.createMediaElementSource(audioSource);
    } else {
      console.error('Unsupported audio source');
      return;
    }

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    // Connect nodes: source -> analyser -> destination
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);

    // Start volume monitoring
    monitorVolume();
  };

  // Updated function to monitor volume levels
  const monitorVolume = () => {
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const getVolume = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      setCurrentVolume(average / 255); // Normalize between 0 and 1
      // Store the animation frame ID
      animationFrameIdRef.current = requestAnimationFrame(getVolume);
    };
    getVolume();
  };

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
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    } else {
      // Stop video if playing
      if (videoMode === 'video') {
        if (videoElementRef.current) {
          videoElementRef.current.pause();
          videoElementRef.current.src = '';
          videoElementRef.current.load();
        }
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

      videoElement.play();
      videoElement.requestVideoFrameCallback((now, metadata) => {
        handleFrameRef.current(now, metadata);
      });
      // Initialize audio processing for microphone
      initializeAudio(stream.current);
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
    // Remove 'muted' to allow audio playback
    videoElement.src = 'test-vid.mp4'; // Ensure the path is correct
    videoElement.loop = true;
    videoElement.onloadedmetadata = () => {
      canvasRef.current.width = videoElement.videoWidth;
      canvasRef.current.height = videoElement.videoHeight;
      setWidth(videoElement.videoWidth);
      setHeight(videoElement.videoHeight);
      videoElement.play();
      videoElement.requestVideoFrameCallback((now, metadata) => {
        handleFrameRef.current(now, metadata);
      });
      // Initialize audio processing for video
      initializeAudio(videoElement);
    };
    videoElementRef.current = videoElement;
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
          {/* Optionally display current volume level */}
          <div
            style={{
              position: 'absolute',
              zIndex: 10,
              left: '240px',
              top: '10px',
              color: 'white',
            }}
          >
            Current Volume: {(currentVolume * 100).toFixed(2)}%
          </div>
        </div>
      )}
      {/* Render the video element */}
      <div style={{ position: 'relative' }}>
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
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
      </div>
    </div>
  );
}

export default App;
