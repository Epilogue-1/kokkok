import colors from "@/constants/colors";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface PageIndicatorProps {
  className?: string;
  total: number;
  current: number;
}

export default function PageIndicator({
  className = "",
  total,
  current,
}: PageIndicatorProps) {
  if (total <= 1) return null;

  const currentIndex = Math.max(0, Math.min(current, total - 1));

  return (
    <View className={`flex-row gap-[4px] justify-center ${className}`}>
      {Array.from({ length: total }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        <Dot key={`page-${index}`} isActive={index === currentIndex} />
      ))}
    </View>
  );
}

interface DotProps {
  isActive: boolean;
  activeWidth?: number;
  inactiveWidth?: number;
  height?: number;
  activeColor?: string;
  inactiveColor?: string;
}

function Dot({
  isActive,
  activeWidth = 16,
  inactiveWidth = 7,
  height = 7,
  activeColor = colors.primary,
  inactiveColor = colors.gray[40],
}: DotProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(isActive ? activeWidth : inactiveWidth, {
      duration: 150,
      easing: Easing.out(Easing.quad),
    }),
    height,
    borderRadius: 4,
    backgroundColor: isActive ? activeColor : inactiveColor,
  }));

  return <Animated.View style={animatedStyle} />;
}
