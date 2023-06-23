import React from 'react';


const Fish = ({ position }) => {


  return (
    <mesh position={position}>
      <sphereGeometry scale={100} />
      <meshStandardMaterial color="hotpink" transparent />
    </mesh>
  );
};

export default Fish;
