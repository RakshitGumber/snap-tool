export const getPixiResolution = () => {
  if (typeof window === "undefined") return 1;

  return Math.min(2, Math.max(1, window.devicePixelRatio || 1));
};
