import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import * as THREE from 'three';

// Import RingGeometry for the reticle
import { RingGeometry } from 'three';
extend({ RingGeometry });

const RedBox = ({ position }) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.1, 0.1, 0.1]} /> {/* Set the box size */}
      <meshStandardMaterial color="red" />
    </mesh>
  );
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
        <ringGeometry args={[0.05, 0.06, 32]} />
        <meshBasicMaterial color="yellow" />
      </mesh>

      {/* Load the red box at the detected position */}
      {modelPosition && <RedBox position={modelPosition} />}
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
