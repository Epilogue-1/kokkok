import colors from "@/constants/colors";
import images from "@/constants/images";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import {
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  Image,
  TouchableOpacity,
  View,
} from "react-native";
import type { ViewStyle } from "react-native";

interface Post {
  id: string;
  images: string[];
}

interface PostGridProps {
  refetch: () => void;
  posts: Post[] | null;
  isError?: boolean;
}

export default function PostGrid({ refetch, posts, isError }: PostGridProps) {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const numColumns = 3;

  const handleScrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    refetch();
  }, [refetch]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "SCROLL_MY_PAGE_TO_TOP",
      handleScrollToTop,
    );

    return () => subscription.remove();
  }, [handleScrollToTop]);

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center rounded-lg bg-gray-5">
        <Image
          source={images.ErrorPost}
          className="h-[178px] w-[234px]"
          resizeMode="contain"
          accessibilityLabel="게시물을 불러오지 못했습니다."
          accessibilityRole="image"
        />
      </View>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center rounded-lg bg-gray-5">
        <Image
          source={images.NoPost}
          className="h-[178px] w-[234px]"
          resizeMode="contain"
          accessibilityLabel="게시물이 없습니다."
          accessibilityRole="image"
        />
      </View>
    );
  }

  return (
    <View className="mt-[0px] flex-1">
      <View className="border-[2px] border-white">
        <FlatList
          ref={flatListRef}
          data={posts}
          scrollEnabled={false} // virtualizedLists should never be nested inside오류로 인한한 스크롤 비활성화
          renderItem={({ item, index }) => {
            const size = (Dimensions.get("window").width - 8) / numColumns;
            const totalItems = posts.length;
            const borderRadiusValue = 12;

            // 마지막 줄인지 확인
            const isLastRow =
              Math.floor(index / numColumns) ===
              Math.floor((totalItems - 1) / numColumns);

            const itemContainerStyle: ViewStyle = {
              height: size,
              width: size,
              marginRight: index % numColumns !== numColumns - 1 ? 2 : 0,
              marginBottom: isLastRow ? 0 : 2,
              overflow: "hidden",
            };

            // 첫 번째 아이템 (0번 인덱스, 왼쪽 위)
            if (index === 0) {
              itemContainerStyle.borderTopLeftRadius = borderRadiusValue;
            }

            // 첫 번째 줄의 마지막 아이템 (오른쪽 위)
            // Math.floor(index / numColumns) === 0 은 첫 번째 줄을 의미
            if (
              Math.floor(index / numColumns) === 0 &&
              index % numColumns === numColumns - 1
            ) {
              itemContainerStyle.borderTopRightRadius = borderRadiusValue;
            }

            if (isLastRow) {
              // 마지막 줄의 첫 번째 아이템 (왼쪽 아래)
              if (index % numColumns === 0) {
                itemContainerStyle.borderBottomLeftRadius = borderRadiusValue;
              }
              // 마지막 줄의 마지막 아이템 (오른쪽 아래)
              // (index % numColumns === numColumns - 1) 은 해당 줄의 마지막 아이템
              if (index % numColumns === numColumns - 1) {
                itemContainerStyle.borderBottomRightRadius = borderRadiusValue;
              }
            }

            // TouchableOpacity와 Image를 위한 스타일
            const imageWrapperStyle: ViewStyle = {
              width: "100%",
              height: "100%",
            };

            return (
              <View style={itemContainerStyle}>
                <TouchableOpacity
                  onPress={() => router.push(`/post/${item.id}`)}
                  style={imageWrapperStyle}
                >
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: colors.gray[10],
                    }}
                  >
                    <Image
                      source={{ uri: item.images[0] }}
                      resizeMode="cover"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
          numColumns={numColumns}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      </View>
    </View>
  );
}
