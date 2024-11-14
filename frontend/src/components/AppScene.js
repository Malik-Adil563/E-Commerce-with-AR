import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import * as THREE from 'three';
import { RingGeometry } from 'three';

// Extend to include RingGeometry
extend({ RingGeometry });

const Reticle = () => {
  const reticle = useRef();

  const { gl, scene } = useThree();
  const [hitTestSource, setHitTestSource] = React.useState(null);

  useEffect(() => {
    // Enable WebXR and add AR button
    gl.xr.enabled = true;
    const arButton = ARButton.createButton(gl, { requiredFeatures: ['hit-test'] });
    document.body.appendChild(arButton);

    const session = gl.xr.getSession();
    if (session) {
      session.addEventListener('end', () => setHitTestSource(null));

      // Setup hit-test source
      session.requestReferenceSpace('viewer').then((referenceSpace) => {
        session.requestHitTestSource({ space: referenceSpace }).then((source) => {
          setHitTestSource(source);
        });
      });
    }

    return () => {
      // Clean up
      if (arButton) document.body.removeChild(arButton);
      if (hitTestSource) hitTestSource.cancel();
    };
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
      }
    } else {
      reticle.current.visible = false;
    }
  });

  return (
    <mesh ref={reticle} visible={false}>
      <ringGeometry args={[0.05, 0.06, 32]} />
      <meshBasicMaterial color="yellow" />
    </mesh>
  );
};

const AppScene = () => {
  return (
    <Canvas camera={{ position: [0, 1.6, 0] }} onCreated={({ gl }) => (gl.xr.enabled = true)}>
      <ambientLight intensity={0.5} />
      <pointLight color="#ffffff" intensity={1} position={[1, 1, 1]} />
      <Reticle />
    </Canvas>
  );
};

export default AppScene;
