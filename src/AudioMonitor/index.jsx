// AudioMonitor Component
import React, { useRef, useEffect } from 'react';
import './index.scss';

function AudioMonitor({
  handLandmarker,
  webcamRunning,
  currentVolume,
  setCurrentVolume,
  noiseThreshold,
  setNoiseThreshold,
  audioSource,
}) {
  // const [internalVolume, setInternalVolume] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  useEffect(() => {
    if (!audioSource) return;

    const initializeAudio = () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
        setCurrentVolume(average / 255);
        animationFrameIdRef.current = requestAnimationFrame(monitorVolume);
      };

      monitorVolume();
    };

    initializeAudio();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioSource]);

  if (!handLandmarker) return null;

  return (
    <div className="audio">
      <div
        className={`audio-volume ${webcamRunning ? '' : 'hidden'}`}
        onPointerDown={(e) => {
          const { left, width } = e.currentTarget.getBoundingClientRect();
          setNoiseThreshold((e.clientX - left) / width);
        }}
      >
        <div
          className="audio-volume-amount"
          style={{ width: `${(currentVolume * 100)}%` }}
        />
        <div
          className="audio-volume-threshold"
          style={{ left: `${noiseThreshold * 100}%` }}
        >
          Min
        </div>
      </div>
    </div>
  );
}

export default AudioMonitor;
