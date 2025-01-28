import React, { useRef, useEffect } from 'react';
import './index.scss';

export default function AudioMonitor({
  handLandmarker,
  webcamRunning,
  currentVolume,
  setCurrentVolume,
  noiseThreshold,
  setNoiseThreshold,
  audioSource,
}) {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const pointer = useRef({ x: 0, down: false });
  const volumeRef = useRef();

  useEffect(() => {
    if (!audioSource) return;

    const initializeAudio = () => {
      if (audioContextRef.current) audioContextRef.current.close();

      const audioContext = new (window.AudioContext
        || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const sourceNode = audioContext.createMediaStreamSource(audioSource);
      sourceNode.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const monitorVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / bufferLength;
        setCurrentVolume((average / 255) * 2.5);
        // setCurrentVolume(1);
        animationFrameIdRef.current = requestAnimationFrame(monitorVolume);
      };

      monitorVolume();
    };

    initializeAudio();

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [audioSource]);

  if (!handLandmarker) return null;

  return (
    <div className="audio">
      <div
        ref={volumeRef}
        className={`audio-volume ${webcamRunning ? '' : 'hidden'}`}
        onPointerDown={(e) => {
          const { left, width } = e.currentTarget.getBoundingClientRect();
          setNoiseThreshold((e.clientX - left) / width);
          pointer.current.down = true;
        }}
        onPointerUp={() => {
          pointer.current.down = false;
        }}
        onPointerMove={(e) => {
          if (pointer.current.down) {
            const { left, width } = volumeRef.current.getBoundingClientRect();
            const threshold = (e.clientX - left) / width;
            setNoiseThreshold(Math.max(Math.min(threshold, 0.99), 0.01));
          }
        }}
      >
        <div className="audio-volume-lights">
          {Array.from({ length: 10 }).map((_, i) => {
            const fill = (currentVolume * 10) - i; // ex: if currentVolume = 0.55, fill first five completely and the sixth to 0.5
            const opacity = Math.min(1, Math.max(0, fill));
            return (
              <span
                key={i}
                className="audio-volume-lights-light"
                style={{ opacity }}
              >
                <span
                  className={`${i < 3 ? 'green' : i < 7 ? 'yellow' : 'orange'}`}
                />
              </span>
            );
          })}
        </div>
        <div
          className="audio-volume-threshold"
          style={{ left: `${Math.round(noiseThreshold * 10) * 10}%` }}
        />
      </div>
    </div>
  );
}
