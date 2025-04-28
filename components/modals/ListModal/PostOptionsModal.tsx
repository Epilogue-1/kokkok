import { useModal } from "@/hooks/useModal";
import { useRouter } from "expo-router";
import { ListModal } from ".";
import { PostDeleteModal } from "../DeleteModal/PostDeleteModal";
import { ReportModal } from "../ReportModal";

interface PostOptionsModalProps {
  postId: number;
  isOwner: boolean;
  reportedId?: string;
}

export const PostOptionsModal: React.FC<PostOptionsModalProps> = ({
  postId,
  isOwner,
  reportedId,
}) => {
  const { openModal, closeModal } = useModal();
  const router = useRouter();

  if (!isOwner && reportedId)
    return (
      <ListModal
        position="bottom"
        buttons={[
          {
            text: "신고",
            onPress: async () => {
              openModal(
                <ReportModal reportedId={reportedId} postId={postId} />,
              );
            },
          },
        ]}
      />
    );

  return (
    <ListModal
      position="bottom"
      buttons={[
        {
          text: "수정",
          onPress: async () => {
            closeModal();
            router.push(`/upload?postId=${postId}`);
          },
        },
        {
          text: "삭제",
          onPress: async () => {
            openModal(<PostDeleteModal postId={postId} />);
          },
        },
      ]}
    />
  );
};
