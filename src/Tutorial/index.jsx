import React, { useEffect, useState } from 'react';
import './index.scss';

export default function Tutorial({ webcamRunning, loops }) {
  const [firstLoop, setFirstLoop] = useState(false);

  useEffect(() => {
    if (loops?.length >= 1) setFirstLoop(true);
  }, [loops])

  return (
    <div className="tutorial">
      {!webcamRunning && (
        <div className="step">
          <p>Allow camera and microphone access</p>
          <button type="button" onClick={() => { }}>Next</button>
        </div>
      )}
      {(webcamRunning && !firstLoop) && (
        <div className="step">
          <p>Make loops with your fingers</p>
          <button type="button" onClick={() => { }}>Next</button>
        </div>
      )}
      {(webcamRunning && firstLoop) && (
        <div className="step">
          <p>Blow to start making bubbles!</p>
          <button type="button" onClick={() => { }}>Next</button>
        </div>
      )}
    </div>
  );
}
