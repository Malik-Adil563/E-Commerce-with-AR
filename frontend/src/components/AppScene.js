import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ARButton } from 'https://unpkg.com/three@0.126.0/examples/jsm/webxr/ARButton.js';
import 'webxr-polyfill';

const AppScene = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  let camera, scene, renderer, controller, model;

  useEffect(() => {
    // Feature detection for WebXR
    if (!navigator.xr) {
      alert('Your device does not support WebXR.');
      return;
    }

    init();
    animate();

    // Cleanup function to remove WebXR button and renderer
    return () => {
      sceneRef.current.removeChild(renderer.domElement);
    };
  }, []);

  const init = () => {
    // Create container and append to the ref container
    const container = document.createElement('div');
    containerRef.current.appendChild(container);
    sceneRef.current = container;

    // Initialize Three.js scene, camera, and renderer
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 40);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Set up lighting
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // Set up the AR controller
    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    // Load the 3D model
    const loader = new GLTFLoader();
    loader.load(
      '/3DModels/tshirt.glb',
      (gltf) => {
        model = gltf.scene;
        model.scale.set(0.05, 0.05, 0.05); // Adjust these values to reduce the model size

        // Adjust the orientation to make the model upright
        model.rotation.x = Math.PI / 2; // Rotate 90 degrees around the X-axis
        model.rotation.y = Math.PI; // Optional: Adjust orientation if needed

        // Set the initial position of the model
        model.position.set(0, 0, -2); // Adjust position as required
        scene.add(model);
      },
      undefined,
      (error) => {
        console.error('An error occurred while loading the model:', error);
      }
    );

    // Add AR button to trigger AR session
    document.body.appendChild(ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'], // Optional: Specify required features for AR
    }));

    // Handle window resizing
    window.addEventListener('resize', onWindowResize, false);
  };

  const onSelect = () => {
    if (model) {
      // Position the model relative to the controller when selected
      model.position.set(0, 0, -0.5).applyMatrix4(controller.matrixWorld);
      model.quaternion.setFromRotationMatrix(controller.matrixWorld);
    }
  };

  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  const animate = () => {
    renderer.setAnimationLoop(render);
  };

  const render = () => {
    renderer.render(scene, camera);
  };

  return <div ref={containerRef} />;
};

export default AppScene;
