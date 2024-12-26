import React, { useRef, useEffect } from 'react';
import { useThree, useFrame, extend } from '@react-three/fiber';
import { RingBufferGeometry } from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import * as THREE from 'three';

// Extend react-three-fiber to include RingBufferGeometry
extend({ RingBufferGeometry });

const ARScene = () => {
  const { gl } = useThree();
  const [hitTestSource, setHitTestSource] = React.useState(null);
  const [modelPosition, setModelPosition] = React.useState(null);
  const reticle = useRef();

  useEffect(() => {
    gl.xr.enabled = true;
    document.body.appendChild(ARButton.createButton(gl, { optionalFeatures: ['hit-test'] }));

    const session = gl.xr.getSession();
    session.addEventListener('end', () => {
      setHitTestSource(null);
      setModelPosition(null);
    });

    session
      .requestReferenceSpace('viewer')
      .then((referenceSpace) => session.requestHitTestSource({ space: referenceSpace }))
      .then((source) => setHitTestSource(source));

    return () => {
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
      <directionalLight color="#ffffff" intensity={0.8} position={[1, 1, 0]} />

      <mesh ref={reticle} visible={false}>
        <ringBufferGeometry args={[0.05, 0.06, 32]} />
        <meshBasicMaterial color="yellow" />
      </mesh>

      {modelPosition && <Model position={modelPosition} />}
    </>
  );
};
