let setIsOriginalBehaviorValue = null;

export const setFlockUtils = (setter) => {
  setIsOriginalBehaviorValue = setter;
};

export const setIsOriginalBehavior = (value) => {
  if (setIsOriginalBehaviorValue) {
    setIsOriginalBehaviorValue(value);
  }
};