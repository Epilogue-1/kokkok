const calculatePostRatio = ({
  width,
  height,
}: { width: number; height: number }) => {
  const ratio = height / width;
  const biggestRatio = Math.max(ratio);
  // 최소 1, 최대 1.25로 클램프
  const clampedRatio = Math.min(Math.max(biggestRatio, 1), 1.25);
  return clampedRatio;
};

export default calculatePostRatio;
