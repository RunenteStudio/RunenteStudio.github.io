import React, { useRef } from 'react';

import { gsap } from 'gsap'



const Fish = ({ position, scale, material  }) => {
  const fishRef = useRef();


  return (
    <mesh ref={fishRef} position={position} scale={scale} 
    castShadow
    receiveShadow>
      <sphereBufferGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial attach="material" {...material} />
    </mesh>
  );
};

export default Fish;

