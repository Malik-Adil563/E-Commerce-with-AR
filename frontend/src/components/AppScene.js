import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const AppScene = () => {
  const sceneRef = useRef(null);

  useEffect(() => {
    // Create a scene
    const scene = new THREE.Scene();

    // Create a camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Create a WebGLRenderer and attach to the DOM
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    sceneRef.current.appendChild(renderer.domElement);

    // Create a ring buffer geometry and material
    const ringGeometry = new THREE.RingGeometry(1, 3, 32); // RingGeometry instead of RingBufferGeometry
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    scene.add(ring);

    // Create a cylinder buffer geometry and material
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 2, 32); // CylinderGeometry instead of CylinderBufferGeometry
    const cylinderMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.x = 3;
    scene.add(cylinder);

    // Create a render loop
    const animate = function () {
      requestAnimationFrame(animate);

      // Rotate the ring and cylinder
      ring.rotation.x += 0.01;
      ring.rotation.y += 0.01;
      cylinder.rotation.x += 0.01;
      cylinder.rotation.y += 0.01;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on component unmount
    return () => {
      sceneRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={sceneRef} />;
};

export default AppScene;
