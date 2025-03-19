import { showToast } from "@/components/ToastConfig";
import { useModal } from "@/hooks/useModal";
import { deletePost } from "@/utils/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { DeleteModal } from ".";

interface PostDeleteModalProps {
  postId: number;
  isDetail?: boolean;
}

export const PostDeleteModal: React.FC<PostDeleteModalProps> = ({
  postId,
  isDetail,
}) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { closeModal } = useModal();

  const mutation = useMutation({
    mutationFn: async () => {
      if (postId) await deletePost(postId);
    },
    onSuccess: () => {
      showToast("success", "게시글이 삭제되었어요.");
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
    if (!mutation.isPending) {
      mutation.mutate();
      closeModal();
    }
  };

  return <DeleteModal onClose={closeModal} onDelete={handleDelete} />;
};
