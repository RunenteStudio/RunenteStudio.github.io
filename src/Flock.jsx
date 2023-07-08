import React, { useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshBasicMaterial, MeshStandardMaterial } from 'three';
import Fish from './Fish';

const Flock = ({ bounds, scale, proportion }) => {
  const [fishes, setFishes] = useState([]);

  useEffect(() => {
    const initialFishes = [];
    const material1 = new MeshBasicMaterial({ color: 'red' });
    const material2 = new MeshStandardMaterial({ color: 'blue' });

    const radius = Math.min(
      bounds.x.max - bounds.x.min,
      bounds.y.max - bounds.y.min,
      bounds.z.max - bounds.z.min
    ) * 0.5; // Calculate the radius based on the smallest dimension

    const center = [
      bounds.x.min + (bounds.x.max - bounds.x.min) * 0.5,
      bounds.y.min + (bounds.y.max - bounds.y.min) * 0.5,
      bounds.z.min + (bounds.z.max - bounds.z.min) * 0.5,
    ]; // Calculate the center of the bounding box

    for (let i = 0; i < 50; i++) {
      const material = i < Math.floor(50 * proportion) ? material1 : material2;

      const phi = Math.random() * Math.PI * 2; // Random azimuthal angle
      const theta = Math.random() * Math.PI; // Random polar angle

      const x = center[0] + Math.sin(theta) * Math.cos(phi) * radius;
      const y = center[1] + Math.sin(theta) * Math.sin(phi) * radius;
      const z = center[2] + Math.cos(theta) * radius;

      initialFishes.push({
        position: [x, y, z],
        velocity: [
          (Math.random() * 2 - 1) * 0.1,
          (Math.random() * 2 - 1) * 0.1,
          (Math.random() * 2 - 1) * 0.1,
        ],
        materialProps: i < Math.floor(50 * proportion) ? { color: 'red' } : { color: 'blue', roughness: 0.5 },
      });
    }
    setFishes(initialFishes);
  }, [bounds, proportion]);

  useFrame(() => {
    setFishes((prevFishes) =>
      prevFishes.map((fish) => {
        const newPosition = [
          fish.position[0] + fish.velocity[0],
          fish.position[1] + fish.velocity[1],
          fish.position[2] + fish.velocity[2],
        ];

        const newVelocity = [
          newPosition[0] < bounds.x.min || newPosition[0] > bounds.x.max ? -fish.velocity[0] : fish.velocity[0],
          newPosition[1] < bounds.y.min || newPosition[1] > bounds.y.max ? -fish.velocity[1] : fish.velocity[1],
          newPosition[2] < bounds.z.min || newPosition[2] > bounds.z.max ? -fish.velocity[2] : fish.velocity[2],
        ];

        const boundedPosition = [
          Math.min(Math.max(newPosition[0], bounds.x.min), bounds.x.max),
          Math.min(Math.max(newPosition[1], bounds.y.min), bounds.y.max),
          Math.min(Math.max(newPosition[2], bounds.z.min), bounds.z.max),
        ];

        const radius = Math.min(
          bounds.x.max - bounds.x.min,
          bounds.y.max - bounds.y.min,
          bounds.z.max - bounds.z.min
        ) * 0.5; // Calculate the radius based on the smallest dimension

        const center = [
          bounds.x.min + (bounds.x.max - bounds.x.min) * 0.5,
          bounds.y.min + (bounds.y.max - bounds.y.min) * 0.5,
          bounds.z.min + (bounds.z.max - bounds.z.min) * 0.5,
        ]; // Calculate the center of the bounding box

        const direction = [
          boundedPosition[0] - center[0],
          boundedPosition[1] - center[1],
          boundedPosition[2] - center[2],
        ]; // Calculate the direction from the center to the position

        const magnitude = Math.sqrt(
          direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2
        ); // Calculate the magnitude of the direction vector

        const normalizedDirection = [
          direction[0] / magnitude,
          direction[1] / magnitude,
          direction[2] / magnitude,
        ]; // Normalize the direction vector

        const spherePosition = [
          center[0] + normalizedDirection[0] * radius,
          center[1] + normalizedDirection[1] * radius,
          center[2] + normalizedDirection[2] * radius,
        ]; // Calculate the position on the surface of the sphere

        return { ...fish, position: spherePosition, velocity: newVelocity };
      })
    );
  });

  return (
    <>
      {fishes.map((fish, index) => (
        <Fish
          key={index}
          position={fish.position}
          scale={[scale, scale, scale]}
          materialProps={fish.materialProps}
        />
      ))}
    </>
  );
};

export default Flock;
