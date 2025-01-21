import React, { useEffect, useState } from 'react';
import './index.scss';

export default function Tutorial({ webcamRunning, loops, bubbles }) {
  const [firstLoop, setFirstLoop] = useState(false);
  const [firstBubble, setFirstBubble] = useState(false);

  useEffect(() => {
    if (loops?.length >= 1) setFirstLoop(true);
  }, [loops])

  return (
    <div className="tutorial">
      {!webcamRunning && (
        <div className="tutorial-step">
          <p>allow camera and microphone access</p>
        </div>
      )}
      {(webcamRunning && !firstLoop) && (
        <div className="tutorial-step">
          <p>Make loops with your fingers</p>
        </div>
      )}
      {(webcamRunning && firstLoop && !firstBubble) && (
        <div className="tutorial-step">
          <p>Blow to start making bubbles!</p>
        </div>
      )}
    </div>
  );
}
