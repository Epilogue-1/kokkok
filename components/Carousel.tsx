import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import PageIndicator from "./PageIndicator";

interface CarouselProps {
  images: string[];
  onDoubleTap?: () => void;
  showHeart?: boolean; // 추가
}

type ViewToken = {
  item: string;
  key: string;
  index: number | null;
  isViewable: boolean;
};

export default function Carousel({
  images,
  onDoubleTap,
  showHeart,
}: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const screenWidth = Dimensions.get("window").width;
  const imageHeight = screenWidth * (1 / 1); // n:n 비율 유지

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useMemo(
    () => ({
      viewAreaCoveragePercentThreshold: 50,
    }),
    [],
  );

  let lastTap = 0;
  const handleDoubleTap = () => {
    if (!onDoubleTap) return;

    const now = Date.now();
    if (lastTap && now - lastTap < 300) onDoubleTap();
    else lastTap = now;
  };

  const heartStyle = useAnimatedStyle(() => ({
    opacity: withTiming(showHeart ? 0.8 : 0, { duration: 500 }),
    transform: [{ scale: withSpring(showHeart ? 1 : 0.1) }],
  }));

  return (
    <View>
      <FlatList
        data={images}
        renderItem={({ item, index }) => (
          <TouchableWithoutFeedback
            onPress={handleDoubleTap}
            key={`carousel-item-${index}-${item}`}
          >
            <View style={{ width: screenWidth, height: imageHeight }}>
              <View className="relative flex-1 overflow-hidden">
                <Image
                  accessibilityRole="image"
                  accessibilityLabel="blur-background-image"
                  source={{ uri: item }}
                  className="absolute inset-0 size-full"
                  style={{
                    resizeMode: "cover",
                  }}
                  blurRadius={10}
                  fadeDuration={0}
                  progressiveRenderingEnabled={true}
                />
                <View className="absolute inset-0 bg-black/80" />
                <Image
                  accessibilityRole="image"
                  accessibilityLabel="carousel-image"
                  source={{ uri: item }}
                  className="size-full"
                  style={{
                    resizeMode: "contain",
                  }}
                />
              </View>

              {/* heart animation */}
              <Animated.View
                className="absolute flex size-full items-center justify-center"
                style={[heartStyle]}
              >
                <Icons.HeartIcon
                  width={96}
                  height={96}
                  color={colors.white}
                  fill={colors.white}
                />
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={true}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
      />

      <PageIndicator
        className="pt-[10px]"
        total={images.length}
        current={activeIndex}
      />
    </View>
  );
}
