import { showToast } from "@/components/ToastConfig";
import { useModal } from "@/hooks/useModal";
import { deleteComment } from "@/utils/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DeleteModal } from ".";

interface CommentDeleteModalProps {
  postId: number;
  commentId: number;
}

export const CommentDeleteModal: React.FC<CommentDeleteModalProps> = ({
  postId,
  commentId,
}) => {
  const queryClient = useQueryClient();
  const { closeModal } = useModal();

  const mutation = useMutation({
    mutationFn: async () => {
      if (commentId) await deleteComment(commentId);
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

  const handleDelete = () => {
    if (!mutation.isPending) {
      mutation.mutate();
      closeModal();
    }
  };

  return <DeleteModal onClose={closeModal} onDelete={handleDelete} />;
};
