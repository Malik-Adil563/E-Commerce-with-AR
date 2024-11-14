import React, { useState, useEffect } from 'react';

const ARScene = () => {
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  useEffect(() => {
    // Dynamically loading the external AR.js and A-Frame scripts
    const aframeScript = document.createElement('script');
    aframeScript.src = 'https://aframe.io/releases/0.9.2/aframe.min.js';
    aframeScript.async = true;

    const arjsScript = document.createElement('script');
    arjsScript.src = 'https://raw.githack.com/jeromeetienne/AR.js/2.0.5/aframe/build/aframe-ar.js';
    arjsScript.async = true;

    aframeScript.onload = () => {
      arjsScript.onload = () => {
        setScriptsLoaded(true); // Update state when both scripts are loaded
      };
      document.body.appendChild(arjsScript);
    };

    // Append A-Frame script to the document
    document.body.appendChild(aframeScript);

    // Cleanup the scripts when the component unmounts
    return () => {
      document.body.removeChild(aframeScript);
      document.body.removeChild(arjsScript);
    };
  }, []);

  // If scripts are not loaded, show loading message
  if (!scriptsLoaded) {
    return <div>Loading AR Scene...</div>;
  }

  return (
    <a-scene embedded arjs="sourceType: webcam; debugUIEnabled: false;">
      {/* Add lighting for visibility */}
      <a-light type="ambient" color="#ffffff" intensity="0.5"></a-light>
      <a-light type="directional" color="#ffffff" intensity="0.8" position="1 1 0"></a-light>
    
        <a-entity 
          gltf-model="/3DModels/mercedes.glb" 
          scale="1 1 1" 
          position="0 0 0" 
          rotation="0 45 0"
        ></a-entity>

      {/* Static Camera */}
      <a-entity camera></a-entity>
    </a-scene>
  );
};

export default ARScene;
