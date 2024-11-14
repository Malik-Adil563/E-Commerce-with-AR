import React, { useRef, useEffect, Suspense, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const Model = ({ position }) => {
  const gltf = useLoader(GLTFLoader, '/3DModels/mercedes.glb');
  return <primitive object={gltf.scene} position={position} scale={new THREE.Vector3(1, 1, 1)} />;
};

const ARScene = () => {
  const { gl } = useThree();
  const [modelPosition, setModelPosition] = useState(null);
  const [hitTestSource, setHitTestSource] = useState(null);
  const reticle = useRef();

  useEffect(() => {
    // Enable WebXR AR
    gl.xr.enabled = true;
    const arButton = ARButton.createButton(gl, { requiredFeatures: ['hit-test'] });
    document.body.appendChild(arButton);

    arButton.addEventListener('click', async () => {
      try {
        const session = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['hit-test'],
        });
        gl.xr.setSession(session);

        session.addEventListener('end', () => {
          setHitTestSource(null);
          setModelPosition(null);
        });

        const referenceSpace = await session.requestReferenceSpace('viewer');
        const hitTestSource = await session.requestHitTestSource({ space: referenceSpace });
        setHitTestSource(hitTestSource);
      } catch (error) {
        console.error('Failed to start AR session:', error);
      }
    });

    return () => {
      if (arButton) document.body.removeChild(arButton);
    };
  }, [gl]);

  useFrame(() => {
    if (!hitTestSource) return;

    const frame = gl.xr.getFrame();
    const referenceSpace = gl.xr.getReferenceSpace();
    const hitTestResults = frame.getHitTestResults(hitTestSource);

    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(referenceSpace);
      if (pose) {
        const { position } = pose.transform;
        reticle.current.position.set(position.x, position.y, position.z);
        reticle.current.visible = true;
        // Place the model on tap/click
        window.addEventListener('click', () => {
          setModelPosition([position.x, position.y, position.z]);
        });
      }
    } else {
      reticle.current.visible = false;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight intensity={0.8} color="#ffffff" position={[1, 1, 0]} />
      <mesh ref={reticle} visible={false}>
        <ringGeometry args={[0.05, 0.06, 32]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
      {modelPosition && <Model position={modelPosition} />}
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
