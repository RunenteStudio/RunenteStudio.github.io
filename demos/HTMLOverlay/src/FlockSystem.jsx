import React, { useRef } from 'react';
import Boid from './Boid'; // Assuming you've already created the Boid component

const FlockSystem = ({ numberOfBoids }) => {
  const flockRef = useRef();

  const createRandomBoidPosition = () => ({
    x: Math.random() * 200 - 100,
    y: Math.random() * 200 - 100,
    z: Math.random() * 200 - 100,
  });

  return (
    <group ref={flockRef}>
      {Array.from({ length: numberOfBoids }).map((_, index) => (
        <Boid key={index} position={createRandomBoidPosition()} />
      ))}
    </group>
  );
};

export default FlockSystem;
