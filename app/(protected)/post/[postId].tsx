import { HeaderWithUsername } from "@/components/Header";
import PostItem from "@/components/PostItem";
import CommentsSection from "@/components/comments/CommentsSection";
import { MissingPostModal } from "@/components/modals/DoubleButtonModal/MissingPostModal";
import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import images from "@/constants/images";
import useFetchData from "@/hooks/useFetchData";
import { useModal } from "@/hooks/useModal";
import { getPost, getPostLikes } from "@/utils/supabase";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity } from "react-native";
import { Dimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: deviceHeight } = Dimensions.get("window");

export default function PostDetail() {
  const { postId, openComments } = useLocalSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const { openModal, openMotionModal } = useModal();

  const router = useRouter();

  const {
    data: post,
    error: postError,
    isLoading: isPostLoading,
  } = useFetchData(
    ["post", postId],
    () => getPost(Number(postId)),
    "포스트를 불러오는데 실패했습니다.",
  );

  const { data: likedAuthorData } = useFetchData(
    ["likedAuthorAvatar", postId],
    () => {
      if (postId) return getPostLikes(Number(postId));
      return Promise.resolve([]);
    },
    "좋아요한 사용자 정보를 불러오는데 실패했습니다.",
  );

  useFocusEffect(
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useCallback(() => {
      if (isPostLoading || (!postError && post)) return;
      openModal(<MissingPostModal />);
    }, [isPostLoading, postError, post]),
  );

  // 댓글 섹션을 모션 모달로 열기
  const handleOpenComments = useCallback(() => {
    if (post) {
      openMotionModal(
        <CommentsSection
          postId={Number(postId)}
          authorId={post.userData.id || ""}
        />,
        {
          maxHeight: deviceHeight,
          initialHeight: deviceHeight * 0.8,
        }
      );
    }
  }, [post, postId, openMotionModal]);

  const onOpenLikedAuthor = useCallback(() => {
    if (likedAuthorData && likedAuthorData.length > 0) {
      openMotionModal(
        <View className="flex-1">
          <FlatList
            className="w-full px-4 py-2"
            data={likedAuthorData}
            keyExtractor={(item, index) => `liked-author-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  if (userId === item.author?.id) router.push("/mypage");
                  else router.push(`/user/${item.author?.id}`);
                }}
                className="w-full flex-1 flex-row items-center gap-2 px-2 py-4"
              >
                <Image
                  source={
                    item.author?.avatarUrl
                      ? { uri: item.author?.avatarUrl }
                      : images.AvaTarDefault
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

                <Icons.HeartFilledIcon
                  width={24}
                  height={24}
                  color={colors.secondary.red}
                />
              </TouchableOpacity>
            )}
          />
        </View>,
        {
          maxHeight: deviceHeight,
          initialHeight: deviceHeight * 0.6,
        }
      );
    }
  }, [likedAuthorData, userId, router, openMotionModal]);

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

  // openComments 파라미터가 있으면 댓글창 자동 열기
  useEffect(() => {
    if (openComments === "true" && post) {
      handleOpenComments();
      // 파라미터 사용 후 제거하여 다시 열리지 않도록 처리
      router.setParams({ openComments: undefined });
    }
  }, [openComments, post, handleOpenComments, router]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white">
      <HeaderWithUsername
        name={post?.userData.username ?? ""}
        type="POST_PAGE"
      />
      {post && (
        <PostItem
          author={{
            id: post.userData?.id || "",
            name: post.userData?.username || "",
            avatar: post.userData?.avatarUrl || "",
          }}
          images={post.images || []}
          contents={post.contents || ""}
          privacy={post.privacy || "all"}
          liked={post.isLikedByUser || false}
          likedAuthorAvatars={post.likedAvatars || []}
          createdAt={post.createdAt || ""}
          commentsCount={post.totalComments || 0}
          comment={
            post.commentData
              ? {
                  author: {
                    name: post.commentData.author.username,
                    avatar: post.commentData.author.avatarUrl || "",
                  },
                  content: post.commentData.contents,
                }
              : null
          }
          postId={Number(postId)}
          onCommentsPress={handleOpenComments}
          onAuthorPress={onOpenLikedAuthor}
        />
      )}
    </SafeAreaView>
  );
}
