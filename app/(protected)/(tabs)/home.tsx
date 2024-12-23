import { DeleteModal } from "@/components/Modal";
import MotionModal from "@/components/MotionModal";
import PostItem from "@/components/PostItem";
import { showToast } from "@/components/ToastConfig";
import CommentsSection from "@/components/comments/CommentsSection";
import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import { default as imgs } from "@/constants/images";
import useFetchData from "@/hooks/useFetchData";
import useInfiniteLoad from "@/hooks/useInfiniteLoad";
import useRefresh from "@/hooks/useRefresh";
import { deletePost, getPostLikes, getPosts } from "@/utils/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
} from "react-native";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LIMIT = 10;
const { height: deviceHeight } = Dimensions.get("window");

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [isLikedModalVisible, setIsLikedModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: likedAuthorData } = useFetchData(
    ["likedAuthorAvatar", selectedPostId],
    () => {
      if (selectedPostId) return getPostLikes(selectedPostId);
      return Promise.resolve([]);
    },
    "좋아요한 사용자 정보를 불러오는데 실패했습니다.",
    isLikedModalVisible,
  );

  const onOpenLikedAuthor = useCallback((postId: number) => {
    setSelectedPostId(postId);
    setIsLikedModalVisible(true);
  }, []);

  const onOpenComments = useCallback(
    ({ postId, authorId }: { postId: number; authorId: string }) => {
      setSelectedPostId(postId);
      setSelectedAuthorId(authorId);

      setIsCommentsVisible(true);
    },
    [],
  );

  const onCloseComments = useCallback(() => {
    setIsCommentsVisible(false);
    setSelectedPostId(null);
    setSelectedAuthorId(null);
  }, []);

  // post 조회
  const { data, isFetchingNextPage, refetch, loadMore } = useInfiniteLoad({
    queryFn: getPosts,
    queryKey: ["posts"],
    limit: LIMIT,
  });

  const { refreshing, onRefresh } = useRefresh({ refetch });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      if (selectedPostId) await deletePost(selectedPostId);
    },
    onSuccess: () => {
      showToast("success", "게시글이 삭제되었어요.");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: () => {
      showToast("fail", "게시글 삭제에 실패했어요.");
    },
  });

  // 유저 아이디 불러오기
  useEffect(() => {
    const handleLoadId = async () => {
      try {
        setUserId(await SecureStore.getItemAsync("userId"));
      } catch (error) {
        console.error("userId 조회 중 오류 발생:", error);
        setUserId(null);
      }
    };

    handleLoadId();
  }, []);

  return (
    <SafeAreaView edges={[]} className="flex-1 items-center justify-center">
      <FlatList
        data={data?.pages.flatMap((page) => page.data) ?? []}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ gap: 10 }}
        renderItem={({ item: post }) => (
          <PostItem
            key={post.id}
            author={{
              id: post.userData?.id ?? "",
              name: post.userData?.username ?? "",
              avatar: post.userData?.avatarUrl ?? "",
            }}
            images={post.images}
            liked={post.isLikedByUser}
            likedAuthorAvatars={post.likedAvatars ?? []}
            contents={post.contents}
            createdAt={post.createdAt}
            commentsCount={post.totalComments ?? 0}
            comment={{
              author: {
                name: post.commentData?.author?.username ?? "",
                avatar: post.commentData?.author?.avatarUrl ?? "",
              },
              content: post.commentData?.contents ?? "",
            }}
            postId={Number(post.id)}
            onCommentsPress={() =>
              onOpenComments({
                postId: Number(post.id),
                authorId: post.userData?.id ?? "",
              })
            }
            onAuthorPress={onOpenLikedAuthor}
            onDeletePress={() => {
              setSelectedPostId(Number(post.id));
              setIsDeleteModalVisible(true);
            }}
          />
        )}
        onEndReachedThreshold={0.5}
        onEndReached={loadMore}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              size="large"
              className="py-4"
              color={colors.primary}
            />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {isCommentsVisible &&
        selectedPostId !== null &&
        selectedAuthorId !== null && (
          <View className="flex-1">
            <CommentsSection
              visible={isCommentsVisible}
              onClose={onCloseComments}
              postId={selectedPostId}
              authorId={selectedAuthorId}
            />
          </View>
        )}

      {isDeleteModalVisible && selectedPostId !== null && (
        <View className="flex-1">
          <DeleteModal
            isVisible={isDeleteModalVisible}
            onClose={() => setIsDeleteModalVisible(false)}
            onDelete={() => {
              deletePostMutation.mutate();
              setIsDeleteModalVisible(false);
            }}
          />
        </View>
      )}

      {isLikedModalVisible && (
        <View className="flex-1 ">
          <MotionModal
            visible={isLikedModalVisible}
            onClose={() => setIsLikedModalVisible(false)}
            maxHeight={deviceHeight}
            initialHeight={deviceHeight * 0.6}
          >
            <View className="flex-1">
              <FlatList
                className="w-full px-4 py-2 "
                data={likedAuthorData}
                keyExtractor={(item, index) => `liked-author-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setIsLikedModalVisible(false);
                      if (userId === item.author?.id) router.push("/mypage");
                      else router.push(`/user/${item.author?.id}`);
                    }}
                    className="w-full flex-1 flex-row items-center gap-2 px-2 py-4"
                  >
                    <Image
                      source={
                        item.author?.avatarUrl
                          ? { uri: item.author?.avatarUrl }
                          : imgs.AvaTarDefault
                      }
                      resizeMode="cover"
                      className="size-10 rounded-full"
                    />
                    <Text
                      className="flex-1 font-psemibold text-[16px] text-gray-90 leading-[150%]"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.author?.username}
                    </Text>

                    <Icons.HeartIcon
                      width={24}
                      height={24}
                      color={colors.secondary.red}
                      fill={colors.secondary.red}
                    />
                  </TouchableOpacity>
                )}
              />
            </View>
          </MotionModal>
        </View>
      )}
    </SafeAreaView>
  );
}
