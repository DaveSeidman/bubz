import React, { useRef, useEffect } from 'react';
import './index.scss';

export default function Info({ showInfo, setShowInfo }) {
  return (
    <div className="info">
      <div className={`info-body ${showInfo ? '' : 'hidden'}`}>
        <h1>Interactive Hand Tracking App</h1>
        <p>
          This app uses
          {' '}
          <a
            href="https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js"
            target="_blank"
            rel="noopener noreferrer"
          >
            MediaPipe's hand tracking
          </a>
          {' '}
          to find "loops" in hand poses. When enough audio is detected from the
          microphone (by blowing), we create bubbles. Bubbles are made up of rigid
          body spheres inside a physics engine. They are attracted to each other
          and affected by a slightly negative gravity. These spheres are wrapped
          in a
          {' '}
          <a
            href="https://drei.docs.pmnd.rs/abstractions/marching-cubes"
            target="_blank"
            rel="noopener noreferrer"
          >
            Marching Cubes
          </a>
          {' '}
          component to give them the smooth appearance of bubbles.
        </p>
        <button
          type="button"
          onClick={() => { setShowInfo(false); }}
        >
          ×
        </button>

      </div>

      <button
        type="button"
        className="info-button"
        onClick={() => { setShowInfo(!showInfo); }}
      >
        ⓘ
      </button>
    </div>
  );
}
