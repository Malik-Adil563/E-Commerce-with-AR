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
    if (!navigator.xr) {
      alert('Your device does not support WebXR.');
      return;
    }

    init();
    animate();

    return () => {
      sceneRef.current.removeChild(renderer.domElement);
    };
  }, []);

  const init = () => {
    const container = document.createElement('div');
    containerRef.current.appendChild(container);
    sceneRef.current = container;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 40);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    controller = renderer.xr.getController(0);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    const loader = new GLTFLoader();
    loader.load(
      '/3DModels/tshirt.glb',
      (gltf) => {
        model = gltf.scene;
        model.scale.set(0.01, 0.01, 0.01); // Adjusted scale
        model.rotation.x = Math.PI; // Keep it upright
        model.position.set(0, 0, -2); // Adjusted position (higher and forward)
        scene.add(model);
      },
      undefined,
      (error) => {
        console.error('An error occurred while loading the model:', error);
      }
    );

    document.body.appendChild(ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'],
    }));

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('wheel', onZoom); // Add mouse wheel event listener
  };

  const onSelect = () => {
    if (model) {
      const position = new THREE.Vector3();
      position.set(0, 0, -0.5).applyMatrix4(controller.matrixWorld);
      model.position.copy(position);

      const originalScale = model.scale.clone();
      const originalRotation = model.rotation.clone();

      model.quaternion.setFromRotationMatrix(controller.matrixWorld);
      model.rotation.x = originalRotation.x;
      model.rotation.y = originalRotation.y;
      model.rotation.z = originalRotation.z;
      model.scale.copy(originalScale);
    }
  };

  const onZoom = (event) => {
    if (model) {
      const zoomFactor = 1 - event.deltaY * 0.001; // Adjust zoom sensitivity
      const newScale = model.scale.clone().multiplyScalar(zoomFactor);

      // Prevent the model from becoming too small or too large
      if (newScale.x > 0.01 && newScale.x < 1) {
        model.scale.copy(newScale);
      }
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
