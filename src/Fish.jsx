import React from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, SphereBufferGeometry } from 'three';

const Fish = ({ position, scale, materialProps }) => {
  const ref = React.useRef();

  useFrame(() => {
    if (ref.current) {
      ref.current.position.set(...position);
    }
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <sphereBufferGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
};

export default Fish;
