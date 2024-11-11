# Blow a Bubble
_Interactive Hand tracking app._  

Live Demo: https://daveseidman.github.io/blow-a-bubble/  

Using MediaPipe's hand pose detection, we find "loops" created by users fingers. We then display a flattened bubble inside those loops and wait for user to "blow" the bubble by actually blowing (monitor microphone for input volume level). 


### Current Status:
✅ Hand Tracking 
☑️ Loop Detection: works but should be generalized
✅ Basic 3D Scene & Camera Setup 
❎ Geometry Manipulation: replace extruded shape with bubble shape 
❎ Physics: bubbles should move naturally and possibly interact with hands
❎ Raymarching: this effect would be nice https://www.youtube.com/live/q2WcGi3Cr9w?
❎ Shaders: let's use meshTransmissionMaterial and incorporate the video stream in the environment map https://www.youtube.com/watch?v=tfVWCqO1hec