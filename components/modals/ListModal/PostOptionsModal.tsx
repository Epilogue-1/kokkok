import { useModal } from "@/hooks/useModal";
import { useRouter } from "expo-router";
import { ListModal } from ".";
import { PostDeleteModal } from "../DeleteModal/PostDeleteModal";

interface PostOptionsModalProps {
  postId: number;
}

export const PostOptionsModal: React.FC<PostOptionsModalProps> = ({
  postId,
}) => {
  const { openModal, closeModal } = useModal();
  const router = useRouter();

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
