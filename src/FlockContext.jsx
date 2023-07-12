import React, { createContext, useContext, useState } from 'react';

const FlockContext = createContext();

export const FlockProvider = ({ children }) => {
  const [isMerging, setIsMerging] = useState(false);

  const setMerging = (value) => {
    setIsMerging(value);
  };

  return (
    <FlockContext.Provider value={{ isMerging, setMerging }}>
      {children}
    </FlockContext.Provider>
  );
};

export const useFlock = () => {
  const context = useContext(FlockContext);
  if (!context) {
    throw new Error('useFlock must be used within a FlockProvider');
  }
  return context;
};
