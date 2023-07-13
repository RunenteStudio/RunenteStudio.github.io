import { Suspense, useRef } from 'react'
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber'
import { Instance, OrbitControls, useProgress } from '@react-three/drei'
import Scene from './Scene'
import Flock from './Flock'
import Flock1 from './Flock1'

import Cubes from './Cubes';
import { Overlay } from './Overlay'


export default function App() {
  const target = useRef();
  const { active, loaded, total } = useProgress();
  const isLoaded = !active && total > 0 && loaded === total;



  return (
    
    <Suspense fallback={null}>
      <Canvas camera={{ fov: 45, position: [-7.88, 267.31, -234.27], rotation: [0.08, 1, -3.14] }} shadows flat linear>
        <Scene />
        <OrbitControls target={[-10, 200, 0]} 
          minAzimuthAngle={Math.PI / 1.05}
          maxAzimuthAngle={-Math.PI / 1.05}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI - Math.PI / 2.1}
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
        {/*<Flock count={100} startPosition={[0, 151.54, -82.91]}/>*/}
        
      </Canvas>
      {isLoaded && <Overlay />}
      
    </Suspense>
  )
}
