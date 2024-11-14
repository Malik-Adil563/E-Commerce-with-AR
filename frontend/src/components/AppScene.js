import React, { useEffect, Suspense } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

const Model = () => {
  const gltf = useLoader(GLTFLoader, '/3DModels/mercedes.glb'); // Ensure your 3D model path is correct
  return <primitive object={gltf.scene} scale={new THREE.Vector3(1, 1, 1)} position={[0, 0, -2]} />;
};

const ARScene = () => {
  const { gl } = useThree(); // `useThree` provides access to the WebGL renderer, scene, and camera

  useEffect(() => {
    gl.xr.enabled = true;
    document.body.appendChild(ARButton.createButton(gl, { optionalFeatures: ['local-floor'] }));
  }, [gl]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <Model />
    </>
  );
};

const AppScene = () => {
  return (
    <Canvas camera={{ position: [0, 1.6, 0] }}>
      <Suspense fallback={<div>Loading AR Scene...</div>}>
        <ARScene />
      </Suspense>
    </Canvas>
  );
};

export default AppScene;
