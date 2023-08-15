import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Boid = ({ position }) => {
    const boidRef = useRef();
    const [velocity, setVelocity] = useState(
      new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
    );
    const maxforce = 0.03;
    const maxspeed = 2;

  const flock = (boids) => {
    const sep = separate(boids);
    const ali = align(boids);
    const coh = cohesion(boids);

    sep.multiplyScalar(1.5);
    ali.multiplyScalar(1.0);
    coh.multiplyScalar(1.0);

    acceleration.add(sep);
    acceleration.add(ali);
    acceleration.add(coh);
  };

  const update = () => {
    const newVelocity = velocity.clone();
    flock([]);
    newVelocity.add(new THREE.Vector3().copy(velocity).clampLength(0, maxspeed));
    setVelocity(newVelocity);

    const newPosition = position.clone();
    newPosition.add(newVelocity);

    borders(newPosition);
    boidRef.current.position.copy(newPosition);
  };

  const borders = (newPosition) => {
    const boundingBox = 100;
    if (newPosition.x < -boundingBox) newPosition.x = boundingBox;
    if (newPosition.y < -boundingBox) newPosition.y = boundingBox;
    if (newPosition.z < -boundingBox) newPosition.z = boundingBox;
    if (newPosition.x > boundingBox) newPosition.x = -boundingBox;
    if (newPosition.y > boundingBox) newPosition.y = -boundingBox;
    if (newPosition.z > boundingBox) newPosition.z = -boundingBox;
  };

  useFrame(() => update());

  return (
    <mesh ref={boidRef} position={position}>
      <coneBufferGeometry args={[4, 8, 3]} />
      <meshBasicMaterial color="blue" />
    </mesh>
  );
};

export default Boid;