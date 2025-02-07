import "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js";
import "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";

import { VERTECS } from "vertecs";
import * as THREE 		from "three";
import Stats 			from "three/addons/libs/stats.module.js";
import { FBXLoader } 	from "three/addons/loaders/FBXLoader.js";
import { GUI } 			from 'three/addons/libs/lil-gui.module.min.js';
//import { GUI } 			from "three/addons/libs/dat.gui.module.js";

//////////////////////////////////////////////////
// Create GUI

// https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
// https://github.com/google/mediapipe/blob/master/mediapipe/graphs/face_effect/data/facepaint.pngblob
const masks = { 
	"mask 001": "/demos/faceAssets/threeFace.jpg", 
	"mask 002": "./img/canonical_face_model_uv_visualization.png", 
};

const skinNormalMap = new THREE.TextureLoader().load("/demos/faceAssets/normalmap.jpg");
skinNormalMap.colorSpace = THREE.LinearSRGBColorSpace;

const params = {
	masks: masks[ "mask 001" ],
};

function setupMaskTexture() {
	const texture = new THREE.TextureLoader().load( params.masks );
	texture.colorSpace = THREE.SRGBColorSpace;
	maskObject.children[0].material.map = texture;
}

const gui = new GUI();
const assets = gui.addFolder( "1632" );
assets.add( params, "masks", masks ).onChange( setupMaskTexture );
assets.open();
//////////////////////////////////////////////////

//////////////////////////////////////////////////
// Create Video & DeviceCamera
async function updateFrames() {
	await faceMesh.send({image: video});
	renderer.render(scene, camera);
	stats.update();
}

const ua = navigator.userAgent;
var isSP = false
if(ua.indexOf("iPhone") > 0 || ua.indexOf("Android") > 0 && ua.indexOf("Mobile") > 0){
	isSP = true;
}

const video = document.createElement( "video" );
video.playsInline = true;

var deviceCamera
var width;
var height;
if (isSP) {
	deviceCamera = new Camera(video, {
		onFrame: updateFrames,
		width: 1280,
		height: 720
	});
	width = 720;
	height = 1280;
} else{
	deviceCamera = new Camera(video, {
		onFrame: updateFrames,
	});
	width = deviceCamera.g.width;
	height = deviceCamera.g.height;
}
//////////////////////////////////////////////////

//////////////////////////////////////////////////
// Create Mask
async function loadMaskObject(path) {
	return new Promise((resolve, reject) => {
		const loader = new FBXLoader();
		loader.load( path, ( object ) => {
			resolve( object );	
		});
	});
}

const shadeMat = new THREE.MeshBasicMaterial({
	color: 0xffffff,
	map: new THREE.TextureLoader().load( masks[ "mask 001" ] ),
	blending: THREE.MultiplyBlending
});
shadeMat.map.colorSpace = THREE.SRGBColorSpace;


const normalMat = new THREE.MeshStandardMaterial({
	color: 0xffffff,
	map: new THREE.TextureLoader().load( masks[ "mask 001" ] ),
	//normalMap: skinNormalMap,
	roughness: 0.2,
	metalness: 0.5
});
normalMat.map.colorSpace = THREE.SRGBColorSpace;


const path = "./canonical_face_model.fbx";
const maskObject = await loadMaskObject( path ).then((res) => res);
const wrinkleObject = await loadMaskObject( path ).then((res) => res);

maskObject.children[0].material = shadeMat;
maskObject.scale.set(width, height, 1);
maskObject.rotation.x = Math.PI;

wrinkleObject.children[0].material = normalMat;
wrinkleObject.scale.set(width, height, 1);
wrinkleObject.rotation.x = Math.PI;


//////////////////////////////////////////////////

//////////////////////////////////////////////////
// Create WebGLRenderer
function createRender() {
	const renderer = new THREE.WebGLRenderer();
	THREE.ColorManagement.enabled = true;
	renderer.setSize(width, height);
	renderer.setClearColor(0x000000, 0);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.autoClear = false;
	document.body.appendChild(renderer.domElement);
	return renderer
}

const renderer = createRender();

const imgCanvasElement = document.createElement("canvas");
imgCanvasElement.width = width;
imgCanvasElement.height = height;
imgCanvasElement.style.visibility ="hidden";

const imgCanvasCtx = imgCanvasElement.getContext("bitmaprenderer");
const imgTexture = new THREE.CanvasTexture( imgCanvasElement )
imgTexture.colorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
camera.position.set(0, 0, 2);

const light = new THREE.AmbientLight(0xFFFFFF, 0.1);
const dirLight = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
const hLight = new THREE.HemisphereLight( 0xffffff, 0xf7f4d5, 0.9 );
dirLight.position.set(0.3, -0.5, 0.5);

scene.add(light);
scene.add(dirLight);
scene.add(hLight);

//scene.add(maskObject);
scene.add(wrinkleObject);
scene.background = imgTexture;
//////////////////////////////////////////////////

//////////////////////////////////////////////////
// Create FaceMesh
function createFaceMesh() {
	const faceMesh = new FaceMesh({locateFile: (file) => {
		console.log(file);
		return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
	}});

	faceMesh.setOptions({
		static_image_mode: false,
		selfieMode: true,
		enableFaceGeometry: true,
		maxNumFaces: 1,
		//refineLandmarks: false,
		refineLandmarks: false,
		minDetectionConfidence: 0.7,
		minTrackingConfidence: 0.7
	});
	return faceMesh
}

async function onResults(results) {
	try {
		const imageBitmap = await createImageBitmap( results.image );
		imgCanvasCtx.transferFromImageBitmap(imageBitmap);
		imgTexture.needsUpdate = true;

		const multiFaceLandmarks = results.multiFaceLandmarks;
		for (const index in multiFaceLandmarks) {
			const faceLandmark = multiFaceLandmarks[index];
			const vertices = [];
			for (const index in VERTECS) {
				const landmarksIndex = VERTECS[index];
				const newVec = faceLandmark[landmarksIndex - 1];
				vertices.push(newVec.x - 0.5, newVec.y - 0.5, newVec.z);
			}
			const verticesArray = new Float32Array(vertices)
			wrinkleObject.children[0].geometry.attributes.position.copyArray(verticesArray);
			wrinkleObject.children[0].geometry.attributes.position.needsUpdate = true;
			//console.log(verticesArray[0] + ' ' + verticesArray[1] + ' ' + verticesArray[2]);
		}

	} catch(e) {
		console.log( e.message );
	}
}

const faceMesh = createFaceMesh();
await faceMesh.initialize();
faceMesh.onResults(onResults);
//////////////////////////////////////////////////

//////////////////////////////////////////////////
// Init
const stats = new Stats();
document.getElementsByTagName("body")[0].appendChild( stats.dom );

deviceCamera.start();
//////////////////////////////////////////////////