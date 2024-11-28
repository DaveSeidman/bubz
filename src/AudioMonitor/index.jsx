import React, { useEffect, useRef, useState } from 'react';

function AudioMonitor({ audioSource, onVolumeChange }) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  useEffect(() => {
    if (!audioSource) return;

    // Initialize audio monitoring
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
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const monitorVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      onVolumeChange(average / 255); // Normalize between 0 and 1

      // Store the animation frame ID
      animationFrameIdRef.current = requestAnimationFrame(monitorVolume);
    };
    monitorVolume();

    // Cleanup when the component unmounts or audioSource changes
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
  }, [audioSource, onVolumeChange]);

  return null;
}

export default AudioMonitor;
