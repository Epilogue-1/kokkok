import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import images from "@/constants/images";
import type { UseMutationResult } from "@tanstack/react-query";
import type { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import type { Author } from "./CommentItem";

// 하위 컴포넌트 타입 정의
interface CommentHeaderProps {
  author: Author;
  diff: string;
  isLiked: boolean;
  userId: string | null;
  handleOpenModal: () => void;
  onCommentsClose: () => void;
  router: ReturnType<typeof useRouter>;
  toggleLike: UseMutationResult<void, Error, void, unknown>;
}

export default function CommentHeader({
  author,
  diff,
  isLiked,
  userId,
  handleOpenModal,
  onCommentsClose,
  router,
  toggleLike,
}: CommentHeaderProps) {
  return (
    <View className="flex-row items-center justify-between">
      {/* 사용자 정보 */}
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
        {/* 좋아요 버튼 */}
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

        {/* 옵션 메뉴 버튼 */}
        {author?.id && (
          <TouchableOpacity
            onPress={handleOpenModal}
            className="py-[8px] pl-[8px]"
          >
            <Icons.KebabMenuIcon width={24} height={24} color={colors.black} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
