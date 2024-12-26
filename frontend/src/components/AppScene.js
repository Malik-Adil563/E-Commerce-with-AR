import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const ARScene = ({ rendererRef }) => {
  const [model, setModel] = useState(null);
  const { camera, scene, gl } = useThree();
  const [hitTestSource, setHitTestSource] = useState(null);
  const [localSpace, setLocalSpace] = useState(null);

  // Load the model
  useEffect(() => {
    const loader = new GLTFLoader();
    const modelUrl = 'https://raw.githubusercontent.com/immersive-web/webxr-samples/main/media/gltf/space/space.gltf';

    loader.load(
      modelUrl,
      (gltf) => {
        const loadedModel = gltf.scene;
        loadedModel.position.z = -10; // Move model back in space
        scene.add(loadedModel);
        setModel(loadedModel);
      },
      undefined,
      (error) => console.error('Error loading model:', error)
    );
  }, [scene]);

  // ARButton integration and session initialization
  useEffect(() => {
    if (rendererRef.current) {
      const renderer = rendererRef.current;
      renderer.xr.enabled = true;
      document.body.appendChild(ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test'],
      }));

      const session = renderer.xr.getSession();
      if (session) {
        session.addEventListener('start', async () => {
          const viewerSpace = await session.requestReferenceSpace('viewer');
          const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
          const localSpace = await session.requestReferenceSpace('local');

          setHitTestSource(hitTestSource);
          setLocalSpace(localSpace);
        });

        session.addEventListener('end', () => {
          setHitTestSource(null);
          setLocalSpace(null);
        });
      }
    }
  }, [rendererRef]);

  // Resize handling
  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    gl.setSize(window.innerWidth, window.innerHeight);
  };

  useEffect(() => {
    window.addEventListener('resize', onWindowResize, false);
    return () => {
      window.removeEventListener('resize', onWindowResize);
    };
  }, [camera, gl]);

  // Rotation logic for the model
  const degrees = useRef(0); // Track rotation angle
  useFrame(() => {
    if (model) {
      degrees.current += 0.2; // Update rotation angle
      model.rotation.y = THREE.MathUtils.degToRad(degrees.current); // Apply rotation
    }
  });

  return null;
};

const AppScene = () => {
  const rendererRef = useRef();

  return (
    <Canvas
      onCreated={({ gl, camera, scene }) => {
        rendererRef.current = gl; // Store the renderer reference
      }}
    >
      <ARScene rendererRef={rendererRef} />
    </Canvas>
  );
};

export default AppScene;
