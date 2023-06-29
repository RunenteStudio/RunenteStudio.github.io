import React, { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber'
import Fish from './Fish';

import { gsap } from 'gsap'

import { MeshBasicMaterial, MeshStandardMaterial } from 'three';

const Flock = ({ bounds, scale }) => {
  const [fishes, setFishes] = useState([]);
  const fishRefs = useRef([]);
  
  const [divisionIndex, setDivisionIndex] = useState(0);
  const material1 = new MeshBasicMaterial({ color: 'red' }); // Customize the material properties as needed
  const material2 = new MeshStandardMaterial({ color: 'blue' }); // Customize the material properties as needed

  // Create initial fish positions
  useEffect(() => {
    const initialFishes = [];
    for (let i = 0; i < 50; i++) {
      initialFishes.push({
        position: [
          bounds.x.min + Math.random() * (bounds.x.max - bounds.x.min),
          bounds.y.min + Math.random() * (bounds.y.max - bounds.y.min),
          bounds.z.min + Math.random() * (bounds.z.max - bounds.z.min),
        ],
        velocity: [
          (Math.random() * 2 - 1) * 0.1,  // Decrease the velocity values to reduce speed
          (Math.random() * 2 - 1) * 0.1,
          (Math.random() * 2 - 1) * 0.1,
        ],
      });
    }
    setFishes(initialFishes);

    const divisionIndex = Math.floor(initialFishes.length / 2);
    setDivisionIndex(divisionIndex);
  }, [bounds]);

  // Update fish positions and velocities
  useFrame(() => {
    setFishes(prevFishes =>
      prevFishes.map(fish => {
        // Update fish position based on velocity
        const newPosition = [
          fish.position[0] + fish.velocity[0],
          fish.position[1] + fish.velocity[1],
          fish.position[2] + fish.velocity[2],
        ];

        // Reflect fish velocity if it reaches the bounds
        const newVelocity = [
          newPosition[0] < bounds.x.min || newPosition[0] > bounds.x.max ? -fish.velocity[0] : fish.velocity[0],
          newPosition[1] < bounds.y.min || newPosition[1] > bounds.y.max ? -fish.velocity[1] : fish.velocity[1],
          newPosition[2] < bounds.z.min || newPosition[2] > bounds.z.max ? -fish.velocity[2] : fish.velocity[2],
        ];

        // Keep fish within bounds
        const boundedPosition = [
          Math.min(Math.max(newPosition[0], bounds.x.min), bounds.x.max),
          Math.min(Math.max(newPosition[1], bounds.y.min), bounds.y.max),
          Math.min(Math.max(newPosition[2], bounds.z.min), bounds.z.max),
        ];

        return { ...fish, position: boundedPosition, velocity: newVelocity };
      })
    );
  
  });



  return (
    <>
      {fishes.map((fish, index) => (  
        
        <Fish key={index} position={fish.position} scale={[scale, scale, scale]}
        ref={ref => (fishRefs.current[index] = ref)}
        material={index < divisionIndex ? material1 : material2} />
      ))}
       
    </>
  );
};

export default Flock;
