import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import BlurredImageCard from "./BlurredImageCard";
import PageIndicator from "./PageIndicator";

interface CarouselProps {
  images: string[];
  onDoubleTap?: () => void;
  showHeart?: boolean;
  ratio: number;
}

// ViewToken 타입 정의
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
  ratio,
}: CarouselProps) {
  const screenWidth = Dimensions.get("window").width;
  const imageHeight = screenWidth * ratio;

  // FlatList에서 현재 보여지는 아이템의 index를 추적
  const [activeIndex, setActiveIndex] = useState(0);

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
    if (lastTap && now - lastTap < 300) {
      onDoubleTap();
    } else {
      lastTap = now;
    }
  };

  // 좋아요 하트 표시 애니메이션
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
              <View
                style={{ flex: 1, position: "relative", overflow: "hidden" }}
              >
                <BlurredImageCard uri={item} />
              </View>

              {/* 하트 애니메이션 */}
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  heartStyle,
                ]}
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
        removeClippedSubviews
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
