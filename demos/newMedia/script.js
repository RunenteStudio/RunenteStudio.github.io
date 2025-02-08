// Import Three.js and MediaPipe Tasks for vision.
import * as THREE from "three";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// Global variables for Three.js.
let scene, camera, renderer;

// Global variables for the MediaPipe face landmark detector.
let faceLandmarker = null;
let video = null; // Will hold the webcam video element.
let latestLandmarks = null; // Latest array of landmarks for a face.
let latestBlendshapes = null; // Latest blendshape result.
let landmarkCubes = []; // Array to hold the cube meshes.
let referencePlane = null; // Reference to the plane for color updates.

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

  // Set the scene background to gray.
  scene.background = new THREE.Color(0x808080);

  // Set up a perspective camera.
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // Start the camera at an initial position.
  camera.position.set(0, 0, 2);

  // Create the WebGL renderer.
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Add a directional light from above (and slightly in front).
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight1.position.set(1, 3, -2);
  scene.add(directionalLight1);

  // Add a second directional light with less intensity from below and behind the face.
  const directionalLight2 = new THREE.DirectionalLight(0x0000ff, 0.3);
  directionalLight2.position.set(-1, -1, 1);
  scene.add(directionalLight2);

  const ambientLight = new THREE.AmbientLight( 0x6b6b6b );
  scene.add( ambientLight );

  // Add a reference plane below the face.
  const planeGeometry = new THREE.PlaneGeometry(5, 5);
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,
    side: THREE.DoubleSide
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  // Rotate the plane to be horizontal.
  plane.rotation.x = -Math.PI / 2;
  // Position the plane below the face landmarks.
  plane.position.y = -1;
  scene.add(plane);
  // Store a reference so we can update its material color.
  referencePlane = plane;

  window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- MediaPipe Setup ---
async function initFaceLandmarker() {
  // Create a hidden video element to capture the webcam.
  video = document.createElement("video");
  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;
  video.style.display = "none";
  document.body.appendChild(video);

  try {
    // Request access to the webcam.
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    console.error("Error accessing webcam:", err);
    return;
  }

  // Load the WASM files required by MediaPipe.
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.1.0-alpha-16/wasm"
  );

  // Create the Face Landmarker.
  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "face_landmarker.task"
    },
    numFaces: 1,         // Process one face at a time.
    runningMode: "VIDEO", // Use the video mode.
    outputFaceBlendshapes: true
  });

  // Begin processing video frames.
  processVideoFrame();
}

async function processVideoFrame() {
  if (!faceLandmarker) return;

  const now = performance.now();
  const results = await faceLandmarker.detectForVideo(video, now);

  // If a face is detected, update the latest landmarks and blendshapes.
  if (results.faceLandmarks && results.faceLandmarks.length > 0) {
    latestLandmarks = results.faceLandmarks[0];
    // Check if blendshapes are provided.
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

// Create a cube for each landmark using a Standard material with random initial rotations.
function createLandmarkCubes(numLandmarks) {
  const cubeGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.02);
  const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.5,
    roughness: 0.5
  });

  for (let i = 0; i < numLandmarks; i++) {
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    // Set an initial random rotation in the x, y, and z axes.
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

  // Turntable camera animation: rotate camera around the origin.
  const radius = 2.5;
  const speed = 0.0005;
  const angle = performance.now() * speed;
  camera.position.x = radius * Math.sin(angle);
  camera.position.z = radius * Math.cos(angle);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // Update landmark cube positions if landmarks are available.
  if (latestLandmarks && landmarkCubes.length === latestLandmarks.length) {
    for (let i = 0; i < latestLandmarks.length; i++) {
      const lm = latestLandmarks[i];
      // Convert normalized MediaPipe coordinates to Three.js space.
      landmarkCubes[i].position.x = (lm.x - 0.5) * 2;
      landmarkCubes[i].position.y = -(lm.y - 0.5) * 2;
      landmarkCubes[i].position.z = lm.z * 2; // Adjust scaling as needed.
    }
  }

  // Use the jawOpen blendshape to control the plane's base color.
  // Expecting latestBlendshapes.categories to be an array of blendshape categories.
  if (latestBlendshapes && referencePlane) {
    const categories = latestBlendshapes.categories;
    // Find the jawOpen blendshape category.
    const jawOpenCategory = categories.find(category => category.categoryName === "jawOpen");
    if (jawOpenCategory) {
      const score = jawOpenCategory.score; // Expected to be between 0 and 1.
      // Interpolate between the closed color (gray) and open color (red).
      const closedColor = new THREE.Color(0x555555);
      const openColor = new THREE.Color(0xff0000);
      const blendedColor = closedColor.clone().lerp(openColor, score);
      referencePlane.material.color.copy(blendedColor);
    }
  }

  renderer.render(scene, camera);
}
