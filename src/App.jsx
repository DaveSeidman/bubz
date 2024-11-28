import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { useControls } from 'leva';
import { distance, findLoops, getColors } from './utils';
import Scene from './Scene';
import testVid from './assets/test-vid.mp4'

function App() {
  const basePath = import.meta.env.BASE_URL || '/';

  const [handLandmarker, setHandLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [hands, setHands] = useState([]);
  const [loops, setLoops] = useState([]);
  const [videoMode, setVideoMode] = useState('webcam');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const stream = useRef();
  const handleFrameRef = useRef();
  const lastTimestamp = useRef(0);
  const touchingThreshold = 0.1; // TODO: base this on the size of the hand
  // const movementTheshold = .2;
  const loopIdCounter = useRef(1);
  const confirmationThreshold = 3; // Number of consecutive frames before assigning an ID
  const missingFramesThreshold = 3; // Number of frames before removing a loop
  const colorAmount = 10;
  const colors = getColors(colorAmount);
  const [currentVolume, setCurrentVolume] = useState(0); // Measured volume level
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  const {
    minArea,
    noiseThreshold,
    mcResolution,
    mcPolyCount,
    debug,
  } = useControls({
    minArea: { value: .003, min: 0, max: .05 },
    noiseThreshold: { value: .05, min: 0, max: 1 },
    mcResolution: { label: 'Blob Resolution', value: 60, min: 10, max: 80 },
    mcPolyCount: { label: 'Blob PolyCount', value: 50000, min: 1000, max: 100000 },
    debug: { value: false }
  });

  // New ref to manage the dynamically created video element
  const videoElementRef = useRef(null);

  const options = {
    baseOptions: {
      modelAssetPath: `${basePath}/hand_landmarker.task`,
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
      loadVideo();
    };

    if (canvasRef.current) {
      ctx.current = canvasRef.current.getContext('2d');
    }

    if (!handLandmarker) initializeHandLandmarker();
  }, [handLandmarker]);

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
          // TODO: make this an adjustable value
          // TODO: check for point indexes for more accurate matching
          if (distance(nextLoop.center, prevLoop.center) < .2) {
            // Match found
            matched = true;
            // Update the loop
            const updatedLoop = {
              ...prevLoop,
              points: nextLoop.points,
              center: nextLoop.center,
              missingFrames: 0,
              age: (prevLoop.age || 1) + 1
            };
            // updatedLoop.age = (prevLoop.age || 1) + 1;

            if (prevLoop.confirmed) {
              updatedLoops.push(updatedLoop);
            } else {
              // Unconfirmed loop, increment age
              if (updatedLoop.age >= confirmationThreshold) {
                // Assign new ID and confirm the loop
                updatedLoop.id = loopIdCounter.current++;
                updatedLoop.confirmed = true;
              }
              updatedLoops.push(updatedLoop);
            }
            // Remove prevLoop from unmatchedPrevLoops
            unmatchedPrevLoops.splice(i, 1);
            break;
          }
        }
        if (!matched) {
          // No match found, create new unconfirmed loop
          const newLoop = {
            ...nextLoop,
            age: 1,
            missingFrames: 0,
            confirmed: false,
          };
          updatedLoops.push(newLoop);
        }
      });

      // For prevLoops that were not matched, increment missingFrames
      unmatchedPrevLoops.forEach((prevLoop) => {
        prevLoop.missingFrames = (prevLoop.missingFrames || 0) + 1;
        if (prevLoop.missingFrames <= missingFramesThreshold) {
          updatedLoops.push(prevLoop);
        }
      });

      return updatedLoops;
    });
  }, [hands]);

  useEffect(() => {
    ctx.current.lineWidth = 2;
    ctx.current.font = '16px Courier';
    ctx.current.textAlign = 'center';
    ctx.current.textBaseline = 'middle';
    loops.forEach(({ id, points, center, confirmed }, index) => {
      ctx.current.beginPath();
      ctx.current.strokeStyle = colors[id % colorAmount]; // TODO: make the color 50% transparent until confirmed
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
  }, [loops])


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

      // videoElement.play();
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
    // videoElement.muted = true;
    // Remove 'muted' to allow audio playback
    videoElement.src = testVid
    videoElement.loop = true;
    videoElement.onloadedmetadata = () => {
      canvasRef.current.width = videoElement.videoWidth;
      canvasRef.current.height = videoElement.videoHeight;
      setWidth(videoElement.videoWidth);
      setHeight(videoElement.videoHeight);
      // videoElement.play();
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
        <Scene
          loops={loops}
          width={width}
          height={height}
          debug={debug}
          currentVolume={currentVolume}
          noiseThreshold={noiseThreshold}
          videoElement={videoElementRef.current}
          mcResolution={mcResolution}
          mcPolyCount={mcPolyCount}
        />
      </div>
    </div>
  );
}

export default App;
