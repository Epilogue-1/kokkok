import { useModal } from "@/hooks/useModal";
import type { ModalPosition } from "@/types/Modal.interface";
import { ListModal } from ".";
import { CommentDeleteModal } from "../DeleteModal/CommentDeleteModal";

interface CommentOptionsModalProps {
  position: ModalPosition;
  postId: number;
  commentId: number;
}

export const CommentOptionsModal: React.FC<CommentOptionsModalProps> = ({
  position,
  postId,
  commentId,
}) => {
  const { openModal } = useModal();

  return (
    <ListModal
      position={position}
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
