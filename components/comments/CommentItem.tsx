import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import images from "@/constants/images";
import useFetchData from "@/hooks/useFetchData";
import useInfiniteLoad from "@/hooks/useInfiniteLoad";
import { useModal } from "@/hooks/useModal";
import { useTruncateText } from "@/hooks/useTruncateText";
import { diffDate } from "@/utils/formatDate";
import {
  createNotification,
  getReplies,
  getUser,
  toggleLikeComment,
} from "@/utils/supabase";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import { FlatList } from "react-native";

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
const LIMIT = 5;

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
  const [isTextMore, setIsTextMore] = useState(false);
  const { truncateText, calculateMaxChars } = useTruncateText();
  const { openModal } = useModal();
  const [userLikedAvatars, setUserLikedAvatars] =
    useState<string[]>(likedAvatars);

  const router = useRouter();

  const diff = diffDate(new Date(createdAt));

  // 답글 가져오기
  const {
    data: replyData,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteLoad({
    queryFn: getReplies(id),
    queryKey: ["replies", id],
    genLimit: (pageParam: number) => (pageParam === 0 ? 1 : LIMIT),
  });

  const { data: userData } = useFetchData(
    ["user", userId],
    () => {
      if (userId) return getUser(userId);
      return Promise.resolve(null);
    },
    "사용자 정보를 불러오는데 실패했습니다.",
  );

  const handleOpenModal = () => {
    openModal(
      { type: "SELECT_COMMENT_DELETE", commentId: id, postId },
      "bottom",
    );
  };

  // 좋아요 토글
  const toggleLike = useMutation({
    mutationFn: () => toggleLikeComment(id),
    onMutate: () => {
      setIsLiked((prev) => !prev);

      if (!isLiked) {
        const avatarToUse =
          author?.avatarUrl ||
          userData?.avatarUrl ||
          images.AvaTarDefault ||
          "";
        setUserLikedAvatars((prev) => [...(prev || []), avatarToUse]);
      } else {
        setUserLikedAvatars((prev) =>
          prev.filter((prevAvatar) => prevAvatar !== author?.avatarUrl),
        );
      }
    },
    onSuccess: () => {
      if (isLiked && userId !== author?.id) {
        sendNotificationMutation.mutate();
      }
    },
    onError: () => {
      setIsLiked((prev) => !prev);
      if (!isLiked) {
        setUserLikedAvatars((prev) =>
          prev.filter((prevAvatar) => prevAvatar !== author?.avatarUrl),
        );
      } else {
        setUserLikedAvatars((prev) => [...prev, author?.avatarUrl || ""]);
      }
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
        if (author?.id === userId) handleOpenModal();
      }}
    >
      {/* header */}
      <View className={"flex-row items-center justify-between"}>
        {/* user info */}
        <TouchableOpacity
          onPress={() => {
            onCommentsClose();
            if (author?.id === userId) router.push("/mypage");
            else router.push(`/user/${author?.id}`);
          }}
          className="flex-1"
        >
          <View className="flex-1 flex-row items-center gap-[8px]">
            <Image
              source={
                author?.avatarUrl
                  ? { uri: author.avatarUrl }
                  : images.AvaTarDefault
              }
              resizeMode="cover"
              className="size-[32px] rounded-full"
            />
            <View className="max-w-[80%]">
              <Text
                className="title-5 text-black"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {author?.username}
              </Text>
              <Text className="caption-2 text-gray-40">{diff}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View className="flex-row items-center">
          {/* like */}
          <TouchableOpacity
            onPress={() => {
              if (!toggleLike.isPending) toggleLike.mutate();
            }}
            className="p-[8px]"
          >
            {isLiked ? (
              <Icons.HeartFilledIcon
                width={24}
                height={24}
                color={colors.secondary.red}
              />
            ) : (
              <Icons.HeartIcon width={24} height={24} color={colors.gray[90]} />
            )}
          </TouchableOpacity>

          {/* kebab button */}
          {author?.id === userId && (
            <TouchableOpacity
              onPress={handleOpenModal}
              className="py-[8px] pl-[8px]"
            >
              <Icons.KebabMenuIcon
                width={24}
                height={24}
                color={colors.black}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* contents */}
      <View className="flex-1 flex-row flex-wrap py-[16px]">
        <Text
          onPress={() =>
            contents.length > calculateMaxChars && setIsTextMore(!isTextMore)
          }
          onLongPress={() => {
            if (author?.id === userId) handleOpenModal();
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

      <View className="flex-row items-center justify-between pb-[16px]">
        {/* reply button */}
        <TouchableOpacity
          onPress={() => {
            if (author) {
              onReply(author.id, author.username, parentsCommentId ?? id, id);
            }
          }}
          className="h-[26px] flex-row items-center pb-[8px]"
        >
          <Text className="caption-2 w-[80px] text-gray-80">답글달기</Text>
        </TouchableOpacity>

        {/* likeAvatar */}
        {userLikedAvatars && userLikedAvatars.length > 0 && (
          <TouchableOpacity
            onPress={() => onLikedAuthorPress(id)}
            className="flex-row items-center"
          >
            {userLikedAvatars.slice(0, 2).map((avatar, index) => (
              <Image
                key={`avatar-${index}-${id}`}
                source={avatar ? { uri: avatar } : images.AvaTarDefault}
                resizeMode="cover"
                className={`size-[26px] rounded-full border-2 border-[#f5f4f5] ${index !== 0 ? "-ml-[9px]" : ""}`}
                style={{
                  zIndex: 5 - index,
                }}
              />
            ))}
            <Text className="body-5 text-gray-80">
              {userLikedAvatars.length > 2
                ? "외 여러 명이 좋아해요"
                : "이 좋아해요"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* reply */}
      {!!totalReplies && totalReplies > 0 && (
        <View className="pl-[8px]">
          {!!replyData && (
            <FlatList
              className="gap-2"
              data={replyData.pages.flatMap((page) => page.data)}
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
                isFetchingNextPage ? <ReplySkeleton /> : null
              }
            />
          )}

          {!replyData && isFetching && <ReplySkeleton />}

          {(totalReplies > 1 || hasNextPage) &&
            !!(
              totalReplies -
              (replyData?.pages.reduce(
                (acc, page) => acc + page.data.length,
                0,
              ) ?? 0)
            ) && (
              <TouchableOpacity
                onPress={loadMore}
                className="w-full flex-1 items-center justify-center"
              >
                <Text className="caption-2 mb-[16px] text-gray-60">
                  + 답글{" "}
                  {totalReplies -
                    (replyData?.pages.reduce(
                      (acc, page) => acc + page.data.length,
                      0,
                    ) ?? 0)}
                  개 더보기
                </Text>
              </TouchableOpacity>
            )}
        </View>
      )}

      {/* divider */}
      {!isReply && <View className="mb-[20px] h-[1px] w-full bg-gray-10" />}
    </Pressable>
  );
}
