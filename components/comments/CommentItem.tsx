import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import images from "@/constants/images";
import { useTruncateText } from "@/hooks/useTruncateText";
import { diffDate } from "@/utils/formatDate";
import {
  createNotification,
  getReplies,
  toggleLikeComment,
} from "@/utils/supabase";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FlatList } from "react-native";
import CustomModal from "../Modal";

const ReplySkeleton = () => (
  <View className="mb-4 animate-pulse">
    {/* header */}
    <View className="flex-row items-center justify-between pb-[13px]">
      <View className="flex-1 flex-row items-center gap-2">
        <View className="size-12 rounded-full bg-gray-25" />
        <View className="max-w-[80%] gap-1">
          <View className="h-[16px] w-20 rounded-md bg-gray-25" />
          <View className="h-[10px] w-12 rounded-md bg-gray-25" />
        </View>
      </View>
      <View className="flex-row items-center gap-1">
        <View className="size-6 rounded-full bg-gray-25" />
        <View className="size-6 rounded-full bg-gray-25" />
      </View>
    </View>

    {/* contents */}
    <View className="pb-[13px]">
      <View className="h-[18px] w-[90%] rounded-md bg-gray-25" />
    </View>

    {/* reply button */}
    <View className="pb-[5px]">
      <View className="h-[14px] w-16 rounded-md bg-gray-25" />
    </View>
  </View>
);

interface CommentItemProps {
  id: number;
  postId: number;
  contents: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  } | null;
  liked?: boolean;
  likedAvatars: string[];
  createdAt: string;
  parentsCommentId?: number;
  replyTo?: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  totalReplies?: number;
  onReply: (
    userId: string,
    username: string,
    parentId: number,
    replyCommentId: number,
  ) => void;
  isReply?: boolean;
  onCommentsClose: () => void;
  onLikedAuthorPress: (commentId: number) => void;
  onDeletedPress: (commentId: number) => void;
}

export default function CommentItem({
  id,
  postId,
  contents,
  author,
  liked = false,
  likedAvatars = [],
  createdAt,
  parentsCommentId,
  replyTo,
  totalReplies,
  onReply,
  isReply = false,
  onCommentsClose,
  onLikedAuthorPress,
  onDeletedPress,
}: CommentItemProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(liked);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isTextMore, setIsTextMore] = useState(false);
  const { truncateText, calculateMaxChars } = useTruncateText();

  const queryClient = useQueryClient();
  const router = useRouter();

  const diff = diffDate(new Date(createdAt));

  // 답글 가져오기
  const {
    data: replyData,
    fetchNextPage: replyFetchNextPage,
    hasNextPage: replyHasNextPage,
    isFetchingNextPage: isReplyFetchingNextPage,
    isFetching: isReplyFetching,
  } = useInfiniteQuery({
    queryKey: ["replies", id],
    queryFn: ({ pageParam = 0 }) =>
      getReplies(id, pageParam, pageParam === 0 ? 1 : 5),
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.nextPage : undefined,
    enabled: !!totalReplies && totalReplies > 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
    initialPageParam: 0,
  });

  // 답글 더 불러오기
  const loadMoreReply = useCallback(() => {
    if (replyHasNextPage && !isReplyFetchingNextPage) {
      replyFetchNextPage();
    }
  }, [replyHasNextPage, isReplyFetchingNextPage, replyFetchNextPage]);

  const handleOpenModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  // 좋아요 토글
  const toggleLike = useMutation({
    mutationFn: () => toggleLikeComment(id),
    onMutate: () => {
      setIsLiked((prev) => !prev);
    },
    onSuccess: () => {
      if (isLiked && userId !== author?.id) {
        sendNotificationMutation.mutate();
      }

      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["replies"] });
    },
    onError: () => {
      setIsLiked((prev) => !prev);
    },
  });

  // 좋아요 알림
  const sendNotificationMutation = useMutation({
    mutationFn: () =>
      createNotification({
        to: author?.id || "",
        type: "commentLike",
        data: {
          postId,
          commentInfo: {
            id,
          },
        },
      }),
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
    <Pressable
      onLongPress={() => {
        if (author?.id === userId) {
          handleOpenModal();
        }
      }}
    >
      {/* header */}
      <View className="flex-row items-center justify-between pb-[13px]">
        {/* user info */}
        <TouchableOpacity
          onPress={() => {
            onCommentsClose();
            if (author?.id === userId) router.push("/mypage");
            else router.push(`/user/${author?.id}`);
          }}
          className="flex-1"
        >
          <View className="flex-1 flex-row items-center gap-2 ">
            <Image
              source={
                author?.avatarUrl
                  ? { uri: author.avatarUrl }
                  : images.AvaTarDefault
              }
              resizeMode="cover"
              className="size-12 rounded-full"
            />
            <View className="max-w-[80%]">
              <Text
                className="title-4 text-black"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {author?.username}
              </Text>
              <Text className="font-pmedium text-[10px] text-gray-50 leading-[150%]">
                {diff}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View className="flex-row items-center">
          {/* like */}
          <TouchableOpacity
            onPress={() => {
              if (!toggleLike.isPending) toggleLike.mutate();
            }}
          >
            <Icons.HeartIcon
              width={24}
              height={24}
              color={isLiked ? colors.secondary.red : colors.black}
              fill={isLiked ? colors.secondary.red : "transparent"}
            />
          </TouchableOpacity>

          {/* likeAvatar */}
          {likedAvatars && likedAvatars.length > 0 && (
            <TouchableOpacity
              onPress={() => onLikedAuthorPress(id)}
              className="ml-[2px] flex-row items-center"
            >
              {likedAvatars.slice(0, 2).map((avatar, index) => (
                <Image
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  key={`avatar-${index}`}
                  source={avatar ? { uri: avatar } : images.AvaTarDefault}
                  resizeMode="cover"
                  className={`size-[24px] rounded-full border border-white ${index !== 0 ? "-ml-[9px]" : ""}`}
                  style={{
                    zIndex: 5 - index,
                  }}
                />
              ))}
              {likedAvatars.length > 2 && (
                <Text className="pl-[2px] font-pbold text-[13px] text-gray-90 leading-[150%]">
                  외 여러명
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* kebab button */}
          {author?.id === userId && (
            <TouchableOpacity onPress={handleOpenModal} className="ml-2">
              <Icons.KebabMenuIcon
                width={24}
                height={24}
                color={colors.black}
              />
            </TouchableOpacity>
          )}

          <CustomModal
            visible={isModalVisible}
            onClose={handleCloseModal}
            position="bottom"
          >
            <View className="items-center">
              <TouchableOpacity
                onPress={() => {
                  onDeletedPress(id);
                  handleCloseModal();
                }}
                className="h-[82px] w-full items-center justify-center"
              >
                <Text className="title-2 text-gray-90">삭제하기</Text>
              </TouchableOpacity>
            </View>
          </CustomModal>
        </View>
      </View>
      {/* contents */}
      <View className="flex-1 flex-row flex-wrap pb-[13px]">
        <Text
          onPress={() =>
            contents.length > calculateMaxChars && setIsTextMore(!isTextMore)
          }
          onLongPress={() => {
            if (author?.id === userId) {
              handleOpenModal();
            }
          }}
          className="title-5 flex-1 text-gray-90"
        >
          {isReply && replyTo?.username && (
            <Text className="title-5 text-primary">@{replyTo.username} </Text>
          )}
          {isTextMore ? contents : truncateText(contents)}
          {contents.length > calculateMaxChars && (
            <Text className="title-5 -mb-[3px] text-gray-45">
              {isTextMore ? " 접기" : "더보기"}
            </Text>
          )}
        </Text>
      </View>

      {/* reply button */}
      <TouchableOpacity
        className={`${isReply ? "pb-[5px]" : "pb-[13px]"} self-start`}
        onPress={() => {
          if (author) {
            onReply(author.id, author.username, parentsCommentId ?? id, id);
          }
        }}
      >
        <Text className="caption-2 w-20 text-gray-60 ">답글달기</Text>
      </TouchableOpacity>

      {/* reply */}
      {!!totalReplies && totalReplies > 0 && (
        <View className="pl-4">
          {isReplyFetching ? (
            <ReplySkeleton />
          ) : (
            <>
              {!!replyData && (
                <FlatList
                  className="gap-2"
                  data={replyData.pages.flatMap((page) => page.replies)}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item, index }) => (
                    <CommentItem
                      id={item.id}
                      postId={postId}
                      contents={item.contents}
                      author={{
                        id: item.userData.id,
                        username: item.userData.username,
                        avatarUrl: item.userData.avatarUrl,
                      }}
                      liked={item.isLiked}
                      likedAvatars={item.likedAvatars}
                      createdAt={item.createdAt}
                      parentsCommentId={item.parentsCommentId}
                      replyTo={item.replyTo}
                      onReply={onReply}
                      isReply={true}
                      onCommentsClose={onCommentsClose}
                      onLikedAuthorPress={onLikedAuthorPress}
                      onDeletedPress={onDeletedPress}
                    />
                  )}
                  ListFooterComponent={() =>
                    isReplyFetchingNextPage ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : null
                  }
                />
              )}

              {(totalReplies > 1 || replyHasNextPage) &&
                !!(
                  totalReplies -
                  (replyData?.pages.reduce(
                    (acc, page) => acc + page.replies.length,
                    0,
                  ) ?? 0)
                ) && (
                  <TouchableOpacity
                    onPress={loadMoreReply}
                    className="w-full flex-1 items-center justify-center"
                  >
                    <Text className="font-pregular text-[11px] text-gray-60">
                      + 답글{" "}
                      {totalReplies -
                        (replyData?.pages.reduce(
                          (acc, page) => acc + page.replies.length,
                          0,
                        ) ?? 0)}
                      개 더보기
                    </Text>
                  </TouchableOpacity>
                )}
            </>
          )}
        </View>
      )}

      {/* divider */}
      {!isReply && <View className="mt-2 mb-4 h-[1px] w-full bg-gray-20" />}
    </Pressable>
  );
}
