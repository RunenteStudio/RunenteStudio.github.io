import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshStandardMaterial } from 'three';

const Fish = ({ position, scale, materialProps }) => {
  const fishRef = useRef();

  useFrame(() => {
    // Add animation or any other logic here
  });

  return (
    <mesh ref={fishRef} position={position} scale={scale}
    castShadow
    receiveShadow>
      <sphereBufferGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial attach="material" {...materialProps} />
    </mesh>
  );
};

export default Fish;

