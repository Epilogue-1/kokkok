import colors from "@/constants/colors";
import icons from "@/constants/icons";
import Icons from "@/constants/icons";
import { default as imgs } from "@/constants/images";
import { useTruncateText } from "@/hooks/useTruncateText";
import { diffDate } from "@/utils/formatDate";
import { createNotification, toggleLikePost } from "@/utils/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import Carousel from "./Carousel";
interface PostItemProps {
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  images: string[];
  contents?: string | null;
  liked: boolean;
  likedAuthorAvatars?: string[];
  createdAt: string;
  commentsCount?: number;
  comment?: {
    author: {
      name: string;
      avatar: string;
    };
    content: string;
  } | null;
  postId: number;
  onCommentsPress: (num: number) => void;
  onAuthorPress: (id: number) => void;
  onDeletePress: () => void;
}

export default function PostItem({
  author,
  images,
  contents,
  liked,
  likedAuthorAvatars,
  createdAt,
  commentsCount = 0,
  comment,
  postId,
  onCommentsPress,
  onAuthorPress,
  onDeletePress,
}: PostItemProps) {
  const diff = diffDate(new Date(createdAt));
  const [userId, setUserId] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(liked);
  const [isMore, setIsMore] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { calculateMaxChars, truncateText } = useTruncateText();

  const toggleLike = useMutation({
    mutationFn: () => toggleLikePost(postId),
    onMutate: () => {
      setIsLiked((prev) => !prev);
      if (!isLiked) {
        setShowHeart(true);
        setTimeout(() => {
          setShowHeart(false);
        }, 1000);
      } else if (isLiked && showHeart) {
        setShowHeart(false);
      }
    },
    onSuccess: () => {
      if (isLiked && userId !== author.id) {
        sendNotificationMutation.mutate();
      }
    },
    onError: () => {
      setIsLiked((prev) => !prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: () =>
      createNotification({
        to: author.id,
        type: "like",
        data: { postId },
      }),
  });

  const onDoubleTap = () => {
    if (!toggleLike.isPending && !isLiked) toggleLike.mutate();
  };

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
    <View className="grow bg-white">
      {/* header */}
      <View className="h-[64px] flex-row items-center justify-between bg-white px-[16px]">
        <TouchableOpacity
          onPress={() => {
            if (userId === author.id) router.push("/mypage");
            else router.push(`/user/${author.id}`);
          }}
          className="flex-row items-center gap-2 py-[4px] pr-[16px]"
        >
          {/* avatar */}
          <Image
            source={author.avatar ? { uri: author.avatar } : imgs.AvaTarDefault}
            resizeMode="cover"
            className="size-[32px] rounded-full"
          />
          {/* username */}
          <Text className="title-5 text-gray-80">{author.name}</Text>
        </TouchableOpacity>

        {/* meatball */}
        {userId === author.id && (
          <TouchableOpacity
            onPress={() => onDeletePress()}
            className="items-center justify-center py-[4px] pl-[8px]"
          >
            <icons.MeatballIcon
              width={24}
              height={24}
              color={colors.gray[70]}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* carousel */}
      <View className="h-max w-full bg-white">
        <Carousel
          images={images}
          onDoubleTap={onDoubleTap}
          showHeart={showHeart}
        />
      </View>

      {/* relation */}
      <View className="flex-row items-center justify-between bg-white px-[16px] pt-[8px]">
        <View className="flex-row items-center pr-[2px]">
          {/* like */}
          <TouchableOpacity
            onPress={() => {
              if (!toggleLike.isPending) toggleLike.mutate();
            }}
          >
            <icons.HeartIcon
              width={24}
              height={24}
              color={isLiked ? colors.secondary.red : colors.gray[90]}
              fill={isLiked ? colors.secondary.red : "transparent"}
            />
          </TouchableOpacity>

          {/* comments */}
          <TouchableOpacity
            onPress={() => onCommentsPress(postId)}
            className="ml-[10px] flex-row items-center gap-[4px]"
          >
            <icons.CommentIcon width={24} height={24} color={colors.gray[90]} />
            {commentsCount > 0 && (
              <Text className="font-psemibold text-[13px] text-gray-90 leading-[150%]">
                {commentsCount > 99 ? "99+" : commentsCount}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* content & comments */}
      {(!!contents?.length || !!comment?.content?.length) && (
        <View className="gap-[4px] bg-white px-[16px] pt-[12px]">
          {/* content */}
          {!!contents?.length && (
            <Pressable
              disabled={!isMore && contents.length <= calculateMaxChars}
              onPress={() => setIsMore(!isMore)}
              className="flex-row flex-wrap"
            >
              <Text className="title-5 text-gray-90">
                {isMore ? contents : truncateText(contents)}
                {contents.length > calculateMaxChars && (
                  <Text className="title-5 -mb-[3px] text-gray-45">
                    {isMore ? " 접기" : "더보기"}
                  </Text>
                )}
              </Text>
            </Pressable>
          )}

          {/* comments */}
          {!!comment?.content?.length && (
            <Pressable
              onPress={() => onCommentsPress(postId)}
              className="flex-row"
            >
              <Icons.threadIcon
                width={24}
                height={24}
                color={colors.gray[70]}
              />
              <View className="flex-1 flex-row items-center gap-[6px]">
                <Text className="title-5 flex-shrink-0 text-nowrap text-gray-70">
                  {comment.author.name}
                </Text>

                <Text
                  className="body-3 flex-1 text-gray-90"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {comment.content}
                </Text>
              </View>
            </Pressable>
          )}
        </View>
      )}

      {/* footer */}
      <View className="flex-row items-center justify-between px-[16px] py-[16px]">
        {/* likeAvatar */}
        {likedAuthorAvatars && likedAuthorAvatars.length > 0 && (
          <TouchableOpacity
            className="ml-[2px] flex-row items-center"
            onPress={() => onAuthorPress(postId)}
          >
            {likedAuthorAvatars.slice(0, 2).map((avatar, index) => (
              <Image
                key={`avatar-${index}-${postId}`}
                source={avatar ? { uri: avatar } : imgs.AvaTarDefault}
                resizeMode="cover"
                className={`size-[26px] rounded-full border-2 border-white ${index !== 0 ? "-ml-[9px]" : ""}`}
                style={{
                  zIndex: 5 - index,
                }}
              />
            ))}
            {likedAuthorAvatars.length > 2 && (
              <Text className="body-5 pl-[2px] text-gray-90">
                외 여러 명이 좋아해요
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* createdAt */}
        <Text className="caption-2 text-gray-90">{diff}</Text>
      </View>
    </View>
  );
}
