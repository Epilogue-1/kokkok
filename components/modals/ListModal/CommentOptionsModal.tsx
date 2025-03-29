import { useModal } from "@/hooks/useModal";
import { ListModal } from ".";
import { CommentDeleteModal } from "../DeleteModal/CommentDeleteModal";
import { ReportModal } from "../ReportModal";

interface CommentOptionsModalProps {
  postId: number;
  commentId: number;
  isOwner: boolean;
  reportedId?: string;
}

export const CommentOptionsModal: React.FC<CommentOptionsModalProps> = ({
  postId,
  commentId,
  isOwner,
  reportedId,
}) => {
  const { openModal } = useModal();

  if (!isOwner && reportedId) {
    return (
      <ListModal
        position={"bottom"}
        buttons={[
          {
            text: "신고",
            onPress: async () => {
              openModal(
                <ReportModal reportedId={reportedId} commentId={commentId} />,
              );
            },
          },
        ]}
      />
    );
  }

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
