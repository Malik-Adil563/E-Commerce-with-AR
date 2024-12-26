import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const Model = ({ position }) => {
  const gltf = useLoader(GLTFLoader, '/3DModels/mercedes.glb'); // Path to your 3D model
  return <primitive object={gltf.scene} position={position} scale={new THREE.Vector3(1, 1, 1)} />;
};

const ARScene = () => {
  const { gl, scene, camera } = useThree();
  const [hitTestSource, setHitTestSource] = React.useState(null);
  const [modelPosition, setModelPosition] = React.useState(null);
  const reticle = useRef();

  useEffect(() => {
    // Enable WebXR AR mode
    gl.xr.enabled = true;
    document.body.appendChild(ARButton.createButton(gl, { requiredFeatures: ['hit-test'] }));

    // Initialize hit testing
    const session = gl.xr.getSession();
    session.addEventListener('end', () => {
      setHitTestSource(null);
      setModelPosition(null);
    });

    session.requestReferenceSpace('viewer').then((referenceSpace) => {
      session.requestHitTestSource({ space: referenceSpace }).then((source) => {
        setHitTestSource(source);
      });
    });

    return () => {
      // Cleanup
      if (hitTestSource) hitTestSource.cancel();
    };
  }, [gl, hitTestSource]);

  useFrame(() => {
    if (!hitTestSource) return;

    const frame = gl.xr.getFrame();
    const referenceSpace = gl.xr.getReferenceSpace();

    // Perform the hit test
    const hitTestResults = frame.getHitTestResults(hitTestSource);

    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(referenceSpace);

      if (pose) {
        const { position, orientation } = pose.transform;
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
      {/* Add lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight color="#ffffff" intensity={0.8} position={[1, 1, 0]} />

      {/* Reticle for hit test */}
      <mesh ref={reticle} visible={false}>
        <ringBufferGeometry args={[0.05, 0.06, 32]} />
        <meshBasicMaterial color="yellow" />
      </mesh>

      {/* Load the model at the detected position */}
      {modelPosition && <Model position={modelPosition} />}
    </>
  );
};

const AppScene = () => {
  return (
    <Canvas camera={{ position: [0, 1.6, 0] }} onCreated={({ gl }) => (gl.xr.enabled = true)}>
      <Suspense fallback={<div>Loading AR Scene...</div>}>
        <ARScene />
      </Suspense>
    </Canvas>
  );
};

export default AppScene;
