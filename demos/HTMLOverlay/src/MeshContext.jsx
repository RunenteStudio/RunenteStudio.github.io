import React, { createContext, useRef, useEffect } from 'react';

export const MeshContext = createContext();

export const MeshProvider = ({ children }) => {
  const meshObjects = useRef({});
  
  useEffect(() => {
    // Populate the meshObjects with references to the objects
    const objects = meshObjects.current;
    const names = Object.keys(objects);
    names.forEach((name) => {
      objects[name].name = name;
    });
  }, []);

  const getObjectByName = (name) => {
    return meshObjects.current[name];
  };

  return (
    <MeshContext.Provider value={{ meshObjects, getObjectByName }}>
      {children}
    </MeshContext.Provider>
  );
};
