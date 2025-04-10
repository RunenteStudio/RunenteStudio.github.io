// Import necessary Three.js modules and helpers.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRCubeTextureLoader } from 'three/addons/loaders/HDRCubeTextureLoader.js';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import GUI from 'lil-gui';

// --- PARAMETERS & SIMULATION SETUP ---

// GUI-controlled simulation parameters.
const simParams = {
  attractionStrength: 0.5,
  repulsionStrength: 0.5,
  alignmentWeight: 0.3,
  cohesionWeight: 0.3,
  centerAttractionStrength: 0.1,
  collisionAvoidanceStrength: 1.0,
  collisionDistance: 0.3,
  damping: 0.98,
  bounceFactor: 0.8,
  baseVelocity: 1.0,
  // thresholds for size-based behavior
  attractThreshold: 1.3,
  repelThreshold: 0.8
};

// Size of the simulation texture (width = 4 → 16 instances; can be changed via GUI)
let simulationWidth = 4;
const instanceCount = simulationWidth * simulationWidth;

// The simulation space boundaries.
const boundaryMin = -50;
const boundaryMax = 50;

// Create an array to hold each instance’s constant scale (random between 0.5 and 2)
// and also an array for initial angular velocity.
const instanceScales = new Float32Array(instanceCount);
const initialAngularVelocities = new Float32Array(instanceCount * 4); // store as vec3

// Create initial data arrays for simulation textures.
const initialPositions = new Float32Array(instanceCount * 4);
const initialVelocities = new Float32Array(instanceCount * 4);
const initialRotations = new Float32Array(instanceCount * 4); // quaternion (x,y,z,w)

// Randomly initialize each instance.
for (let i = 0; i < instanceCount; i++) {
  // random scale between 0.5 and 2.
  const scale = 0.5 + Math.random() * 1.5;
  instanceScales[i] = scale;

  // random position within the cube.
  const posX = THREE.MathUtils.lerp(boundaryMin, boundaryMax, Math.random());
  const posY = THREE.MathUtils.lerp(boundaryMin, boundaryMax, Math.random());
  const posZ = THREE.MathUtils.lerp(boundaryMin, boundaryMax, Math.random());
  initialPositions[i * 4 + 0] = posX;
  initialPositions[i * 4 + 1] = posY;
  initialPositions[i * 4 + 2] = posZ;
  initialPositions[i * 4 + 3] = 1.0; // unused

  // initial velocity: random direction; magnitude = (scale * baseVelocity)
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI;
  const speed = scale * simParams.baseVelocity;
  const vx = speed * Math.sin(phi) * Math.cos(theta);
  const vy = speed * Math.sin(phi) * Math.sin(theta);
  const vz = speed * Math.cos(phi);
  initialVelocities[i * 4 + 0] = vx;
  initialVelocities[i * 4 + 1] = vy;
  initialVelocities[i * 4 + 2] = vz;
  initialVelocities[i * 4 + 3] = 1.0;

  // initial rotation as quaternion (random normalized quaternion)
  const axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
  const angle = Math.random() * Math.PI * 2;
  const quat = new THREE.Quaternion().setFromAxisAngle(axis, angle);
  initialRotations[i * 4 + 0] = quat.x;
  initialRotations[i * 4 + 1] = quat.y;
  initialRotations[i * 4 + 2] = quat.z;
  initialRotations[i * 4 + 3] = quat.w;

  // initial angular velocity (random in range ±0.1 rad/s for each component)
  initialAngularVelocities[i * 4 + 0] = (Math.random() - 0.5) * 0.2;
  initialAngularVelocities[i * 4 + 1] = (Math.random() - 0.5) * 0.2;
  initialAngularVelocities[i * 4 + 2] = (Math.random() - 0.5) * 0.2;
  initialAngularVelocities[i * 4 + 3] = 1.0;
}

// --- THREE.JS SCENE SETUP ---

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x808080);

// Set up camera and renderer.
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 200);
camera.position.set(0, 0, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load the HDR environment map for reflections.
const hdrUrls = [
  '/demos/hdri/px.png', '/demos/hdri/nx.png',
  '/demos/hdri/py.png', '/demos/hdri/ny.png',
  '/demos/hdri/pz.png', '/demos/hdri/nz.png'
];
const envMap = new THREE.CubeTextureLoader()
  .load(hdrUrls);
scene.environment = envMap; // affects materials’ reflections

// --- GPU COMPUTATION SETUP ---

// Create a GPUComputationRenderer with texture size equal to simulationWidth.
const gpuCompute = new GPUComputationRenderer(simulationWidth, simulationWidth, renderer);
if (renderer.capabilities.isWebGL2 === false) {
  gpuCompute.setDataType(THREE.FloatType);
}

// Helper function: create a DataTexture from initial data.
function createDataTexture(dataArray, itemSize = 4) {
  const data = new THREE.DataTexture(dataArray, simulationWidth, simulationWidth, THREE.RGBAFormat, THREE.FloatType);
  data.needsUpdate = true;
  return data;
}

// Create initial data textures.
const posTexture = createDataTexture(initialPositions);
const velTexture = createDataTexture(initialVelocities);
const rotTexture = createDataTexture(initialRotations);
// For angular velocity we pack 3 values into RGBA (with A unused).
const angTexture = new THREE.DataTexture(initialAngularVelocities, simulationWidth, simulationWidth, THREE.RGBAFormat, THREE.FloatType);
angTexture.needsUpdate = true;

// Create simulation variables.
const posVar = gpuCompute.addVariable('texturePosition', positionFragmentShader(), posTexture);
const velVar = gpuCompute.addVariable('textureVelocity', velocityFragmentShader(), velTexture);
const rotVar = gpuCompute.addVariable('textureRotation', rotationFragmentShader(), rotTexture);
const angVar = gpuCompute.addVariable('textureAngularVelocity', angularVelocityFragmentShader(), angTexture);

// Set variable dependencies.
gpuCompute.setVariableDependencies(posVar, [posVar, velVar]);
gpuCompute.setVariableDependencies(velVar, [posVar, velVar]);
gpuCompute.setVariableDependencies(rotVar, [rotVar, angVar]);
gpuCompute.setVariableDependencies(angVar, [angVar]);

// Initialize the GPUComputationRenderer.
const error = gpuCompute.init();
if (error !== null) {
  console.error(error);
}

posVar.material.uniforms.dt = { value: 0.016 };
rotVar.material.uniforms.dt = { value: 0.016 };
angVar.material.uniforms.dt = { value: 0.016 };

// Add uniforms to velocity shader.
velVar.material.uniforms.positionTexture = { value: posVar.renderTargets[0].texture };
velVar.material.uniforms.scales = { value: instanceScales };
velVar.material.uniforms.textureSize = { value: simulationWidth };
velVar.material.uniforms.dt = { value: 0.016 };
velVar.material.uniforms.attractionStrength = { value: simParams.attractionStrength };
velVar.material.uniforms.repulsionStrength = { value: simParams.repulsionStrength };
velVar.material.uniforms.alignmentWeight = { value: simParams.alignmentWeight };
velVar.material.uniforms.cohesionWeight = { value: simParams.cohesionWeight };
velVar.material.uniforms.centerAttractionStrength = { value: simParams.centerAttractionStrength };
velVar.material.uniforms.collisionAvoidanceStrength = { value: simParams.collisionAvoidanceStrength };
velVar.material.uniforms.collisionDistance = { value: simParams.collisionDistance };
velVar.material.uniforms.damping = { value: simParams.damping };
velVar.material.uniforms.bounceFactor = { value: simParams.bounceFactor };
velVar.material.uniforms.baseVelocity = { value: simParams.baseVelocity };
velVar.material.uniforms.boundaryMin = { value: boundaryMin };
velVar.material.uniforms.boundaryMax = { value: boundaryMax };
velVar.material.uniforms.attractThreshold = { value: simParams.attractThreshold };
velVar.material.uniforms.repelThreshold = { value: simParams.repelThreshold };
velVar.material.uniforms.totalInstances = { value: instanceCount };

// (Other simulation uniforms can be added to the appropriate variables similarly.)

// --- COMPUTE SHADER FRAGMENT SOURCES ---
//
// Each function below returns a string containing GLSL code for the corresponding simulation step.
// Note: These shaders use a fixed loop over TOTAL_INSTANCES (passed as uniform totalInstances)
// and assume gl_FragCoord.xy gives the pixel coordinate corresponding to an instance.

// Velocity shader: computes new velocity based on forces.
function velocityFragmentShader() {
  return `
    uniform sampler2D positionTexture;
    uniform sampler2D textureVelocity;
    uniform float dt;
    uniform float textureSize;
    uniform float totalInstances;
    uniform float baseVelocity;
    uniform float attractionStrength;
    uniform float repulsionStrength;
    uniform float alignmentWeight;
    uniform float cohesionWeight;
    uniform float centerAttractionStrength;
    uniform float collisionAvoidanceStrength;
    uniform float collisionDistance;
    uniform float damping;
    uniform float bounceFactor;
    uniform float boundaryMin;
    uniform float boundaryMax;
    uniform float attractThreshold;
    uniform float repelThreshold;
    // Array of scales (constant per instance)
    uniform float scales[${instanceCount}];

    void main() {
      vec2 uv = gl_FragCoord.xy / textureSize;
      vec3 pos = texture2D(positionTexture, uv).xyz;
      vec3 vel = texture2D(textureVelocity, uv).xyz;

      // Compute index for this instance.
      float index = (gl_FragCoord.y - 0.5) * textureSize + (gl_FragCoord.x - 0.5);
      int myIndex = int(index);
      float myScale = scales[myIndex];

      vec3 force = vec3(0.0);
      vec3 avgVel = vec3(0.0);
      vec3 avgPos = vec3(0.0);
      int count = 0;

      // Loop over all instances.
      for (int i = 0; i < ${instanceCount}; i++) {
        // Compute UV for instance i.
        float x = mod(float(i), textureSize);
        float y = floor(float(i) / textureSize);
        vec2 uvOther = (vec2(x, y) + 0.5) / textureSize;
        vec3 otherPos = texture2D(positionTexture, uvOther).xyz;
        vec3 otherVel = texture2D(textureVelocity, uvOther).xyz;
        float otherScale = scales[i];

        // Skip self.
        if (i == myIndex) continue;

        vec3 delta = otherPos - pos;
        float dist = length(delta) + 0.0001;
        vec3 dir = delta / dist;

        // Size-based attraction/repulsion.
        if (otherScale > attractThreshold) {
          force += dir * (attractionStrength / dist);
        } else if (otherScale < repelThreshold) {
          force -= dir * (repulsionStrength / dist);
        }

        // Collision avoidance: simple repulsion when too close.
        if (dist < collisionDistance) {
          force -= dir * collisionAvoidanceStrength * (collisionDistance - dist) / collisionDistance;
        }

        // For alignment and cohesion.
        avgVel += otherVel;
        avgPos += otherPos;
        count++;
      }
      if (count > 0) {
        avgVel /= float(count);
        avgPos /= float(count);
        force += (avgVel - vel) * alignmentWeight;
        force += (avgPos - pos) * cohesionWeight;
      }
      // Center attraction.
      force += -pos * centerAttractionStrength;

      // Boundary bounce force.
      for (int j = 0; j < 3; j++) {
        float comp = pos[j];
        if (comp < boundaryMin) {
          force[j] += (boundaryMin - comp) * bounceFactor;
        } else if (comp > boundaryMax) {
          force[j] += (boundaryMax - comp) * bounceFactor;
        }
      }

      // Update velocity.
      vel += force * dt;
      vel *= damping;

      // Clamp speed: upper limit = baseVelocity * myScale * 2.
      float maxSpeed = baseVelocity * myScale * 2.0;
      if (length(vel) > maxSpeed) {
        vel = normalize(vel) * maxSpeed;
      }

      gl_FragColor = vec4(vel, 1.0);
    }
  `;
}

// Position shader: updates position using the (new) velocity.
function positionFragmentShader() {
  return `
    uniform sampler2D positionTexture;
    uniform sampler2D textureVelocity;
    uniform float dt;
    uniform float textureSize;
    uniform float boundaryMin;
    uniform float boundaryMax;

    void main() {
      vec2 uv = gl_FragCoord.xy / textureSize;
      vec3 pos = texture2D(positionTexture, uv).xyz;
      vec3 vel = texture2D(textureVelocity, uv).xyz;

      pos += vel * dt;

      // Optional: keep positions within boundaries (if objects go slightly outside, they will be pushed back by bounce forces).
      pos = clamp(pos, vec3(boundaryMin), vec3(boundaryMax));

      gl_FragColor = vec4(pos, 1.0);
    }
  `;
}

// Angular velocity shader: here we simply damp the angular velocity.
function angularVelocityFragmentShader() {
  return `
    uniform sampler2D textureAngularVelocity;
    uniform float dt;
    uniform float damping; // re-use damping for angular velocity

    void main() {
      vec2 uv = gl_FragCoord.xy / float(${simulationWidth});
      vec3 angVel = texture2D(textureAngularVelocity, uv).xyz;
      angVel *= damping;
      gl_FragColor = vec4(angVel, 1.0);
    }
  `;
}

// Rotation shader: update quaternion based on angular velocity.
// (This simple integration converts the angular velocity vector into a quaternion delta.)
function rotationFragmentShader() {
  return `
    uniform sampler2D textureRotation;
    uniform sampler2D textureAngularVelocity;
    uniform float dt;
    uniform float textureSize;

    // Quaternion multiplication.
    vec4 quatMultiply(vec4 q1, vec4 q2) {
      return vec4(
        q1.w * q2.xyz + q2.w * q1.xyz + cross(q1.xyz, q2.xyz),
        q1.w * q2.w - dot(q1.xyz, q2.xyz)
      );
    }

    // Convert angular velocity (radians per second) to a quaternion delta.
    vec4 angularVelocityToQuat(vec3 angVel, float dt) {
      float angle = length(angVel) * dt;
      if(angle < 0.0001) return vec4(0.0, 0.0, 0.0, 1.0);
      vec3 axis = normalize(angVel);
      float s = sin(angle * 0.5);
      return vec4(axis * s, cos(angle * 0.5));
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / textureSize;
      vec4 rot = texture2D(textureRotation, uv);
      vec3 angVel = texture2D(textureAngularVelocity, uv).xyz;

      vec4 deltaQuat = angularVelocityToQuat(angVel, dt);
      // Update rotation by quaternion multiplication.
      rot = quatMultiply(deltaQuat, rot);
      // Normalize to avoid drift.
      rot = normalize(rot);

      gl_FragColor = rot;
    }
  `;
}

// --- LOAD THE MODEL AND SET UP THE INSTANCED MESH ---

const gltfLoader = new GLTFLoader();
gltfLoader.load('/demos/cristal/cristal.glb', (gltf) => {
  // Assume the GLB contains one mesh with a BufferGeometry.
  const sourceMesh = gltf.scene.children[0];
  const geometry = sourceMesh.geometry;

  // Create an InstancedMesh.
  const instancedMesh = new THREE.InstancedMesh(geometry, new THREE.MeshStandardMaterial({
    metalness: 0.9,
    roughness: 0.1,
    envMap: envMap
  }), instanceCount);

  // For the custom transform, we add an instance attribute for scale.
  const scaleAttr = new THREE.InstancedBufferAttribute(instanceScales, 1);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  instancedMesh.geometry.setAttribute('instanceScale', scaleAttr);

  // Override the material’s vertex shader so that each instance’s model matrix comes from the simulation textures.
  instancedMesh.material.onBeforeCompile = (shader) => {
    // Pass simulation textures and texture size as uniforms.
    shader.uniforms.positionTexture = { value: gpuCompute.getCurrentRenderTarget(posVar).texture };
    shader.uniforms.rotationTexture = { value: gpuCompute.getCurrentRenderTarget(rotVar).texture };
    shader.uniforms.textureSize = { value: simulationWidth };

    // Add an attribute for instanceScale.
    shader.vertexShader = `
      attribute float instanceScale;
      uniform sampler2D positionTexture;
      uniform sampler2D rotationTexture;
      uniform float textureSize;
      
      // Convert a quaternion to a 4x4 rotation matrix.
      mat4 quatToMat4(vec4 q) {
        float x = q.x, y = q.y, z = q.z, w = q.w;
        return mat4(
          1.0 - 2.0 * y * y - 2.0 * z * z, 2.0 * x * y - 2.0 * z * w,       2.0 * x * z + 2.0 * y * w,       0.0,
          2.0 * x * y + 2.0 * z * w,       1.0 - 2.0 * x * x - 2.0 * z * z, 2.0 * y * z - 2.0 * x * w,       0.0,
          2.0 * x * z - 2.0 * y * w,       2.0 * y * z + 2.0 * x * w,       1.0 - 2.0 * x * x - 2.0 * y * y, 0.0,
          0.0,                             0.0,                             0.0,                             1.0
        );
      }
      
      // Compute instance transform from simulation textures.
      mat4 getInstanceMatrix() {
        float instanceId = float(gl_InstanceID);
        float x = mod(instanceId, textureSize);
        float y = floor(instanceId / textureSize);
        vec2 uv = (vec2(x, y) + 0.5) / textureSize;
        vec3 pos = texture2D(positionTexture, uv).xyz;
        vec4 quat = texture2D(rotationTexture, uv);
        mat4 rotMatrix = quatToMat4(quat);
        // Build scale matrix.
        mat4 scaleMatrix = mat4(
          instanceScale, 0.0, 0.0, 0.0,
          0.0, instanceScale, 0.0, 0.0,
          0.0, 0.0, instanceScale, 0.0,
          0.0, 0.0, 0.0, 1.0
        );
        mat4 m = rotMatrix * scaleMatrix;
        m[3] = vec4(pos, 1.0);
        return m;
      }
      
      // Replace the beginning of the vertex shader.
      mat4 instanceMatrix = getInstanceMatrix();
    ` + shader.vertexShader;

    // Replace the default transformation to use our computed instanceMatrix.
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      'vec3 transformed = (instanceMatrix * vec4(position, 1.0)).xyz;'
    );
  };

  scene.add(instancedMesh);

  // --- GUI SETUP ---
  const gui = new GUI();
  gui.add(simParams, 'attractionStrength', 0, 2).onChange(v => velVar.material.uniforms.attractionStrength.value = v);
  gui.add(simParams, 'repulsionStrength', 0, 2).onChange(v => velVar.material.uniforms.repulsionStrength.value = v);
  gui.add(simParams, 'alignmentWeight', 0, 2).onChange(v => velVar.material.uniforms.alignmentWeight.value = v);
  gui.add(simParams, 'cohesionWeight', 0, 2).onChange(v => velVar.material.uniforms.cohesionWeight.value = v);
  gui.add(simParams, 'centerAttractionStrength', 0, 1).onChange(v => velVar.material.uniforms.centerAttractionStrength.value = v);
  gui.add(simParams, 'collisionAvoidanceStrength', 0, 5).onChange(v => velVar.material.uniforms.collisionAvoidanceStrength.value = v);
  gui.add(simParams, 'collisionDistance', 0.1, 1.0).onChange(v => velVar.material.uniforms.collisionDistance.value = v);
  gui.add(simParams, 'damping', 0.9, 1.0).onChange(v => {
    velVar.material.uniforms.damping.value = v;
    // Also update angular velocity damping if needed.
  });
  gui.add(simParams, 'bounceFactor', 0, 1).onChange(v => velVar.material.uniforms.bounceFactor.value = v);
  // You could add more controls (e.g., baseVelocity) as desired.

  // --- ANIMATION LOOP ---
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    // Update dt uniform.
    velVar.material.uniforms.dt.value = dt;
    posVar.material.uniforms.dt.value = dt;
    rotVar.material.uniforms.dt.value = dt;
    angVar.material.uniforms.dt.value = dt;

    // Compute simulation.
    gpuCompute.compute();

    // Update the material uniforms with the latest simulation textures.
    instancedMesh.material.uniforms.positionTexture.value = gpuCompute.getCurrentRenderTarget(posVar).texture;
    instancedMesh.material.uniforms.rotationTexture.value = gpuCompute.getCurrentRenderTarget(rotVar).texture;

    renderer.render(scene, camera);
  }
  animate();
});
