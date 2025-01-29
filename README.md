# 🫧 Bubz 
interactive hand tracking app

**Live Demo:** https://daveseidman.github.io/bubz/  

![image](demo.gif)

This app uses [MediaPipe's hand tracking](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js) to find "loops" in hand poses. When enough audio is detected from the microphone (by blowing) we create bubbles. Bubbles are made up of rigid bodies spheres inside a physics engine. They and are attracted to each other and affected by a slightly negative gravity. These spheres are wrapped in a [Marching Cubes](https://drei.docs.pmnd.rs/abstractions/marching-cubes) component to give them the smooth appearance of Bubbles.

---

**TODO:**  

- Timeout on Tutorial step one to prevent skipping
- Improve marching cubes performance (WebGPU?)