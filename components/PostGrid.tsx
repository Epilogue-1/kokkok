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
      <View className="mt-[62px] flex-1 items-center justify-center rounded-lg bg-gray-5">
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
      <View className="mt-[62px] flex-1 items-center justify-center rounded-lg bg-gray-5">
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
    <View className="mt-[48px] flex-1">
      <View className="overflow-hidden rounded-xl border-[3px] border-white bg-gray-5">
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={({ item }) => {
            const size = Dimensions.get("window").width / 3;
            return (
              <View
                style={{
                  height: size,
                  width: size,
                  marginRight: 3,
                  marginBottom: 3,
                }}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/post/${item.id}`)}
                >
                  <Image
                    source={{ uri: item.images[0] }}
                    resizeMode="cover"
                    style={{ width: "100%", height: "100%" }}
                    defaultSource={images.ErrorPost}
                  />
                </TouchableOpacity>
              </View>
            );
          }}
          numColumns={3}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      </View>
    </View>
  );
}
