/*
  Auto-generated by Spline
*/

import React, { useState, useEffect, useRef, useContext } from 'react'
import useSpline from '@splinetool/r3f-spline'
import { PerspectiveCamera, OrbitControls } from '@react-three/drei'
import { useThree, useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'

import * as dat from 'dat.gui'
import Cubes from './Cubes'
import { MeshContext } from './MeshContext'
import { Object3D } from 'three'
import { SetPercentageText, setText1 } from './Overlay'


export default function Scene({ ...props }) {
  const { nodes, materials } = useSpline('https://prod.spline.design/deTFkjUwoAmpZq-j/scene.splinecode')
  const { camera, scene } = useThree()

  const yellowRef = useRef();
  const orangeRef = useRef();
  const transparentRef = useRef();
  const magentaRef = useRef();


  const [active, setActive] = useState(false)
  const [hover, setHover] = useState(false)
  

  //console.log(camera.rotation)

  useEffect(() => {
    const gui = new dat.GUI({ width: 400})
    const debugObject = {
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
    }

    gui.add(debugObject.position, 'x')
  }, []);

  useFrame(() => {
    if (hover) {
      //yellowRef.current.rotation.y += 0.05;
      //console.log(camera.position)
      
    }

  })

  const ALIGNMENT = 1000;
  const SEPARATION = 300;
  const FLOCK_SIZE = 300;
  const WIDTH = 400;

  //INSTANCED TORUS

  const dummy = new Object3D();
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
    
  })


  // INST

  


  return (
    <>
      <instancedMesh ref={meshRef} args={[null, null, 1000]} position={[-10, 400, 200]} scale={0}
          castShadow
          receiveShadow>
        <torusGeometry args={[5.5, 0.1, 32, 32]}></torusGeometry>
        <meshPhongMaterial color="tomato" />
      </instancedMesh>
      <color attach="background" args={['#dae7fe']} />
      <group {...props} dispose={null}>
        <group name="Magenta" position={[-38.64, 152.76, -94.49]}>
          <mesh
            name="Cube 10"
            ref={magentaRef}
            geometry={nodes['Cube 10'].geometry}
            material={materials.mtl_magenta}
            castShadow
            receiveShadow
            position={[0.9, 0.11, 0.65]}
            rotation={[-1.66, 0, -0.21]}
            scale={0.82}
            onClick={() => {
              
              setActive(!active);
              console.log("amarillo clickeado")
              gsap.to(magentaRef.current.position,  {
                x: () => 0,
                y: () => 100.86,
                z: () => 250,
                duration: 1.0
              })
              gsap.to(meshRef.current.scale,  {
                x: () => 4,
                y: () => 4,
                z: () => 4,
                duration: 1.0
              })    
              gsap.to(meshRef.current.position,  {
                x: () => -10,
                y: () => 200,
                z: () => 200,
                duration: 1.0
              })   
            }}
            onPointerOver={() => {
              setHover(true);
              SetPercentageText('100');
              gsap.fromTo("#slr", {autoAlpha: 0}, {autoAlpha: 1.0, duration: 1});
              gsap.to(magentaRef.current.rotation,  {
                x: () => 180,
                duration: 100.0,
                repeat: -1,
              })
            }}
            onPointerOut={() => {
              setHover(false);
              gsap.killTweensOf(magentaRef.current.rotation)
            }}
          />
        </group>
        <group name="transparente" position={[-19.69, 148.43, -78.76]}>
          <mesh
            name="Cube 8"
            ref={transparentRef}
            geometry={nodes['Cube 8'].geometry}
            material={materials['Cube 8 Material']}
            castShadow
            receiveShadow
            position={[-0.23, 2.3, -4.48]}
            rotation={[-1.66, 0, -0.21]}
            scale={0.82}
            onClick={() => {
              setActive(!active);
              console.log("amarillo clickeado")
              gsap.to(transparentRef.current.position,  {
                x: () => 0,
                y: () => 100.86,
                z: () => 250,
                duration: 1.0
              })
            }}
            onPointerOver={() => {
              setHover(true);
              SetPercentageText('75')
              gsap.fromTo("#slr", {autoAlpha: 0}, {autoAlpha: 1.0, duration: 1});
              gsap.to(transparentRef.current.rotation,  {
                x: () => 180,
                duration: 100.0,
                repeat: -1,
              })
            }}
            onPointerOut={() => {
              setHover(false);
              gsap.killTweensOf(transparentRef.current.rotation)
            }}
          />
        </group>
        <group name="amarillo" position={[0, 151.54, -82.91]}>
          <mesh
            ref={yellowRef}
            name="Cube 9"
            geometry={nodes['Cube 9'].geometry}
            material={materials.mtl_amarillo}
            castShadow
            receiveShadow
            position={[0.87, 1.25, -1.2]}
            rotation={[-1.66, 0, 0.44]}
            scale={0.82}
            onClick={() => {
              setActive(!active);
              gsap.to(yellowRef.current.position,  {
                x: () => 0,
                y: () => 100.86,
                z: () => 250,
                duration: 1.0
              })
            }}
            onPointerOver={() => {
              setHover(true);
              SetPercentageText('50')
              gsap.fromTo("#slr", {autoAlpha: 0}, {autoAlpha: 1.0, duration: 1});
              gsap.to(yellowRef.current.rotation,  {
                x: () => 180,
                duration: 100.0,
                repeat: -1,
              })
              
            }}
            onPointerOut={() => {
              setHover(false); 
              gsap.killTweensOf(yellowRef.current.rotation)
            }}
          />
        </group>
        <group name="naranja" position={[21.64, 150.19, -90.29]}>
          <mesh
            ref={orangeRef}
            name="Cube 7"
            geometry={nodes['Cube 7'].geometry}
            material={materials.mtl_naranja}
            castShadow
            receiveShadow
            position={[-1.79, 2.66, -3.7]}
            rotation={[-1.66, 0, -0.21]}
            scale={0.82}
            onClick={() => {
              setActive(!active);
              console.log("amarillo clickeado")
              gsap.to(orangeRef.current.position,  {
                x: () => 0,
                y: () => 100.86,
                z: () => 250,
                duration: 1.0
              })
            }}
            onPointerOver={() => {
              setHover(true);
              SetPercentageText('25')
              gsap.fromTo("#slr", {autoAlpha: 0}, {autoAlpha: 1.0, duration: 1});
              gsap.to(orangeRef.current.rotation,  {
                x: () => 180,
                duration: 100.0,
                repeat: -1,
              })
            }}
            onPointerOut={() => {
              setHover(false);
              gsap.killTweensOf(orangeRef.current.rotation)
            }}
          />
        </group>
        <PerspectiveCamera
          name="Camera"
          makeDefault={true}
          far={100000}
          near={70}
          fov={45}
          position={[-7.88, 167.31, -244.27]}
          rotation={[3.08, 1, -3.14]}
          scale={1}
        />
        <mesh
          name="Ellipse 3"
          geometry={nodes['Ellipse 3'].geometry}
          material={materials['Ellipse 3 Material']}
          visible={false}
          castShadow
          receiveShadow
          position={[-9.75, 128.6, -139.59]}
          rotation={[-1.66, 0, 0]}
          scale={0.82}
        />
        <mesh
          name="Ellipse 2"
          geometry={nodes['Ellipse 2'].geometry}
          material={materials['Ellipse 2 Material']}
          castShadow
          receiveShadow
          position={[-9.2, 74.26, -134.24]}
          rotation={[-1.67, 0, 0]}
          scale={0.48}
        />
        <group name="Instances" position={[-6.64, 209.29, 15.5]} rotation={[-0.4, 0.25, -1.57]} scale={0}>
          <mesh
            name="Cube 81"
            geometry={nodes['Cube 81'].geometry}
            material={materials['Cube 81 Material']}
            visible={true}
            castShadow
            receiveShadow
            position={[51.01, 0.73, 0.72]}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="Cube 71"
            geometry={nodes['Cube 71'].geometry}
            material={materials.mtl_magenta}
            visible={true}
            castShadow
            receiveShadow
            position={[16.47, 0.73, 0.72]}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="Cube 6"
            geometry={nodes['Cube 6'].geometry}
            material={materials.mtl_amarillo}
            visible={true}
            castShadow
            receiveShadow
            position={[19.37, 0.73, 0.72]}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          />
          <mesh
            name="Cube 5"
            geometry={nodes['Cube 5'].geometry}
            material={materials.mtl_naranja}
            visible={true}
            castShadow
            receiveShadow
            position={[-10.14, 1.42, 0.72]}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          />
        </group>
        <mesh
          name="Boolean"
          geometry={nodes.Boolean.geometry}
          material={nodes.Boolean.material}
          castShadow
          receiveShadow
          position={[-9.2, 352.72, 190.11]}
          scale={0.58}
        />
        <mesh
          name="Ellipse"
          geometry={nodes.Ellipse.geometry}
          material={materials['Ellipse Material']}
          castShadow
          receiveShadow
          position={[-9.2, 303.69, 167.82]}
          rotation={[-1.28, 0, 0]}
          scale={0.58}
        />
        <mesh
          name="Cube 4"
          geometry={nodes['Cube 4'].geometry}
          material={materials.mtl_gray}
          castShadow
          receiveShadow
          position={[-251.97, 224, 229.96]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.58, 0.76, 0.58]}
        />
        <mesh
          name="Cube 3"
          geometry={nodes['Cube 3'].geometry}
          material={materials.mtl_gray}
          castShadow
          receiveShadow
          position={[222.95, 224, 229.96]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.58, 0.76, 0.58]}
        />
        <mesh
          name="Cube 2"
          geometry={nodes['Cube 2'].geometry}
          material={materials.mtl_gray}
          castShadow
          receiveShadow
          position={[90.88, 224, 246.1]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.75, 0.58, 0.58]}
        />
        <mesh
          name="Cube 61"
          geometry={nodes['Cube 61'].geometry}
          material={materials.mtl_gray}
          castShadow
          receiveShadow
          position={[42.06, 219.88, 429.74]}
          rotation={[-1.37, 0.02, -0.89]}
          scale={[0.64, 0.7, 0.58]}
        />
        <mesh
          name="Cube 51"
          geometry={nodes['Cube 51'].geometry}
          material={materials.mtl_gray}
          castShadow
          receiveShadow
          position={[-68.39, 219.88, 434.79]}
          rotation={[-1.37, -0.02, 0.9]}
          scale={[0.64, 0.7, 0.58]}
        />
        <mesh
          name="Cube"
          geometry={nodes.Cube.geometry}
          material={materials.mtl_gray}
          castShadow
          receiveShadow
          position={[-111.87, 224, 246.1]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.75, 0.58, 0.58]}
        />
        <directionalLight
          name="Directional Light 2"
          castShadow
          intensity={0.53}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={-10000}
          shadow-camera-far={100000}
          shadow-camera-left={-500}
          shadow-camera-right={500}
          shadow-camera-top={500}
          shadow-camera-bottom={-500}
          position={[-47.84, 385.53, -833]}
          rotation={[-Math.PI, 0, -Math.PI]}
          scale={[0.58, 0.58, 799.47]}
        />
        <directionalLight
          name="Directional Light"
          castShadow
          intensity={1.64}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={-10000}
          shadow-camera-far={100000}
          shadow-camera-left={-500}
          shadow-camera-right={500}
          shadow-camera-top={500}
          shadow-camera-bottom={-500}
          position={[-0.84, 385.53, 31]}
          rotation={[-Math.PI, 0, -Math.PI]}
          scale={[0.58, 0.58, 799.47]}
        />
        <mesh
          name="Rectangle 3"
          geometry={nodes['Rectangle 3'].geometry}
          material={materials.mtl_gray}
          castShadow
          receiveShadow
          position={[-184.28, 164.82, 572.37]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.58, 0.76, 0.58]}
        />
        <mesh
          name="Rectangle 2"
          geometry={nodes['Rectangle 2'].geometry}
          material={materials.mtl_gray}
          castShadow
          receiveShadow
          position={[158.07, 164.82, 572.37]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.58, 0.76, 0.58]}
        />
        <mesh
          name="Rectangle"
          geometry={nodes.Rectangle.geometry}
          material={materials['Rectangle Material']}
          castShadow
          receiveShadow
          position={[-5.83, 100.88, 231.09]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.58, 0.76, 0.58]}
        />
        <hemisphereLight name="Default Ambient Light" intensity={0.75} color="#eaeaea" />
      </group>
    </>
  )
}
