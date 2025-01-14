import React, { useState } from 'react';
import './index.scss';

export default function Tutorial() {
  const [step, setStep] = useState(0);

  return (
    <div className="tutorial">
      <div className="step">
        <p>Allow camera and microphone access</p>
      </div>
      <div className="step">
        <p>Adjust noise threshold so that blowing makes the bar wide enough</p>
        <div className="step">
          <p>Blow some bubbles using your fingers!</p>
        </div>
      </div>
    </div>
  );
}
