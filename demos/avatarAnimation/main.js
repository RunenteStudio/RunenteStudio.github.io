import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, renderer, camera;
let model, skeleton, mixer, clock;
let chatContainer, chatInput, chatSendButton, chatMessages;

const crossFadeControls = [];

let currentBaseAction = 'standby';
const allActions = [];
const baseActions = {
  standby: { weight: 1 },
  triste: { weight: 0 },
  feliz: { weight: 0 },
  baile: { weight: 0 }
};
const additiveActions = {
  sneak_pose: { weight: 0 },
  sad_pose: { weight: 0 },
  agree: { weight: 0 },
  headShake: { weight: 0 }
};
let panelSettings, numAnimations;

// Chat API configuration
const CHAT_API_URL = 'https://rollinabox.app.n8n.cloud/webhook/f406671e-c954-4691-b39a-66c90aa2f103/chat';

// Create chat UI
function createChatUI() {
  chatContainer = document.createElement('div');
  chatContainer.style.position = 'fixed';
  chatContainer.style.bottom = '20px';
  chatContainer.style.left = '20px';
  chatContainer.style.width = '300px';
  chatContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  chatContainer.style.borderRadius = '10px';
  chatContainer.style.padding = '10px';
  chatContainer.style.zIndex = '1000';

  chatMessages = document.createElement('div');
  chatMessages.style.height = '200px';
  chatMessages.style.overflowY = 'auto';
  chatMessages.style.marginBottom = '10px';
  chatMessages.style.padding = '5px';
  chatContainer.appendChild(chatMessages);

  const inputContainer = document.createElement('div');
  inputContainer.style.display = 'flex';
  inputContainer.style.gap = '5px';

  chatInput = document.createElement('input');
  chatInput.type = 'text';
  chatInput.placeholder = 'Type your message...';
  chatInput.style.flex = '1';
  chatInput.style.padding = '5px';
  chatInput.style.borderRadius = '5px';
  chatInput.style.border = '1px solid #ccc';

  chatSendButton = document.createElement('button');
  chatSendButton.textContent = 'Send';
  chatSendButton.style.padding = '5px 10px';
  chatSendButton.style.borderRadius = '5px';
  chatSendButton.style.border = 'none';
  chatSendButton.style.backgroundColor = '#4CAF50';
  chatSendButton.style.color = 'white';
  chatSendButton.style.cursor = 'pointer';

  inputContainer.appendChild(chatInput);
  inputContainer.appendChild(chatSendButton);
  chatContainer.appendChild(inputContainer);

  document.body.appendChild(chatContainer);

  // Add event listeners
  chatSendButton.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
}

// Send message to chatbot
async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  // Add user message to chat
  addMessageToChat('You: ' + message, 'user');
  chatInput.value = '';

  // Add message to conversation history
  conversationHistory.push({ role: 'user', content: message });
  
  // Update stored conversation history
  sessionStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));

  try {
    console.log('Sending message to chatbot:', message);
    console.log('Session ID:', sessionId);
    console.log('Conversation history:', conversationHistory);
    
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        metadata: {
          sessionId: sessionId
        }
      }),
    });

    console.log('Raw API Response:', response);
    const data = await response.json();
    console.log('Parsed API Response:', data);
    console.log('Dialog:', data.dialog);
    console.log('Sentiment ID:', data.sentiment);
    
    // Add bot response to chat using the dialog field
    if (data.dialog) {
      addMessageToChat('Bot: ' + data.dialog, 'bot');
      // Add bot response to conversation history
      conversationHistory.push({ role: 'assistant', content: data.dialog });
      // Update stored conversation history
      sessionStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
    } else {
      console.error('No dialog field in response:', data);
      addMessageToChat('Error: Invalid response format from bot', 'error');
    }
    
    // Handle animation based on sentiment ID
    if (data.sentiment !== undefined) {
      console.log('Triggering animation for sentiment ID:', data.sentiment);
      handleSentimentAnimation(data.sentiment);
    } else {
      console.error('No sentiment field in response:', data);
      handleSentimentAnimation(0); // Default to neutral
    }
  } catch (error) {
    console.error('Error in API call:', error);
    addMessageToChat('Error: Failed to get response from bot', 'error');
  }
}

// Add message to chat display
function addMessageToChat(message, type) {
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messageElement.style.margin = '5px 0';
  messageElement.style.padding = '5px';
  messageElement.style.borderRadius = '5px';
  
  switch(type) {
    case 'user':
      messageElement.style.backgroundColor = '#e3f2fd';
      messageElement.style.marginLeft = '20px';
      break;
    case 'bot':
      messageElement.style.backgroundColor = '#f5f5f5';
      messageElement.style.marginRight = '20px';
      break;
    case 'error':
      messageElement.style.backgroundColor = '#ffebee';
      messageElement.style.color = '#c62828';
      break;
  }
  
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle sentiment-based animation
function handleSentimentAnimation(sentimentId) {
  let targetAction = 'standby'; // default for neutral (0)
  
  // Map sentiment ID to animation
  switch(sentimentId) {
    case 1: // sad
      targetAction = 'triste';
      break;
    case 2: // happy
      targetAction = 'feliz';
      break;
    default: // 0 or any other value
      targetAction = 'standby';
  }

  // Crossfade to the target animation
  const currentSettings = baseActions[currentBaseAction];
  const currentAction = currentSettings ? currentSettings.action : null;
  const targetSettings = baseActions[targetAction];
  const targetActionObj = targetSettings ? targetSettings.action : null;

  if (currentAction !== targetActionObj) {
    prepareCrossFade(currentAction, targetActionObj, 0.35);
  }
}

init();

function init() {
  createChatUI();

  const container = document.getElementById( 'container' );
  clock = new THREE.Clock();

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xcccccc );
  scene.fog = new THREE.Fog( 0xcccccc, 10, 50 );

  const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xa7ebfc, 3 );
  hemiLight.position.set( 0, 20, 0 );
  scene.add( hemiLight );


  const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
  dirLight.position.set( 3, 6, 4 );
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 2;
  dirLight.shadow.camera.bottom = - 2;
  dirLight.shadow.camera.left = - 2;
  dirLight.shadow.camera.right = 2;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 40;
  scene.add( dirLight );

  const dirLight2 = new THREE.DirectionalLight( 0xff99dd, 1 );
  dirLight2.position.set( -2, 1, 0 );

  scene.add( dirLight2 );

    // ground

  const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0xcbcbcb, depthWrite: false } ) );
  mesh.rotation.x = - Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add( mesh );

  const loader = new GLTFLoader();
  loader.load( 'personaje.glb', function ( gltf ) {

    model = gltf.scene;
    scene.add( model );

    model.traverse( function ( object ) {

      if ( object.isMesh ) object.castShadow = true;

    } );

    skeleton = new THREE.SkeletonHelper( model );
    skeleton.visible = false;
    scene.add( skeleton );

    const animations = gltf.animations;
    mixer = new THREE.AnimationMixer( model );

    numAnimations = animations.length;

    for ( let i = 0; i !== numAnimations; ++ i ) {

      let clip = animations[ i ];
      const name = clip.name;

      if ( baseActions[ name ] ) {

        const action = mixer.clipAction( clip );
        activateAction( action );
        baseActions[ name ].action = action;
        allActions.push( action );

      } else if ( additiveActions[ name ] ) {

          // Make the clip additive and remove the reference frame

        THREE.AnimationUtils.makeClipAdditive( clip );

        if ( clip.name.endsWith( '_pose' ) ) {

          clip = THREE.AnimationUtils.subclip( clip, clip.name, 2, 3, 30 );

        }

        const action = mixer.clipAction( clip );
        activateAction( action );
        additiveActions[ name ].action = action;
        allActions.push( action );

      }

    }

    createPanel();

    renderer.setAnimationLoop( animate );

  } );

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMap.enabled = true;
  container.appendChild( renderer.domElement );

    // camera
  camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 100 );
  camera.position.set( - 1, 1, 4 );

  const controls = new OrbitControls( camera, renderer.domElement );
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.target.set( 0, 1, 0 );
  controls.update();

  window.addEventListener( 'resize', onWindowResize );

}

function createPanel() {

  const panel = new GUI( { width: 70 } );

  const folder1 = panel.addFolder( 'Anim' );
  panelSettings = {
    'modify time scale': 1.0
  };

  const baseNames = [ 'None', ...Object.keys( baseActions ) ];

  for ( let i = 0, l = baseNames.length; i !== l; ++ i ) {

    const name = baseNames[ i ];
    const settings = baseActions[ name ];
    panelSettings[ name ] = function () {

      const currentSettings = baseActions[ currentBaseAction ];
      const currentAction = currentSettings ? currentSettings.action : null;
      const action = settings ? settings.action : null;

      if ( currentAction !== action ) {

        prepareCrossFade( currentAction, action, 0.35 );

      }

    };

    crossFadeControls.push( folder1.add( panelSettings, name ) );

  }

  folder1.open();

  crossFadeControls.forEach( function ( control ) {

    control.setInactive = function () {

      control.domElement.classList.add( 'control-inactive' );

    };

    control.setActive = function () {

      control.domElement.classList.remove( 'control-inactive' );

    };

    const settings = baseActions[ control.property ];

    if ( ! settings || ! settings.weight ) {

      control.setInactive();

    }

  } );

}

function activateAction( action ) {

  const clip = action.getClip();
  const settings = baseActions[ clip.name ] || additiveActions[ clip.name ];
  setWeight( action, settings.weight );
  action.play();

}

function modifyTimeScale( speed ) {

  mixer.timeScale = speed;

}

function prepareCrossFade( startAction, endAction, duration ) {

    // If the current action is 'standby', execute the crossfade immediately;
    // else wait until the current action has finished its current loop


    executeCrossFade( startAction, endAction, duration );


    // Update control colors

  if ( endAction ) {

    const clip = endAction.getClip();
    currentBaseAction = clip.name;

  } else {

    currentBaseAction = 'None';

  }

  crossFadeControls.forEach( function ( control ) {

    const name = control.property;

    if ( name === currentBaseAction ) {

      control.setActive();

    } else {

      control.setInactive();

    }

  } );

}

function synchronizeCrossFade( startAction, endAction, duration ) {

  mixer.addEventListener( 'loop', onLoopFinished );

  function onLoopFinished( event ) {

    if ( event.action === startAction ) {

      mixer.removeEventListener( 'loop', onLoopFinished );

      executeCrossFade( startAction, endAction, duration );

    }

  }

}

function executeCrossFade( startAction, endAction, duration ) {

    // Not only the start action, but also the end action must get a weight of 1 before fading
    // (concerning the start action this is already guaranteed in this place)

  if ( endAction ) {

    setWeight( endAction, 1 );
    endAction.time = 0;

    if ( startAction ) {

        // Crossfade with warping

      startAction.crossFadeTo( endAction, duration, true );

    } else {

        // Fade in

      endAction.fadeIn( duration );

    }

  } else {

      // Fade out

    startAction.fadeOut( duration );

  }

}

  // This function is needed, since animationAction.crossFadeTo() disables its start action and sets
  // the start action's timeScale to ((start animation's duration) / (end animation's duration))

function setWeight( action, weight ) {

  action.enabled = true;
  action.setEffectiveTimeScale( 1 );
  action.setEffectiveWeight( weight );

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    // Render loop

  for ( let i = 0; i !== numAnimations; ++ i ) {

    const action = allActions[ i ];
    const clip = action.getClip();
    const settings = baseActions[ clip.name ] || additiveActions[ clip.name ];
    settings.weight = action.getEffectiveWeight();

  }

    // Get the time elapsed since the last frame, used for mixer update

  const mixerUpdateDelta = clock.getDelta();

    // Update the animation mixer, the stats panel, and render this frame

  mixer.update( mixerUpdateDelta );

  renderer.render( scene, camera );

}
