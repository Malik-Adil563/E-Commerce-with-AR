import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import * as THREE from 'three';

const ARScene = ({ rendererRef }) => {
  const [hitTestSource, setHitTestSource] = useState(null);
  const [localSpace, setLocalSpace] = useState(null);
  const reticle = useRef();
  const [polygons, setPolygons] = useState([]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (renderer) {
      renderer.xr.enabled = true;

      const sessionInitOptions = { requiredFeatures: ['hit-test'] };
      const button = ARButton.createButton(renderer, sessionInitOptions);
      document.body.appendChild(button);

      const session = renderer.xr.getSession();

      // Ensure the session is active before proceeding
      const initializeHitTestSource = async () => {
        if (!session) {
          console.error('WebXR session is not active');
          return;
        }

        const viewerSpace = await session.requestReferenceSpace('viewer');
        const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
        const localSpace = await session.requestReferenceSpace('local');

        setHitTestSource(hitTestSource);
        setLocalSpace(localSpace);

        session.addEventListener('end', () => {
          setHitTestSource(null);
          setLocalSpace(null);
        });
      };

      // Wait until the session is available
      if (session) {
        initializeHitTestSource();
      } else {
        session.addEventListener('start', initializeHitTestSource);
      }
    }
  }, [rendererRef]);

  useFrame((state, delta, frame) => {
    if (!hitTestSource || !frame) return;

    const hitTestResults = frame.getHitTestResults(hitTestSource);

    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(localSpace);

      if (pose) {
        reticle.current.visible = true;
        reticle.current.matrix.fromArray(pose.transform.matrix);
      }
    } else {
      reticle.current.visible = false;
    }
  });

  const handleSelect = () => {
    if (reticle.current.visible) {
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      reticle.current.matrix.decompose(position, quaternion, new THREE.Vector3());

      setPolygons((prev) => [
        ...prev,
        { position: position.toArray(), quaternion: quaternion.toArray() },
      ]);
    }
  };

  useEffect(() => {
    const renderer = rendererRef.current;
    const controller = renderer.xr.getController(0);
    controller.addEventListener('select', handleSelect);
    return () => {
      controller.removeEventListener('select', handleSelect);
    };
  }, [rendererRef]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight intensity={0.8} position={[1, 1, 0]} />

      {/* Reticle */}
      <mesh ref={reticle} visible={false}>
        <ringGeometry args={[0.15, 0.2, 32]} /> {/* Use ringGeometry directly */}
        <meshBasicMaterial color="yellow" />
      </mesh>

      {/* Polygons */}
      {polygons.map((polygon, idx) => (
        <mesh
          key={idx}
          position={polygon.position}
          quaternion={polygon.quaternion}
        >
          <shapeBufferGeometry
            args={[(() => {
              const shape = new THREE.Shape();
              shape.moveTo(0, 0);
              shape.lineTo(0.5, 0);
              shape.lineTo(0.25, 0.5);
              shape.lineTo(0, 0);
              return shape;
            })()]} />
          <meshPhongMaterial color={new THREE.Color(Math.random(), Math.random(), Math.random())} />
        </mesh>
      ))}
    </>
  );
};

const AppScene = () => {
  const rendererRef = useRef();

  return (
    <Canvas
      onCreated={({ gl }) => {
        rendererRef.current = gl; // Store renderer reference
      }}
    >
      <ARScene rendererRef={rendererRef} />
    </Canvas>
  );
};

export default AppScene;
