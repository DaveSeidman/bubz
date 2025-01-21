// useAudioMonitor.js
import { useState, useRef, useEffect } from 'react';

function useAudioMonitor(audioSource) {
  const [currentVolume, setCurrentVolume] = useState(0); // Measured volume level
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  useEffect(() => {
    if (audioSource) {
      // Initialize audio processing
      initializeAudio(audioSource);
    }

    // Clean up when unmounting or audioSource changes
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [audioSource]);

  const initializeAudio = (source) => {
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
    if (source instanceof MediaStream) {
      sourceNode = audioContext.createMediaStreamSource(source);
    } else if (source instanceof HTMLMediaElement) {
      sourceNode = audioContext.createMediaElementSource(source);
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

  return (currentVolume * 2) + 0.2;
}

export default useAudioMonitor;
