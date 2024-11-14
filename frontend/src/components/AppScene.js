import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import * as THREE from 'three';

// Import RingGeometry instead of RingBufferGeometry
import { RingGeometry } from 'three';

// Extend to include RingGeometry
extend({ RingGeometry });

const RedBox = ({ position }) => (
  <mesh position={position}>
    <boxGeometry args={[0.2, 0.2, 0.2]} />
    <meshStandardMaterial color="red" />
  </mesh>
);

const ARScene = () => {
  const { gl, scene, camera } = useThree();
  const [hitTestSource, setHitTestSource] = React.useState(null);
  const [modelPosition, setModelPosition] = React.useState([0, 0, -0.5]); // Initial position for testing
  const reticle = useRef();

  useEffect(() => {
    // Enable WebXR AR mode only if not on iOS, as iOS lacks full WebXR support
    if (!/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      gl.xr.enabled = true;
      document.body.appendChild(ARButton.createButton(gl, { requiredFeatures: ['hit-test'] }));

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
        if (hitTestSource) hitTestSource.cancel();
      };
    } else {
      console.warn("WebXR is not fully supported on iOS");
    }
  }, [gl, hitTestSource]);

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

        window.addEventListener('click', () => {
          console.log("Setting model position", [position.x, position.y, position.z]);
          setModelPosition([position.x, position.y, position.z]);
        });
      }
    } else {
      reticle.current.visible = false;
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <pointLight color="#ffffff" intensity={1} position={[1, 1, 1]} />

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
