import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

const wasPinching = new Map();
const animatedTransforms = [];

const scene = new THREE.Scene();
scene.background = null; // transparent background
console.log('Scene created with transparent background');

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(0, 0, 1);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// Make canvas fully transparent
renderer.domElement.style.background = 'none';
console.log('Renderer created and configured with transparent background');

const loadingDiv = document.createElement('div');
loadingDiv.textContent = 'Loading';
loadingDiv.style.position = 'absolute';
loadingDiv.style.top = '50%';
loadingDiv.style.left = '50%';
loadingDiv.style.transform = 'translate(-50%, -50%)';
loadingDiv.style.color = 'white';
loadingDiv.style.fontSize = '24px';
loadingDiv.style.fontFamily = 'sans-serif';
loadingDiv.style.zIndex = '1000';
document.body.appendChild(loadingDiv);


// Fallback controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = !navigator.xr;

// Lighting
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
scene.add(light);

// Load 360° textures
const textureLoader = new THREE.TextureLoader();
const textures = [];
let loadedCount = 0;
const files = ['space1.jpg', 'space2.jpg', 'space3.jpg', 'space4.jpg'];

files.forEach((file, i) => {
  textureLoader.load(`textures/${file}`, tex => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    textures[i] = tex;
    loadedCount++;
    if (loadedCount === files.length) {
      initScene();
      loadingDiv.remove();
    }
  });
});

// Spheres
const spheres = [];
const sphereRadius = 0.15;

function initScene() {
  textures.forEach((texture, i) => {
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
    const geometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((i - 1) * 0.5, 0, -0.5);
    mesh.userData.id = i;
    mesh.userData.originalPosition = mesh.position.clone();
    spheres.push(mesh);
    scene.add(mesh);
    console.log(`Sphere created and added to scene with id: ${i}`);
  });
}

// Portal state
let portalSphere = null;
let isInPortal = false;

const hands = [];

// Utility function for smooth scaling with ease out
function animateTransform(object, targetScale, targetPosition, duration = 100) {
  const start = { x: object.scale.x, y: object.scale.y, z: object.scale.z };
  const end = targetScale;
  const startPos = { x: object.position.x, y: object.position.y, z: object.position.z };
  const endPos = targetPosition;
  const startTime = performance.now();

  animatedTransforms.push({
    object,
    start,
    end,
    startPos,
    endPos,
    duration,
    startTime
  });
}

function addHand(hand) {
  scene.add(hand);
  hands.push(hand);
  console.log('Hand added to scene (no 3D model)');
}

function enterPortal(sphere, viewerPosition) {
  console.log('Entering portal', sphere.userData.id);
  portalSphere = sphere;
  isInPortal = true;
  const offset = new THREE.Vector3(0, 0, -0.1).applyQuaternion(camera.quaternion);
  // Position is now handled by animateTransform
  animateTransform(sphere, new THREE.Vector3(30, 30, 30), camera.position.clone().add(offset), 150);
  spheres.forEach(s => {
    if (s !== sphere) s.visible = false;
  });
}

function exitPortal() {
  if (!portalSphere) return;
  console.log('Exiting portal');
  animateTransform(portalSphere, new THREE.Vector3(1, 1, 1), portalSphere.userData.originalPosition.clone(), 150);
  // Position is now handled by animateTransform
  spheres.forEach(s => s.visible = true);
  portalSphere = null;
  isInPortal = false;
}

function isPinching(hand) {
  const indexTip = hand.joints['index-finger-tip'];
  const thumbTip = hand.joints['thumb-tip'];
  if (!indexTip || !thumbTip) return false;
  const dist = indexTip.position.distanceTo(thumbTip.position);
  const pinching = dist < 0.03;
  return pinching;
}

function checkGrabs(referenceSpace, frame) {
  const viewerPose = frame.getViewerPose(referenceSpace);
  if (!viewerPose) return;

  const headPos = new THREE.Vector3().fromArray(viewerPose.transform.position);

  for (let i = 0; i < hands.length; i++) {
    const hand = hands[i];
    if (!hand.visible) continue;

    const pinching = isPinching(hand);
    const wasPreviouslyPinching = wasPinching.get(hand) || false;

    if (pinching && !wasPreviouslyPinching) {
      const handPos = hand.joints['index-finger-tip'].position;

      if (isInPortal) {
        const distToHead = handPos.distanceTo(headPos);
        exitPortal();
      } else {
        for (const sphere of spheres) {
          if (!sphere.visible) continue;
          const dist = handPos.distanceTo(sphere.position);
          if (dist < sphereRadius + 0.05) {
            enterPortal(sphere, headPos);
            break;
          }
        }
      }
    }

    wasPinching.set(hand, pinching);
  }
}

// Main render loop
function render(timestamp, frame) {
  if (renderer.xr.isPresenting && frame) {
    const session = renderer.xr.getSession();
    const referenceSpace = renderer.xr.getReferenceSpace();


    checkGrabs(referenceSpace, frame);
  }

  const now = performance.now();
  for (let i = animatedTransforms.length - 1; i >= 0; i--) {
    const anim = animatedTransforms[i];
    const t = Math.min(1, (now - anim.startTime) / anim.duration);
    const easedT = t * (2 - t); // easeOutQuad

    anim.object.scale.set(
      anim.start.x + (anim.end.x - anim.start.x) * easedT,
      anim.start.y + (anim.end.y - anim.start.y) * easedT,
      anim.start.z + (anim.end.z - anim.start.z) * easedT
    );

    anim.object.position.set(
      anim.startPos.x + (anim.endPos.x - anim.startPos.x) * easedT,
      anim.startPos.y + (anim.endPos.y - anim.startPos.y) * easedT,
      anim.startPos.z + (anim.endPos.z - anim.startPos.z) * easedT
    );

    if (t >= 1) {
      animatedTransforms.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}

// XR entry
document.getElementById('enter-vr-button').addEventListener('click', async () => {
  if (navigator.xr) {
    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    if (supported) {
      const session = await navigator.xr.requestSession('immersive-ar', {
        optionalFeatures: ['hand-tracking', 'dom-overlay', 'light-estimation'],
        requiredFeatures: ['local']
      });

      renderer.xr.setReferenceSpaceType('local');
      renderer.xr.setSession(session);
      session.addEventListener('inputsourceschange', () => {
        for (const source of session.inputSources) {
          if (source.hand && !hands.includes(source.hand)) {
            const handObject = renderer.xr.getHand(hands.length);
            addHand(handObject);
          }
        }
      });
      renderer.setAnimationLoop(render);
      console.log('XR session started');
    } else {
      alert('immersive-ar not supported.');
    }
  } else {
    alert('WebXR not supported.');
  }
});

// Desktop fallback
if (!navigator.xr) {
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}
