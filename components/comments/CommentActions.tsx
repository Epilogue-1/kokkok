import images from "@/constants/images";
import { Image, Text, TouchableOpacity, View } from "react-native";
import type { Author, CommentItemProps } from "./CommentItem";

interface CommentActionsProps {
  author: Author;
  userLikedAvatars: string[];
  onReply: CommentItemProps["onReply"];
  id: number;
  parentsCommentId?: number;
  onLikedAuthorPress: (commentId: number) => void;
}

export default function CommentActions({
  author,
  userLikedAvatars,
  onReply,
  id,
  parentsCommentId,
  onLikedAuthorPress,
}: CommentActionsProps) {
  return (
    <View className="flex-row items-center justify-between pb-[16px]">
      {/* 답글 버튼 */}
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

      {/* 좋아요 아바타 */}
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
              className={`size-[26px] rounded-full border-2 border-[#FCFBFD] ${
                index !== 0 ? "-ml-[9px]" : ""
              }`}
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
  );
}
