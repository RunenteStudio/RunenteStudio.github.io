import React, { useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshBasicMaterial, MeshStandardMaterial } from 'three';
import Fish from './Fish';

const Flock = ({ bounds, scale, proportion, isMerging, setIsMerging, movementSpeed, flockPosition }) => {
  const [fishes, setFishes] = useState({ redFishes: [], blueFishes: [] });
  const [isLerping, setIsLerping] = useState(true);

  const [time, setTime] = useState(0);

  useEffect(() => {
    const initialFishes = {
      redFishes: [],
      blueFishes: [],
    };

    const material1 = new MeshBasicMaterial({ color: 'red' });
    const material2 = new MeshStandardMaterial({ color: 'blue' });

    const radius = Math.min(
      bounds.x.max - bounds.x.min,
      bounds.y.max - bounds.y.min,
      bounds.z.max - bounds.z.min
    ) * 0.5;

    const center1 = [
      bounds.x.min + (bounds.x.max - bounds.x.min) * 0.25, // Change the center for red fishes
      bounds.y.min + (bounds.y.max - bounds.y.min) * 0.5,
      bounds.z.min + (bounds.z.max - bounds.z.min) * 0.5,
    ];

    const center2 = [
      bounds.x.min + (bounds.x.max - bounds.x.min) * 0.75, // Change the center for blue fishes
      bounds.y.min + (bounds.y.max - bounds.y.min) * 0.5,
      bounds.z.min + (bounds.z.max - bounds.z.min) * 0.5,
    ];

    for (let i = 0; i < 50; i++) {
      const material = i < Math.floor(50 * proportion) ? material1 : material2;

      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;

      const center = i < Math.floor(50 * proportion) ? center1 : center2;

      const x = center[0] + Math.sin(theta) * Math.cos(phi) * radius;
      const y = center[1] + Math.sin(theta) * Math.sin(phi) * radius;
      const z = center[2] + Math.cos(theta) * radius;

      const fish = {
        initialPosition: [x, y, z],
        position: [x, y, z],
        velocity: [
          (Math.random() * 2 - 1) * movementSpeed,
          (Math.random() * 2 - 1) * movementSpeed,
          (Math.random() * 2 - 1) * movementSpeed,
        ],
        materialProps: i < Math.floor(50 * proportion) ? { color: 'red' } : { color: 'blue', roughness: 0.5 },
      };

      if (i < Math.floor(50 * proportion)) {
        initialFishes.redFishes.push(fish);
      } else {
        initialFishes.blueFishes.push(fish);
      }
    }

    setFishes(initialFishes);
  }, [bounds, proportion, movementSpeed]);

  useEffect(() => {
    const mergeTimer = setTimeout(() => {
      setIsMerging(true); // Start the merging process
    }, 5000);

    return () => {
      clearTimeout(mergeTimer);
    };
  }, [setIsMerging]);

  const lerpArray = (startArray, endArray, t) => {
    const lerpedArray = startArray.map((value, index) => {
      return value + (endArray[index] - value) * t;
    });

    return lerpedArray;
  };

  useFrame((_, delta) => {
    setTime((prevTime) => prevTime + delta);
    if (isMerging && isLerping) {
      setFishes((prevFishes) => {
        const combinedFishes = {
          redFishes: [...prevFishes.redFishes, ...prevFishes.blueFishes],
          blueFishes: [],
        };

        const center = [
          bounds.x.min + (bounds.x.max - bounds.x.min) * 0.5, // New center position for the combined flock
          bounds.y.min + (bounds.y.max - bounds.y.min) * 0.5,
          bounds.z.min + (bounds.z.max - bounds.z.min) * 0.5,
        ];

        return {
          redFishes: combinedFishes.redFishes.map((fish) => {
            const newPosition = [
              fish.initialPosition[0] + fish.velocity[0],
              fish.initialPosition[1] + fish.velocity[1],
              fish.initialPosition[2] + fish.velocity[2],
            ];

            const newVelocity = fish.velocity;

            const radius = Math.min(
              bounds.x.max - bounds.x.min,
              bounds.y.max - bounds.y.min,
              bounds.z.max - bounds.z.min
            ) * 0.5;

            const direction = [
              newPosition[0] - center[0],
              newPosition[1] - center[1],
              newPosition[2] - center[2],
            ];

            const magnitude = Math.sqrt(
              direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2
            );

            const normalizedDirection = [
              direction[0] / magnitude,
              direction[1] / magnitude,
              direction[2] / magnitude,
            ];

            const spherePosition = [
              center[0] + normalizedDirection[0] * radius,
              center[1] + normalizedDirection[1] * radius,
              center[2] + normalizedDirection[2] * radius,
            ];

            const newPositionSmooth = lerpArray(fish.position, spherePosition, 0.05);

            return { ...fish, position: newPositionSmooth, velocity: newVelocity };
          }),
          blueFishes: combinedFishes.blueFishes.map((fish) => {
            const newPosition = [
              fish.initialPosition[0] + fish.velocity[0],
              fish.initialPosition[1] + fish.velocity[1],
              fish.initialPosition[2] + fish.velocity[2],
            ];

            const newVelocity = fish.velocity;

            const radius = Math.min(
              bounds.x.max - bounds.x.min,
              bounds.y.max - bounds.y.min,
              bounds.z.max - bounds.z.min
            ) * 0.5;

            const direction = [
              newPosition[0] - center[0],
              newPosition[1] - center[1],
              newPosition[2] - center[2],
            ];

            const magnitude = Math.sqrt(
              direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2
            );

            const normalizedDirection = [
              direction[0] / magnitude,
              direction[1] / magnitude,
              direction[2] / magnitude,
            ];

            const spherePosition = [
              center[0] + normalizedDirection[0] * radius,
              center[1] + normalizedDirection[1] * radius,
              center[2] + normalizedDirection[2] * radius,
            ];

            const newPositionSmooth = lerpArray(fish.position, spherePosition, 0.05);

            return { ...fish, position: newPositionSmooth, velocity: newVelocity };
          }),
        };
      });
      } else if (isMerging && !isLerping) {
        setFishes((prevFishes) => ({
          redFishes: prevFishes.redFishes.map((fish) => {
            const newPosition = [
              fish.position[0] + fish.velocity[0],
              fish.position[1] + fish.velocity[1],
              fish.position[2] + fish.velocity[2],
            ];

            const newVelocity = fish.velocity;

            // Check if the fish has crossed the bounds
            if (
              newPosition[0] < bounds.x.min ||
              newPosition[0] > bounds.x.max ||
              newPosition[1] < bounds.y.min ||
              newPosition[1] > bounds.y.max ||
              newPosition[2] < bounds.z.min ||
              newPosition[2] > bounds.z.max
            ) {
              // Reverse the velocity to change direction
              newVelocity[0] *= -1;
              newVelocity[1] *= -1;
              newVelocity[2] *= -1;
            }

            return { ...fish, position: newPosition, velocity: newVelocity };
          }),
          blueFishes: prevFishes.blueFishes.map((fish) => {
            const newPosition = [
              fish.position[0] + fish.velocity[0],
              fish.position[1] + fish.velocity[1],
              fish.position[2] + fish.velocity[2],
            ];

            const newVelocity = fish.velocity;

            // Check if the fish has crossed the bounds
            if (
              newPosition[0] < bounds.x.min ||
              newPosition[0] > bounds.x.max ||
              newPosition[1] < bounds.y.min ||
              newPosition[1] > bounds.y.max ||
              newPosition[2] < bounds.z.min ||
              newPosition[2] > bounds.z.max
            ) {
              // Reverse the velocity to change direction
              newVelocity[0] *= -1;
              newVelocity[1] *= -1;
              newVelocity[2] *= -1;
            }

            return { ...fish, position: newPosition, velocity: newVelocity };
          }),
        }));
      } else {
        setFishes((prevFishes) => ({
          redFishes: prevFishes.redFishes.map((fish) => {
            const newPosition = [
              fish.position[0] + fish.velocity[0],
              fish.position[1] + fish.velocity[1],
              fish.position[2] + fish.velocity[2],
            ];

            const newVelocity = fish.velocity;

            // Check if the fish has crossed the bounds
            if (
              newPosition[0] < bounds.x.min ||
              newPosition[0] > bounds.x.max ||
              newPosition[1] < bounds.y.min ||
              newPosition[1] > bounds.y.max ||
              newPosition[2] < bounds.z.min ||
              newPosition[2] > bounds.z.max
            ) {
              // Reverse the velocity to change direction
              newVelocity[0] *= -1;
              newVelocity[1] *= -1;
              newVelocity[2] *= -1;
            }

            return { ...fish, position: newPosition, velocity: newVelocity };
          }),
          blueFishes: prevFishes.blueFishes.map((fish) => {
            const newPosition = [
              fish.position[0] + fish.velocity[0],
              fish.position[1] + fish.velocity[1],
              fish.position[2] + fish.velocity[2],
            ];

            const newVelocity = fish.velocity;

            // Check if the fish has crossed the bounds
            if (
              newPosition[0] < bounds.x.min ||
              newPosition[0] > bounds.x.max ||
              newPosition[1] < bounds.y.min ||
              newPosition[1] > bounds.y.max ||
              newPosition[2] < bounds.z.min ||
              newPosition[2] > bounds.z.max
            ) {
              // Reverse the velocity to change direction
              newVelocity[0] *= -1;
              newVelocity[1] *= -1;
              newVelocity[2] *= -1;
            }

            return { ...fish, position: newPosition, velocity: newVelocity };
          }),
        }));
      }
    });

  return (
    <>
      {fishes.redFishes.map((fish, index) => (
        <Fish
          key={`red-${index}`}
          position={[
            fish.position[0] + flockPosition[0],
            fish.position[1] + flockPosition[1],
            fish.position[2] + flockPosition[2]
          ]}
          scale={[scale, scale, scale]}
          materialProps={fish.materialProps}
        />
      ))}
      {fishes.blueFishes.map((fish, index) => (
        <Fish
          key={`blue-${index}`}
          position={[
            fish.position[0] + flockPosition[0],
            fish.position[1] + flockPosition[1],
            fish.position[2] + flockPosition[2]
          ]}
          scale={[scale, scale, scale]}
          materialProps={fish.materialProps}
        />
      ))}
    </>
  );
};

export default Flock;