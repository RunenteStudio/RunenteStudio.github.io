import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { SteeringFlock, Vehicle, RenderComponent } from 'yuka';

const FlockSystem = () => {
  const flockRef = useRef(null);

  useEffect(() => {
    const flock = new SteeringFlock();

    // Add entities to the flock
    for (let i = 0; i < 100; i++) {
      const entity = new Vehicle();
      entity.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
      entity.setRenderComponent(new RenderComponent());
      flock.add(entity);
    }

    flockRef.current = flock;
  }, []);

  useFrame(() => {
    if (flockRef.current) {
      flockRef.current.update();
    }
  });

  return null;
};

export default FlockSystem;

