import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import * as THREE from 'three';
import { RingGeometry } from 'three';

extend({ RingGeometry });

const Reticle = () => {
  const reticle = useRef();
  const { gl } = useThree();
  const [hitTestSource, setHitTestSource] = React.useState(null);

  useEffect(() => {
    gl.xr.enabled = true;
    const arButton = ARButton.createButton(gl, { requiredFeatures: ['hit-test'] });
    document.body.appendChild(arButton);

    arButton.addEventListener('click', async () => {
      try {
        const session = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'] });
        gl.xr.setSession(session);

        session.addEventListener('end', () => setHitTestSource(null));
        const referenceSpace = await session.requestReferenceSpace('viewer');
        const hitSource = await session.requestHitTestSource({ space: referenceSpace });
        setHitTestSource(hitSource);
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
        reticle.current.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
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

const AppScene = () => (
  <Canvas camera={{ position: [0, 1.6, 0] }}>
    <ambientLight intensity={0.5} />
    <pointLight color="#ffffff" intensity={1} position={[1, 1, 1]} />
    <Reticle />
  </Canvas>
);

export default AppScene;
