import React, { useEffect, useState } from 'react';
import loopsVideo from '../../assets/videos/hand-loops.webm'
import dragIcon from '../../assets/images/drag.svg';
import './index.scss';

export default function Tutorial({ webcamRunning, loops, bubbles }) {
  const [firstLoop, setFirstLoop] = useState(false);
  const [firstBubble, setFirstBubble] = useState(false);

  useEffect(() => {
    if (loops?.length >= 1) setFirstLoop(true);
  }, [loops])

  useEffect(() => {
    if (bubbles?.length >= 1) setFirstBubble(true);
  }, [bubbles])

  return (
    <div className="tutorial">
      {!webcamRunning && (
        <div className="tutorial-step camera">
          <p className='pulse'>allow camera and microphone access</p>
        </div>
      )}
      {(webcamRunning && !firstLoop) && (
        <div className="tutorial-step">
          <video
            autoPlay
            muted
            loop
            src={loopsVideo}
          />
          <p className='pulse'>Make loops with your fingers</p>
        </div>
      )}
      {(webcamRunning && firstLoop && !firstBubble) && (
        <div className="tutorial-step">
          <div className="threshold">
            <img className="wiggle" src={dragIcon}></img>
            <p className='pulse'>adjust noise threshold</p>
          </div>
          <p>Blow to start making bubbles!</p>
        </div>
      )}
    </div>
  );
}
