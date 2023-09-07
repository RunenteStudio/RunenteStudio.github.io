import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

function Boid({ position, velocity }) {
    const boidRef = useRef();
  
    // Update the position of the boid based on its velocity
    useFrame(() => {
      boidRef.current.position.add(velocity);
    });
  
    return (
      <Sphere ref={boidRef} args={[1, 32, 32]} position={position} />
    );
  }
  
  function Flock1() {
    const flockSize = 50;
  
    // Initialize the flock positions and velocities
    const flock = Array.from({ length: flockSize }).map(() => ({
      position: new THREE.Vector3(
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5
      ),
      velocity: new THREE.Vector3(
        Math.random() * 0.1 - 0.05,
        Math.random() * 0.1 - 0.05,
        Math.random() * 0.1 - 0.05
      ),
    }));
  
    return (
      <Canvas>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
  
        {flock.map((boid, index) => (
          <Boid key={index} position={boid.position} velocity={boid.velocity} />
        ))}
      </Canvas>
    );
  }
  
  export default Flock1;