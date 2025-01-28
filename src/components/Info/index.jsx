import React, { useRef, useEffect } from 'react';
import './index.scss';

export default function Info({ showInfo, setShowInfo }) {
  return (
    <div className="info">
      <div className={`info-body ${showInfo ? '' : 'hidden'}`}>
        <p>
          This webapp uses
          <a href="https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js" target="mediapipe">Google's MediaPipe</a>
          to track hand poses in your camera stream and then looks for "loops" between pairs of joints. When a loop is detected a polygon is drawn with it's vertices and any audio coming into the microphone above the threshold will be used to spawn "bubbles". Bubbles are actually made up of RigidBody Spheres
          {' '}
        </p>
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
