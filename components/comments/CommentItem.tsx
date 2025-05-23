import { CommentOptionsModal } from "@/components/modals/ListModal/CommentOptionsModal";
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
import { Pressable, View } from "react-native";
import CommentActions from "./CommentActions";
import CommentContent from "./CommentContent";
import CommentHeader from "./CommentHeader";
import CommentReplies from "./CommentReplies";

const LIMIT = 5;

// 공통 타입 정의
export type Author = {
  id: string;
  username: string;
  avatarUrl: string | null;
} | null;

export interface ReplyTo {
  id: string;
  username: string;
  avatarUrl: string | null;
}

// 타입 정의
export interface CommentItemProps {
  id: number;
  postId: number;
  contents: string;
  author: Author;
  liked?: boolean;
  likedAvatars: string[];
  createdAt: string;
  parentsCommentId?: number;
  replyTo?: ReplyTo;
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
  const [userLikedAvatars, setUserLikedAvatars] =
    useState<string[]>(likedAvatars);

  const router = useRouter();
  const { openModal } = useModal();
  const { truncateText, calculateMaxChars } = useTruncateText();

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

  // 옵션 모달 열기
  const handleOpenModal = () => {
    openModal(
      <CommentOptionsModal
        commentId={id}
        postId={postId}
        reportedId={author?.id}
        isOwner={author?.id === userId}
      />,
      "bottom",
    );
  };

  // 좋아요 토글 뮤테이션
  const toggleLike = useMutation({
    mutationFn: () => toggleLikeComment(id),
    onMutate: () => {
      setIsLiked((prev) => !prev);
      updateAvatarsList();
    },
    onSuccess: () => {
      if (isLiked && userId !== author?.id) {
        sendNotificationMutation.mutate();
      }
    },
    onError: () => {
      setIsLiked((prev) => !prev);
      // 좋아요 목록 되돌리기
      updateAvatarsList(true);
    },
  });

  // 아바타 목록 업데이트 함수
  const updateAvatarsList = (isRollback = false) => {
    const currentIsLiked = isRollback ? !isLiked : isLiked;
    const avatarToUse = userData?.avatarUrl || images.AvaTarDefault || "";

    if (!currentIsLiked) {
      // 좋아요 추가: 사용자 아바타 추가
      setUserLikedAvatars((prev) => [...(prev || []), avatarToUse]);
    } else {
      // 좋아요 취소: 사용자 아바타 제거
      setUserLikedAvatars((prev) =>
        prev.filter((prevAvatar) => prevAvatar !== avatarToUse),
      );
    }
  };

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

  // 남은 답글 수 계산
  const remainingReplies =
    (totalReplies || 0) -
    (replyData?.pages.reduce((acc, page) => acc + page.data.length, 0) ?? 0);

  // 날짜 포맷팅
  const diff = diffDate(new Date(createdAt));

  return (
    <Pressable
      onLongPress={() => {
        if (author?.id === userId) handleOpenModal();
      }}
    >
      {/* 댓글 헤더 */}
      <CommentHeader
        author={author}
        diff={diff}
        isLiked={isLiked}
        userId={userId}
        handleOpenModal={handleOpenModal}
        onCommentsClose={onCommentsClose}
        router={router}
        toggleLike={toggleLike}
      />

      {/* 댓글 내용 */}
      <CommentContent
        contents={contents}
        isReply={isReply}
        replyTo={replyTo}
        author={author}
        userId={userId}
        handleOpenModal={handleOpenModal}
        isTextMore={isTextMore}
        setIsTextMore={setIsTextMore}
        truncateText={truncateText}
        calculateMaxChars={calculateMaxChars}
      />

      {/* 댓글 액션 (답글 버튼, 좋아요) */}
      <CommentActions
        author={author}
        userLikedAvatars={userLikedAvatars}
        onReply={onReply}
        id={id}
        parentsCommentId={parentsCommentId}
        onLikedAuthorPress={onLikedAuthorPress}
      />

      {/* 답글 목록 */}
      {!!totalReplies && totalReplies > 0 && (
        <CommentReplies
          replyData={replyData}
          totalReplies={totalReplies}
          hasNextPage={hasNextPage}
          remainingReplies={remainingReplies}
          isFetchingNextPage={isFetchingNextPage}
          isFetching={isFetching}
          loadMore={loadMore}
          id={id}
          postId={postId}
          onReply={onReply}
          onCommentsClose={onCommentsClose}
          onLikedAuthorPress={onLikedAuthorPress}
          onDeletedPress={onDeletedPress}
        />
      )}

      {/* 구분선 */}
      {!isReply && <View className="mb-[20px] h-[1px] w-full bg-gray-10" />}
    </Pressable>
  );
}
