import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { CommentSkeleton } from "../Skeleton";
import type { CommentItemProps, ReplyTo } from "./CommentItem";
import CommentItem from "./CommentItem";

interface CommentRepliesProps {
  replyData: { pages: ReplyPage[] } | null | undefined;
  totalReplies: number;
  hasNextPage: boolean;
  remainingReplies: number;
  isFetchingNextPage: boolean;
  isFetching: boolean;
  loadMore: () => void;
  id: number;
  postId: number;
  onReply: CommentItemProps["onReply"];
  onCommentsClose: () => void;
  onLikedAuthorPress: (commentId: number) => void;
  onDeletedPress: (commentId: number) => void;
}

interface ReplyItem {
  id: number;
  contents: string;
  userData: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  isLiked: boolean;
  likedAvatars: string[];
  createdAt: string;
  parentsCommentId?: number;
  replyTo?: ReplyTo;
}

interface ReplyPage {
  data: ReplyItem[];
}

export default function CommentReplies({
  replyData,
  totalReplies,
  hasNextPage,
  remainingReplies,
  isFetchingNextPage,
  isFetching,
  loadMore,
  postId,
  onReply,
  onCommentsClose,
  onLikedAuthorPress,
  onDeletedPress,
}: CommentRepliesProps) {
  return (
    <View className="pl-[8px]">
      {/* 답글 목록 */}
      {!!replyData && (
        <FlatList
          className="gap-2"
          data={replyData.pages.flatMap((page) => page.data)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
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
            isFetchingNextPage ? <CommentSkeleton /> : null
          }
        />
      )}

      {/* 답글 로딩 중 */}
      {!replyData && isFetching && <CommentSkeleton />}

      {/* 더보기 버튼 */}
      {(totalReplies > 1 || hasNextPage) && remainingReplies > 0 && (
        <TouchableOpacity
          onPress={loadMore}
          className="w-full flex-1 items-center justify-center"
        >
          <Text className="caption-2 mb-[16px] text-gray-60">
            + 답글 {remainingReplies}개 더보기
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
