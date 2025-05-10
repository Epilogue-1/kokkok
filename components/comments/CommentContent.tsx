import type { Dispatch, SetStateAction } from "react";
import { Text, View } from "react-native";
import type { Author, ReplyTo } from "./CommentItem";

interface CommentContentProps {
  contents: string;
  isReply: boolean;
  replyTo?: ReplyTo;
  author: Author;
  userId: string | null;
  handleOpenModal: () => void;
  isTextMore: boolean;
  setIsTextMore: Dispatch<SetStateAction<boolean>>;
  truncateText: (text: string) => string;
  calculateMaxChars: number;
}

export default function CommentContent({
  contents,
  isReply,
  replyTo,
  author,
  userId,
  handleOpenModal,
  isTextMore,
  setIsTextMore,
  truncateText,
  calculateMaxChars,
}: CommentContentProps) {
  return (
    <View className="flex-1 flex-row flex-wrap py-[16px]">
      <Text
        onPress={() =>
          contents.length > calculateMaxChars && setIsTextMore(!isTextMore)
        }
        onLongPress={() => {
          if (author?.id === userId) handleOpenModal();
        }}
        className="body-3 flex-1 text-gray-100"
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
  );
}
