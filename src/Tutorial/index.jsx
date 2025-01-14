import React, { useState } from 'react';

export default function Tutorial() {
  const [step, setStep] = useState(0);

  return (
    <div className="tutorial">
      <div className="step" />
      <div className="step" />
      <div className="step" />
    </div>
  );
}
