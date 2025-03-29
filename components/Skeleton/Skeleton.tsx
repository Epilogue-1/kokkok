import { View, type ViewStyle } from "react-native";

interface SkeletonProps {
  className?: string;
  width?: ViewStyle["width"];
  height?: ViewStyle["height"];
  count?: number;
  circle?: boolean;
}

export default function Skeleton({
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
          key={`skeleton-component-${index}of${count}`}
          className={`animate-pulse bg-gray-20 ${circle ? "rounded-full" : "rounded-[5px]"} ${className}`}
          style={{ width, height }}
          aria-hidden={true}
        />
      ))}
    </>
  );
}
