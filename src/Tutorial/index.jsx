import React, { useState } from 'react';
import './index.scss';

export default function Tutorial({ step, setStep }) {
  const maxSteps = 3;

  return (
    <div className={`tutorial ${step < maxSteps ? '' : 'hidden'}`}>
      {step === 0 && (
        <div className="step">
          <p>Allow camera and microphone access</p>
          <button type="button" onClick={() => { setStep(step + 1); }}>Next</button>
        </div>
      )}
      {step === 1 && (
        <div className="step">
          <p>Adjust noise threshold</p>
          <button type="button" onClick={() => { setStep(step + 1); }}>Next</button>
        </div>
      )}
      {step === 2 && (
        <div className="step">
          <p>Blow some bubbles using your fingers!</p>
          <button type="button" onClick={() => { setStep(step + 1); }}>Next</button>
        </div>
      )}
    </div>
  );
}
