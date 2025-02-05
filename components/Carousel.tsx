import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image as RNImage,
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
}: CarouselProps) {
  const [maxRatio, setMaxRatio] = useState(1); // 기본값은 1(=1:1) 최대 4:5(=1.25)로 제한
  const screenWidth = Dimensions.get("window").width;
  const imageHeight = screenWidth * maxRatio;

  /**
   * 마운트 시점 혹은 images 배열이 바뀔 때마다
   * 각 이미지의 크기를 가져와 비율(height/width)을 구합니다.
   * 구한 비율들 중 최대값을 찾고,
   * 그 최대값이 4:5(=1.25)를 넘어가지 않게 제한합니다.
   */
  useEffect(() => {
    if (!images || images.length === 0) {
      setMaxRatio(1);
      return;
    }

    let isCanceled = false;

    // 각 이미지별 height/width 비율을 구한 뒤, 그 중 최대값 사용
    Promise.all(
      images.map((uri) => {
        return new Promise<number>((resolve) => {
          RNImage.getSize(
            uri,
            (width, height) => {
              const ratio = height / width;
              resolve(ratio);
            },
            () => {
              // 만약 getSize 실패 시 기본값 1(1:1)로 처리
              resolve(1);
            },
          );
        });
      }),
    )
      .then((ratios) => {
        if (isCanceled) return;
        // 비율 중 최댓값
        const biggestRatio = Math.max(...ratios);
        // 최소 1, 최대 1.25로 클램프
        const clampedRatio = Math.min(Math.max(biggestRatio, 1), 1.25);
        setMaxRatio(clampedRatio);
      })
      .catch(() => {
        // 에러 발생 시 1(=1:1)로 초기화
        if (!isCanceled) setMaxRatio(1);
      });

    return () => {
      isCanceled = true;
    };
  }, [images]);

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
