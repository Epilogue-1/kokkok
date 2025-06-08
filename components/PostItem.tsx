import colors from "@/constants/colors";
import icons from "@/constants/icons";
import { default as imgs } from "@/constants/images";
import { useModal } from "@/hooks/useModal";
import { useTruncateText } from "@/hooks/useTruncateText";
import type { Database } from "@/types/supabase";
import { diffDate } from "@/utils/formatDate";
import { createNotification, toggleLikePost } from "@/utils/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import Carousel from "./Carousel";
import { PostOptionsModal } from "./modals/ListModal/PostOptionsModal";
interface PostItemProps {
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  images: string[];
  contents?: string | null;
  privacy: Database["public"]["Enums"]["privacyType"];
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
}

export default function PostItem({
  author,
  images,
  contents,
  privacy,
  liked,
  likedAuthorAvatars,
  createdAt,
  commentsCount = 0,
  comment,
  postId,
  onCommentsPress,
  onAuthorPress,
}: PostItemProps) {
  const diff = diffDate(new Date(createdAt));
  const [userId, setUserId] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(liked);
  const [isMore, setIsMore] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { openModal } = useModal();

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
      <View className="h-[68px] flex-row items-center justify-between gap-[72px] bg-white px-[16px]">
        {/* author */}
        <TouchableOpacity
          onPress={() => {
            if (userId === author.id) router.push("/mypage");
            else router.push(`/user/${author.id}`);
          }}
          className="h-[60px] flex-shrink flex-row items-center gap-[10px]"
        >
          {/* avatar */}
          <Image
            source={author.avatar ? { uri: author.avatar } : imgs.AvaTarDefault}
            resizeMode="cover"
            className="size-[44px] rounded-full"
          />

          <View className="flex-shrink gap-[2px]">
            {/* username */}
            <Text
              className="title-5 h-[21px] text-gray-100"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {author.name}
            </Text>

            {/* privacy */}
            <View className="flex-row items-center gap-[4px]">
              {privacy === "friend" && (
                <>
                  <icons.PeopleIcon
                    width={16}
                    height={16}
                    color={colors.gray[70]}
                  />
                  <Text className="font-medium text-[11px] text-gray-70 leading-[150%]">
                    친구 공개
                  </Text>
                </>
              )}
              {privacy === "all" && (
                <>
                  <icons.EarthIcon
                    width={14}
                    height={14}
                    color={colors.gray[70]}
                  />

                  <Text className="font-pmedium text-[11px] text-gray-70 leading-[150%]">
                    전체 공개
                  </Text>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* meatball */}
        <TouchableOpacity
          onPress={() => {
            openModal(
              <PostOptionsModal
                isOwner={userId === author.id}
                reportedId={author.id}
                postId={postId}
              />,
              "bottom",
            );
          }}
          className="items-center justify-center "
        >
          <icons.MeatballIcon width={24} height={24} color={colors.gray[70]} />
        </TouchableOpacity>
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
            {isLiked ? (
              <icons.HeartFilledIcon
                width={28}
                height={28}
                color={colors.secondary.red}
              />
            ) : (
              <icons.HeartIcon width={28} height={28} color={colors.gray[90]} />
            )}
          </TouchableOpacity>

          {/* comments */}
          <TouchableOpacity
            onPress={() => onCommentsPress(postId)}
            className="ml-[20px] flex-row items-center gap-[2px]"
          >
            <icons.CommentIcon width={28} height={28} color={colors.gray[90]} />
            {commentsCount > 0 && (
              <Text className="font-pmedium text-[14px] text-gray-100 leading-[150%]">
                {commentsCount > 99 ? "99+" : commentsCount}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* content & comments */}
      {(!!contents?.length || !!comment?.content?.length) && (
        <View className="gap-[8px] bg-white px-[16px] pt-[8px]">
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
                    {isMore ? " 접기" : " 더보기"}
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
              <icons.ThreadIcon
                width={24}
                height={24}
                color={colors.gray[70]}
              />
              <View className="flex-1 flex-row items-center gap-[6px]">
                <Text className="title-5 flex-shrink-0 text-nowrap text-gray-80">
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
            <Text className="body-5 pl-[2px] text-gray-90">
              {likedAuthorAvatars.length > 2
                ? "외 여러 명이 좋아해요"
                : "이 좋아해요"}
            </Text>
          </TouchableOpacity>
        )}

        {/* createdAt */}
        <Text className="caption-2 text-gray-90">{diff}</Text>
      </View>
    </View>
  );
}
