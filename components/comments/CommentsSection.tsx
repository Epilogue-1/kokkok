import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import images from "@/constants/images";
import useFetchData from "@/hooks/useFetchData";
import useInfiniteLoad from "@/hooks/useInfiniteLoad";
import { useModal } from "@/hooks/useModal";
import useRefresh from "@/hooks/useRefresh";
import {
  createComment,
  createNotification,
  deleteComment,
  getCommentLikes,
  getComments,
} from "@/utils/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  Text,
  type TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { showToast } from "../ToastConfig";
import MotionModal from "../modals/MotionModal";
import CommentItem from "./CommentItem";
import MentionInput from "./MentionInput";

const LIMIT = 5;
const { height: deviceHeight, width: deviceWidth } = Dimensions.get("window");

interface CommentsSectionProps {
  visible: boolean;
  onClose: () => void;
  postId: number;
  authorId: string;
}

export default function CommentsSection({
  visible,
  onClose,
  postId,
  authorId,
}: CommentsSectionProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<{
    userId: string;
    username: string;
    parentId: number;
    replyCommentId: number;
  } | null>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(
    null,
  );
  const [isLikedModalVisible, setIsLikedModalVisible] = useState(false);
  const [likedAuthorId, setLikedAuthorId] = useState<number | null>(null);
  const { openModal } = useModal();

  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();

  const { data: likedAuthor } = useFetchData(
    ["likedAuthor", likedAuthorId],
    () => {
      if (likedAuthorId) return getCommentLikes(likedAuthorId);
      return Promise.resolve([]);
    },
    "좋아요 한 사용자 정보를 불러오는데 실패했습니다.",
    isLikedModalVisible,
  );

  // 댓글 가져오기
  const { data, isFetching, isFetchingNextPage, refetch, loadMore } =
    useInfiniteLoad({
      queryFn: getComments(postId),
      queryKey: ["comments", postId],
      limit: LIMIT,
    });

  const { refreshing, onRefresh } = useRefresh({ refetch });

  // 답글달기 핸들러
  const handleReply = (
    userId: string,
    username: string,
    parentId: number,
    replyCommentId: number,
  ) => {
    setReplyTo({ userId, username, parentId, replyCommentId: replyCommentId });
    inputRef.current?.focus();
  };

  // 댓글 작성
  const writeCommentMutation = useMutation({
    mutationFn: () =>
      createComment({
        postId,
        contents: comment,
        parentId: replyTo?.parentId,
        replyCommentId: replyTo?.replyCommentId,
      }),
    onSuccess: (data) => {
      showToast("success", "댓글이 작성되었어요!");

      const isAuthor = authorId === userId; // 게시글 작성자가 본인인지 확인
      const isReplyToOthers = replyTo?.userId !== userId; // 답글 대상자가 본인인지 확인
      const isReply = replyTo !== null; // 답글 여부 확인

      if (isReply) {
        // 답글 대상자가 본인이 아닌 경우 알림 전송
        if (isReplyToOthers) {
          sendNotificationMutation.mutate({
            commentId: data.id,
            type: "mention",
          });
        }
      } else {
        // 댓글 작성자가 게시글 작성자가 아닌 경우 알림 전송
        if (!isAuthor) {
          sendNotificationMutation.mutate({
            commentId: data.id,
            type: "comment",
          });
        }
      }

      setComment("");
      setReplyTo(null);

      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["replies"] });

      inputRef.current?.blur();
    },
    onError: () => {
      showToast("fail", "댓글 작성에 실패했어요!");
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: ({
      commentId,
      type = "comment",
    }: {
      commentId: number;
      type?: "comment" | "mention";
    }) =>
      createNotification({
        to: replyTo?.userId || authorId || "",
        type: type,
        data: {
          postId,
          commentInfo: {
            id: commentId,
            content: comment,
          },
        },
      }),
  });

  const onLikedAuthorPress = useCallback((commentId: number) => {
    setLikedAuthorId(commentId);
    setIsLikedModalVisible(true);
  }, []);

  const deleteCommentMutation = useMutation({
    mutationFn: async () => {
      if (selectedCommentId) await deleteComment(selectedCommentId);
    },
    onSuccess: () => {
      showToast("success", "댓글이 삭제되었어요.");

      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["replies"] });
    },
    onError: () => {
      showToast("fail", "댓글 삭제에 실패했어요.");
    },
  });

  const onCloseComments = useCallback(() => {
    onClose();
    queryClient.removeQueries({ queryKey: ["comments", postId] });
    queryClient.removeQueries({ queryKey: ["replies"] });
  }, [onClose, postId, queryClient]);

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
    <MotionModal
      visible={visible}
      onClose={onCloseComments}
      maxHeight={deviceHeight}
      initialHeight={deviceHeight * 0.8}
    >
      <View className="flex-1">
        <View className="relative w-full ">
          <LinearGradient
            colors={["#fcfcfc", "rgba(255, 255, 255, 0)"]}
            start={[0, 0]}
            end={[0, 1]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 10,
              zIndex: 1,
            }}
          />
        </View>

        <FlatList
          className="flex-1 px-8"
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          ListHeaderComponent={<View className="h-[10px]" />}
          data={data?.pages.flatMap((page) => page.data) || []}
          keyExtractor={(item) => item.id.toString()}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (!isFetchingNextPage) loadMore();
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          removeClippedSubviews={false}
          maxToRenderPerBatch={10}
          windowSize={5}
          getItemLayout={(data, index) => ({
            length: 100,
            offset: 100 * index,
            index,
          })}
          renderItem={({ item }) => (
            <CommentItem
              key={item.id}
              id={Number(item.id)}
              postId={postId}
              contents={item.contents}
              createdAt={item.createdAt}
              likedAvatars={item.likedAvatars}
              liked={item.isLiked}
              author={item.userData}
              totalReplies={item.totalReplies}
              onReply={handleReply}
              onCommentsClose={onClose}
              onLikedAuthorPress={onLikedAuthorPress}
              onDeletedPress={(commentId) => {
                setSelectedCommentId(commentId);
                openModal({ type: "DELETE_COMMENT", postId, commentId });
              }}
            />
          )}
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
          showsHorizontalScrollIndicator={false}
          ListEmptyComponent={
            isFetching ? (
              <View>
                {[...Array(5)].map((_, index) => (
                  <View
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    key={`skeleton-${index}`}
                    className="mb-8 animate-pulse gap-[13px]"
                  >
                    <View className="h-12 flex-1 flex-row items-center gap-2">
                      <View className="size-12 rounded-full bg-gray-25" />

                      <View className="h-12 flex-1 justify-center gap-[5px]">
                        <View className="h-[16px] w-16 rounded-md bg-gray-25" />
                        <View className="h-[13px] w-10 rounded-md bg-gray-25" />
                      </View>

                      <View className="size-[28px] rounded-full bg-gray-25" />
                    </View>

                    <View className="gap-[13px]">
                      <View className="h-[18px] w-[80%] rounded-md bg-gray-25" />
                      <View className="h-[14px] w-10 rounded-md bg-gray-25" />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="title-3 text-gray-70">
                  아직 댓글이 없어요.
                </Text>
              </View>
            )
          }
        />
      </View>

      {isLikedModalVisible && (
        <MotionModal
          visible={isLikedModalVisible}
          onClose={() => setIsLikedModalVisible(false)}
          maxHeight={deviceHeight}
          initialHeight={deviceHeight * 0.6}
        >
          <View className="flex-1 ">
            <FlatList
              className="w-full px-4 py-2 "
              data={likedAuthor}
              keyExtractor={(item, index) => `liked-author-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setIsLikedModalVisible(false);
                    onClose();
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
          </View>
        </MotionModal>
      )}

      {/* comment input */}
      <>
        {replyTo?.username && (
          <View className="relative h-[40px] w-full flex-row items-center justify-center bg-gray-20">
            <View
              className="flex-row items-center justify-center text-center"
              style={{ width: "70%" }}
            >
              <Text
                className="shrink font-pmedium text-[#000] text-[14px] leading-[150%]"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {replyTo.username}
              </Text>

              <Text className="shrink-0 font-pmedium text-[14px] text-gray-60 leading-[150%]">
                님께 답글 달기
              </Text>
            </View>

            <TouchableOpacity
              className="-translate-y-1/2 absolute top-1/2 right-5"
              onPress={() => setReplyTo(null)}
            >
              <Icons.XIcon width={16} height={16} color={colors.gray[90]} />
            </TouchableOpacity>
          </View>
        )}

        <View
          className={`z-10 h-20 flex-row items-center border-gray-5 border-t bg-white px-[18px] pt-[16px] ${Platform.OS === "ios" ? "pb-8" : "pb-4"}`}
        >
          <MentionInput
            ref={inputRef}
            value={comment}
            onChangeText={(text) => {
              setComment(text);
            }}
            placeholder={
              replyTo
                ? `${replyTo.username.length > 10 ? `${replyTo.username.slice(0, 10)}...` : replyTo.username}님께 답글을 남겨보세요.`
                : "댓글을 입력해주세요."
            }
            onSubmit={() => {
              if (comment.trim() && !writeCommentMutation.isPending)
                writeCommentMutation.mutate();
            }}
            isPending={writeCommentMutation.isPending}
          />
        </View>
      </>
    </MotionModal>
  );
}
