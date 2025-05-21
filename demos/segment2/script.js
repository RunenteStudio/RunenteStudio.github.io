// Copyright 2023 The MediaPipe Authors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//      http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { ImageSegmenter, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";
// Get DOM elements
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");
const webcamPredictions = document.getElementById("webcamPredictions");
const demosSection = document.getElementById("demos");
let enableWebcamButton;
let webcamRunning = false;
const videoHeight = "1280px";
const videoWidth = "720px";
let runningMode = "IMAGE";
const resultWidthHeigth = 256;
let imageSegmenter;
let labels;
const legendColors = [
    [0, 0, 0, 255],
    [255, 0, 0, 255], //cabello
    [255, 255, 255, 255], //piel
    [255, 255, 255, 255], //piel
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255]
];
const createImageSegmenter = async () => {
    const audio = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm");
    imageSegmenter = await ImageSegmenter.createFromOptions(audio, {
        baseOptions: {
            modelAssetPath: "./selfie_multiclass_256x256.tflite",
            delegate: "GPU"
        },
        runningMode: runningMode,
        outputCategoryMask: true,
        outputConfidenceMasks: false
    });
    labels = imageSegmenter.getLabels();
    demosSection.classList.remove("invisible");
};
createImageSegmenter();
const imageContainers = document.getElementsByClassName("segmentOnClick");
// Add click event listeners for the img elements.
for (let i = 0; i < imageContainers.length; i++) {
    imageContainers[i]
        .getElementsByTagName("img")[0]
        .addEventListener("click", handleClick);
}

function adjustImage(contrast, brightness, saturation, color) {
    // Helper function to clamp a value between a minimum and maximum
    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }
  
    // First apply contrast and brightness adjustments to the red, green, and blue channels
    let adjusted = [];
    for (let i = 0; i < 3; i++) {
      adjusted[i] = clamp((color[i] - 128) * contrast + 128 + brightness, 0, 255);
    }
    // Preserve the alpha channel
    adjusted[3] = color[3];

    adjusted[0] -= 3;
    adjusted[1] += 4;
  
    // Compute the luminance using the adjusted RGB values
    const luminance = 0.299 * adjusted[0] + 0.587 * adjusted[1] + 0.114 * adjusted[2];
  
    // Apply saturation control to the red, green, and blue channels
    for (let i = 0; i < 3; i++) {
      adjusted[i] = clamp(luminance + saturation * (adjusted[i] - luminance), 0, 255);
    }
  
    return adjusted;
  }


/**
 * 01 Image: Segmented images on click and display results.
 */
let canvasClick;
async function handleClick(event) {
    // Do not segmented if imageSegmenter hasn't loaded
    if (imageSegmenter === undefined) {
        return;
    }
    canvasClick = event.target.parentElement.getElementsByTagName("canvas")[0];
    canvasClick.classList.remove("removed");
    canvasClick.width = event.target.naturalWidth;
    canvasClick.height = event.target.naturalHeight;
    const cxt = canvasClick.getContext("2d");
    cxt.clearRect(0, 0, canvasClick.width, canvasClick.height);
    cxt.drawImage(event.target, 0, 0, canvasClick.width, canvasClick.height);
    event.target.style.opacity = 0;
    // if VIDEO mode is initialized, set runningMode to IMAGE
    if (runningMode === "VIDEO") {
        runningMode = "IMAGE";
        await imageSegmenter.setOptions({
            runningMode: runningMode
        });
    }
    // imageSegmenter.segment() when resolved will call the callback function.
    imageSegmenter.segment(event.target, callback);
}
function callback(result) {
    const cxt = canvasClick.getContext("2d");
    const { width, height } = result.categoryMask;
    let imageData = cxt.getImageData(0, 0, width, height).data;
    canvasClick.width = width;
    canvasClick.height = height;
    let category = "";
    const mask = result.categoryMask.getAsUint8Array();
    for (let i in mask) {
        if (mask[i] > 0) {
            category = labels[mask[i]];
        }
        const legendColor = legendColors[mask[i] % legendColors.length];
        //imageData[i * 4] = (legendColor[0] + imageData[i * 4]) / 2;
        //imageData[i * 4 + 1] = (legendColor[1] + imageData[i * 4 + 1]) / 2;
        //imageData[i * 4 + 2] = (legendColor[2] + imageData[i * 4 + 2]) / 2;
        //imageData[i * 4 + 3] = (legendColor[3] + imageData[i * 4 + 3]) / 2;
        imageData[i * 4] = legendColor[0];
        imageData[i * 4 + 1] = legendColor[1];
        imageData[i * 4 + 2] = legendColor[2];
        imageData[i * 4 + 3] = legendColor[3];
    }
    const uint8Array = new Uint8ClampedArray(imageData.buffer);
    const dataNew = new ImageData(uint8Array, width, height);
    cxt.putImageData(dataNew, 0, 0);
    const p = event.target.parentNode.getElementsByClassName("classification")[0];
    p.classList.remove("removed");
    p.innerText = "Category: " + category;
}



/********************************************************************
// 02 Video: Continuously grab image from webcam stream and segmented it.
********************************************************************/
// Check if webcam access is supported.
function callbackForVideo(result) {
    let imageData = canvasCtx.getImageData(0, 0, video.videoWidth, video.videoHeight).data;
    const mask = result.categoryMask.getAsFloat32Array();

    // 00 - 
    // 01 - cabello
    // 02 - piel
    // 03 - cara

    for (let i = 0; i < mask.length; ++i) {
        const maskVal = Math.round(mask[i] * 255.0);
        const index = maskVal % legendColors.length;
        const contrast = 1.0;
        let legendColor = legendColors[index];
        let newColor = [0, 0, 0, 255]

        //legendColors ya no se necesita

        // cabello
        if(index == 1){
            newColor[0] = imageData[i * 4];
            newColor[1] = imageData[i * 4 + 1];
            newColor[2] = imageData[i * 4 + 2];
            newColor[3] = imageData[i * 4 + 3];

            newColor = adjustImage(1.2, 60.0, 1.0, newColor);

        // piel
        } else if(index == 2 || index == 3){
            newColor[0] = imageData[i * 4];
            newColor[1] = imageData[i * 4 + 1];
            newColor[2] = imageData[i * 4 + 2];
            newColor[3] = imageData[i * 4 + 3];

            newColor = adjustImage(0.85, 15.0, 0.95, newColor);

        // lo demás
        } else{
            newColor[0] = imageData[i * 4];
            newColor[1] = imageData[i * 4 + 1];
            newColor[2] = imageData[i * 4 + 2];
            newColor[3] = imageData[i * 4 + 3];
        }

        //imageData[j] = (legendColor[0] + imageData[j]) / 2;
        //imageData[j + 1] = (legendColor[1] + imageData[j + 1]) / 2;
        //imageData[j + 2] = (legendColor[2] + imageData[j + 2]) / 2;
        //imageData[j + 3] = (legendColor[3] + imageData[j + 3]) / 2;
        imageData[i * 4] = newColor[0];
        imageData[i * 4 + 1] = newColor[1];
        imageData[i * 4 + 2] = newColor[2];
        imageData[i * 4 + 3] = newColor[3];
    }
    const uint8Array = new Uint8ClampedArray(imageData.buffer);
    const dataNew = new ImageData(uint8Array, video.videoWidth, video.videoHeight);
    canvasCtx.putImageData(dataNew, 0, 0);

    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
// Get segmentation from the webcam
let lastWebcamTime = -1;
async function predictWebcam() {
    if (video.currentTime === lastWebcamTime) {
        if (webcamRunning === true) {
            window.requestAnimationFrame(predictWebcam);
        }
        return;
    }
    lastWebcamTime = video.currentTime;
    canvasCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    // Do not segmented if imageSegmenter hasn't loaded
    if (imageSegmenter === undefined) {
        return;
    }
    // if image mode is initialized, create a new segmented with video runningMode
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await imageSegmenter.setOptions({
            runningMode: runningMode
        });
    }
    let startTimeMs = performance.now();
    // Start segmenting the stream.
    imageSegmenter.segmentForVideo(video, startTimeMs, callbackForVideo);
}
// Enable the live webcam view and start imageSegmentation.
async function enableCam(event) {
    if (imageSegmenter === undefined) {
        return;
    }
    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "ENABLE SEGMENTATION";
    }
    else {
        webcamRunning = true;
        enableWebcamButton.innerText = "DISABLE SEGMENTATION";
    }
    // getUsermedia parameters. Use selected webcam if available from a select element with id 'videoSource'.
    let videoConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const videoSourceElement = document.getElementById('videoSource');
      if (videoSourceElement && videoSourceElement.value) {
        videoConstraints = {
          video: {
            deviceId: { exact: videoSourceElement.value },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
      }

    // Activate the webcam stream.
    video.srcObject = await navigator.mediaDevices.getUserMedia(videoConstraints);

    // When metadata is loaded, update the dimensions.
    video.addEventListener('loadedmetadata', () => {
      // Set explicit dimensions for the video element.
      video.width = 1280;
      video.height = 720;
      
      // Set explicit dimensions for the canvas used for predictions.
      canvasElement.width = 1280;
      canvasElement.height = 720;
      
      // Optionally, start the prediction loop now.
      predictWebcam();
    });
    
    // Mirror the canvas if needed.
    canvasElement.style.transform = "scaleX(-1)";
    
}
// If webcam supported, add event listener to button.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
}
else {
    console.warn("getUserMedia() is not supported by your browser");
}

navigator.mediaDevices.enumerateDevices()
  .then((devices) => {
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    const videoSourceElement = document.getElementById('videoSource');
    if (videoSourceElement) {
      // Clear existing options
      videoSourceElement.innerHTML = '';
      videoDevices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `Camera ${index + 1}`;
        videoSourceElement.appendChild(option);
      });
    } else {
      console.log('No video source element found.');
    }
    console.log('Available webcams:', videoDevices);
  })
  .catch((error) => console.error('Error fetching devices:', error));