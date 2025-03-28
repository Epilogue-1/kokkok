import { useModal } from "@/hooks/useModal";
import { ListModal } from ".";
import { CommentDeleteModal } from "../DeleteModal/CommentDeleteModal";

interface CommentOptionsModalProps {
  postId: number;
  commentId: number;
}

export const CommentOptionsModal: React.FC<CommentOptionsModalProps> = ({
  postId,
  commentId,
}) => {
  const { openModal } = useModal();

  return (
    <ListModal
      position={"bottom"}
      buttons={[
        {
          text: "삭제",
          onPress: async () => {
            openModal(
              <CommentDeleteModal postId={postId} commentId={commentId} />,
            );
          },
        },
      ]}
    />
  );
};
