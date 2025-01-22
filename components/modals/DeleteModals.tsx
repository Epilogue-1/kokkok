import Icons from "@/constants/icons";
import { useModal } from "@/hooks/useModal";
import { deleteComment, deletePost } from "@/utils/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Text, TouchableOpacity, View } from "react-native";

import { useRouter } from "expo-router";
import { showToast } from "../ToastConfig";

/* -------------------------------------------------------------------------- */
/*                           기본 삭제 확인 모달 (UI)                         */
/* -------------------------------------------------------------------------- */
/**
 * @description
 * 공통적으로 사용되는 삭제 확인 모달.
 * '취소'와 '삭제' 버튼을 제공한다.
 */
export function DeleteModal({
  onClose,
  onDelete,
}: {
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <View className="px-7">
      <View className="items-center rounded-xl bg-white p-6">
        <Icons.TrashCanIcon width={30} height={38} />

        <Text className="title-3 mt-4 text-center text-gray-90">
          삭제하면 되돌릴 수 없어요{"\n"}그래도 삭제하시겠어요?
        </Text>

        <View className="mt-5 h-[52px] flex-row items-center gap-5">
          {/* 취소 버튼 */}
          <TouchableOpacity
            onPress={onClose}
            className="h-full grow items-center justify-center rounded-[8px] bg-gray-40"
          >
            <Text className="title-3 text-white">취소</Text>
          </TouchableOpacity>

          {/* 삭제 버튼 */}
          <TouchableOpacity
            onPress={onDelete}
            className="h-full grow items-center justify-center rounded-[8px] bg-primary"
          >
            <Text className="title-3 text-white">삭제</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// 게시글 삭제 모달
export function DeletePostModal({
  postId,
  isDetail,
}: { postId: number; isDetail?: boolean }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { closeModal } = useModal();

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      if (postId) await deletePost(postId);
    },
    onSuccess: () => {
      showToast("success", "게시글이 삭제되었어요.");
      // 게시글 리스트/상세 등 관련된 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      if (isDetail) {
        queryClient.invalidateQueries({ queryKey: ["userPosts"] });
        router.back();
      }
    },
    onError: () => {
      showToast("fail", "게시글 삭제에 실패했어요.");
    },
  });

  const handleDelete = () => {
    // isPending 대신 isLoading, isIdle 등의 상태를 사용할 수도 있음
    if (!deletePostMutation.isPending) {
      deletePostMutation.mutate();
      closeModal();
    }
  };

  return <DeleteModal onClose={closeModal} onDelete={handleDelete} />;
}

// 댓글 삭제 모달
export function DeleteCommentModal({
  postId,
  commentId,
}: {
  postId: number;
  commentId: number;
}) {
  const queryClient = useQueryClient();
  const { closeModal } = useModal();

  const deleteCommentMutation = useMutation({
    mutationFn: async () => {
      if (commentId) await deleteComment(commentId);
    },
    onSuccess: () => {
      showToast("success", "댓글이 삭제되었어요.");

      // 댓글, 게시글, 대댓글(또는 답글) 관련된 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["replies"] });
    },
    onError: () => {
      showToast("fail", "댓글 삭제에 실패했어요.");
    },
  });

  const handleDelete = () => {
    if (!deleteCommentMutation.isPending) {
      deleteCommentMutation.mutate();
      closeModal();
    }
  };

  return <DeleteModal onClose={closeModal} onDelete={handleDelete} />;
}
