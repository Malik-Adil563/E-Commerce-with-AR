import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ARButton } from 'https://unpkg.com/three@0.126.0/examples/jsm/webxr/ARButton.js';
import 'webxr-polyfill';


const AppScene = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  let camera, scene, renderer, controller, mesh;

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

    // Add AR button to trigger AR session
    document.body.appendChild(ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'], // Optional: Specify required features for AR
    }));

    // Handle window resizing
    window.addEventListener('resize', onWindowResize, false);
  };

  const onSelect = () => {
    const geometry = new THREE.ConeGeometry(0.1, 0.2, 32).rotateX(Math.PI / 2);
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff * Math.random(),
      shininess: 6,
      flatShading: true,
      transparent: 1,
      opacity: 0.8,
    });
    mesh = new THREE.Mesh(geometry, material);

    // Position mesh relative to the controller
    mesh.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
    mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);

    // Add mesh to the scene
    scene.add(mesh);
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