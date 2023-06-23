import { Object3D } from 'three'
import { useRef, useContext } from 'react'
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber'
import { Instance } from '@react-three/drei'
import { MeshContext } from './MeshContext'

const dummy = new Object3D();


const Cubes = ({scale}) => {
    const meshRef = useRef();
    
  
    useFrame(({ clock }) => {
      const time = clock.getElapsedTime();
      meshRef.current.rotation.x = Math.sin(time / 4);
      meshRef.current.rotation.y = Math.sin(time / 2);
      let i = 0;
      const amount = 10;
      const offset = (amount - 1) / 2;
  
      for (let x = 0; x < amount; x++) {
        for (let y = 0; y < amount; y++) {
          for (let z = 0; z < amount; z++) {
            dummy.position.set(offset - x, offset - y, offset - z);
            dummy.rotation.y =
              Math.sin(x / 2 + time) +
              Math.sin(y / 3 + time) +
              Math.sin(z / 4 + time);
            dummy.rotation.z = dummy.rotation.y * 2;
  
            dummy.updateMatrix();
  
            meshRef.current.setMatrixAt(i++, dummy.matrix);
          }
          meshRef.current.instanceMatrix.needsUpdate = true;
        }
      }
      
    });
  
    return (
      <instancedMesh ref={meshRef} args={[null, null, 1000]} position={[-10, 200, 200]} scale={scale}
          castShadow
          receiveShadow>
        <torusGeometry args={[5.5, 0.1, 32, 32]}></torusGeometry>
        <meshPhongMaterial color="tomato" />
      </instancedMesh>
    );
  };

export default Cubes;
  