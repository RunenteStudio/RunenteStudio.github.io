import React, { useState } from 'react';
import { useFrame } from '@react-three/fiber'
import Fish from './Fish'

const Flock = ({ bounds }) => {
  const [fishes, setFishes] = useState([]);

  // Create initial fish positions
  useState(() => {
    const initialFishes = [];
    for (let i = 0; i < 50; i++) {
      initialFishes.push({
        position: [
          bounds.x.min + Math.random() * (bounds.x.max - bounds.x.min),
          bounds.y.min + Math.random() * (bounds.y.max - bounds.y.min),
          bounds.z.min + Math.random() * (bounds.z.max - bounds.z.min),
        ],
        velocity: [Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1],
      });
    }
    setFishes(initialFishes);
  }, [bounds]);

  // Update fish positions and velocities
  useFrame(() => {
    setFishes(prevFishes =>
      prevFishes.map(fish => {
        // Implement flocking behavior here

        // Example: Update fish position based on velocity
        const newPosition = [
          fish.position[0] + fish.velocity[0],
          fish.position[1] + fish.velocity[1],
          fish.position[2] + fish.velocity[2],
        ];

        // Keep fish within bounds
        const boundedPosition = [
          Math.min(Math.max(newPosition[0], bounds.x.min), bounds.x.max),
          Math.min(Math.max(newPosition[1], bounds.y.min), bounds.y.max),
          Math.min(Math.max(newPosition[2], bounds.z.min), bounds.z.max),
        ];

        return { ...fish, position: boundedPosition };
      })
    );
  });

  return (
    <>
      {fishes.map((fish, index) => (
        <Fish key={index} position={fish.position} />
      ))}
    </>
  );
};

export default Flock;