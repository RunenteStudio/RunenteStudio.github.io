// Import Three.js and MediaPipe Tasks for vision.
import * as THREE from "three";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

/**
 * Helper: Returns the viewport dimensions (width and height) at a given depth
 * from the camera.
 */
function getViewportSizeAtDepth(camera, depth) {
  const viewportHeightAtDepth =
    2 * depth * Math.tan(THREE.MathUtils.degToRad(0.5 * camera.fov));
  const viewportWidthAtDepth = viewportHeightAtDepth * camera.aspect;
  return new THREE.Vector2(viewportWidthAtDepth, viewportHeightAtDepth);
}

/**
 * Helper: Creates a plane mesh that exactly covers the camera's viewport at a given depth.
 * The geometry is translated so that it lies at z = -depth relative to the camera.
 */
function createCameraPlaneMesh(camera, depth, material) {
  if (depth < camera.near || depth > camera.far) {
    console.warn("Camera plane geometry may be clipped by the camera!");
  }
  const viewportSize = getViewportSizeAtDepth(camera, depth);
  const planeGeometry = new THREE.PlaneGeometry(viewportSize.x, viewportSize.y);
  // Translate the geometry so that the plane is placed at z = -depth.
  planeGeometry.translate(0, 0, -depth);
  return new THREE.Mesh(planeGeometry, material);
}

// Global variables for Three.js.
let scene, camera, renderer;

// Global variables for the MediaPipe face landmark detector.
let faceLandmarker = null;
let video = null; // Webcam video element.
let latestLandmarks = null; // Latest facial landmarks.
let latestBlendshapes = null; // Latest blendshape result.
let landmarkCubes = []; // Cube meshes representing face landmarks.
let referencePlane = null; // A plane below the face whose color is controlled by jawOpen.

// Global variable for the background plane.
let backgroundPlane = null;

// Initialize Three.js, MediaPipe, and start the animation.
init();
animate();

async function init() {
  initThree();
  await initFaceLandmarker();
}

// --- Three.js Setup ---
function initThree() {
  scene = new THREE.Scene();
  // (Do not set scene.background—we'll add a video background plane.)

  // Set up a perspective camera.
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 2);

  // Create the WebGL renderer.
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Add directional lights.
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight1.position.set(1, 3, 2);
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0x0000ff, 0.3);
  directionalLight2.position.set(-1, -1, -1);
  scene.add(directionalLight2);

  // Add a reference plane below the face.
  const planeGeometry = new THREE.PlaneGeometry(5, 5);
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,
    side: THREE.DoubleSide
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -1;
  scene.add(plane);
  referencePlane = plane;

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- MediaPipe and Webcam Setup ---
async function initFaceLandmarker() {
  // Create a video element for the webcam.
  video = document.createElement("video");
  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;
  // Instead of display: none, hide the video offscreen.
  video.style.position = "absolute";
  video.style.top = "-10000px";
  document.body.appendChild(video);

  try {
    // Request webcam access.
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();

    // Once the video is ready, create a VideoTexture and a background plane.
    video.addEventListener("loadeddata", () => {
      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBFormat;
      videoTexture.encoding = THREE.sRGBEncoding;
      // Create a MeshBasicMaterial with the video texture.
      const backgroundMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });
      // Disable depth writing so the background always stays behind.
      backgroundMaterial.depthWrite = false;
      // Use a large depth so that the plane is rendered behind all other objects.
      const backgroundDepth = 500;
      backgroundPlane = createCameraPlaneMesh(camera, backgroundDepth, backgroundMaterial);
      scene.add(backgroundPlane);
    });
  } catch (err) {
    console.error("Error accessing webcam:", err);
    return;
  }

  // Load MediaPipe WASM files.
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.1.0-alpha-16/wasm"
  );

  // Create the Face Landmarker.
  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "face_landmarker.task"
    },
    numFaces: 1,
    runningMode: "VIDEO",
    outputFaceBlendshapes: true
  });

  // Begin processing video frames.
  processVideoFrame();
}

async function processVideoFrame() {
  if (!faceLandmarker) return;
  const now = performance.now();
  const results = await faceLandmarker.detectForVideo(video, now);

  // Update landmarks and blendshapes if a face is detected.
  if (results.faceLandmarks && results.faceLandmarks.length > 0) {
    latestLandmarks = results.faceLandmarks[0];
    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      latestBlendshapes = results.faceBlendshapes[0];
    }
    // On the first detection, create cubes for each landmark.
    if (landmarkCubes.length === 0) {
      createLandmarkCubes(latestLandmarks.length);
    }
  }

  requestAnimationFrame(processVideoFrame);
}

// Create a cube for each facial landmark using a MeshStandardMaterial,
// with an initial random rotation.
function createLandmarkCubes(numLandmarks) {
  const cubeGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.02);
  const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.5,
    roughness: 0.5
  });

  for (let i = 0; i < numLandmarks; i++) {
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.rotation.x = Math.random() * Math.PI * 2;
    cube.rotation.y = Math.random() * Math.PI * 2;
    cube.rotation.z = Math.random() * Math.PI * 2;
    scene.add(cube);
    landmarkCubes.push(cube);
  }
}

// --- Render Loop ---
function animate() {
  requestAnimationFrame(animate);

  // Turntable camera animation: rotate the camera around the origin.
  const radius = 2.5;
  const speed = 0.0005;
  const angle = performance.now() * speed;
  camera.position.x = radius * Math.sin(angle);
  camera.position.z = radius * Math.cos(angle);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // Update cube positions based on detected landmarks.
  if (latestLandmarks && landmarkCubes.length === latestLandmarks.length) {
    for (let i = 0; i < latestLandmarks.length; i++) {
      const lm = latestLandmarks[i];
      landmarkCubes[i].position.x = (lm.x - 0.5) * 2;
      landmarkCubes[i].position.y = -(lm.y - 0.5) * 2;
      landmarkCubes[i].position.z = lm.z * 2; // Adjust scaling as needed.
    }
  }

  // Use the jawOpen blendshape to control the reference plane's color.
  if (latestBlendshapes && referencePlane) {
    const categories = latestBlendshapes.categories;
    const jawOpenCategory = categories.find(
      (category) => category.categoryName === "jawOpen"
    );
    if (jawOpenCategory) {
      const score = jawOpenCategory.score; // Expected between 0 and 1.
      const closedColor = new THREE.Color(0x555555);
      const openColor = new THREE.Color(0xff0000);
      const blendedColor = closedColor.clone().lerp(openColor, score);
      referencePlane.material.color.copy(blendedColor);
    }
  }

  renderer.render(scene, camera);
}
