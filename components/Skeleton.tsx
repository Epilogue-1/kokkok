import { View } from "react-native";

interface SkeletonProps {
  className?: string;
  width: number;
  height: number;
  count?: number;
  circle?: boolean;
}

export function Skeleton({
  className = "",
  width,
  height,
  count = 1,
  circle = false,
}: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          key={`skeleton-${index}`}
          className={`w-full animate-pulse ${circle ? "rounded-full" : "rounded-[5px]"} ${className}`}
          style={{ width, height }}
          aria-hidden={true}
        />
      ))}
    </>
  );
}
