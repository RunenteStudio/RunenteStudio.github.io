import React, { createContext, useState } from 'react';

const ScaleContext = createContext();

const ScaleProvider = ({ children }) => {
  const [modifiedScale, setModifiedScale] = useState(10);

  const updateModifiedScale = (newScale) => {
    setModifiedScale(newScale);
  };

  return (
    <ScaleContext.Provider value={{ modifiedScale, updateModifiedScale }}>
      {children}
    </ScaleContext.Provider>
  );
};

export { ScaleContext, ScaleProvider };