import { savePrivacy } from "@/hooks/useCheckPrivacy";
import { useModal } from "@/hooks/useModal";
import { ListModal } from ".";

export const PostPrivacyOptionsModal: React.FC = () => {
  const { closeModal } = useModal();

  return (
    <ListModal
      position="bottom"
      buttons={[
        {
          text: "전체 글",
          onPress: async () => {
            await savePrivacy("all");
            closeModal();
          },
        },
        {
          text: "친구 글",
          onPress: async () => {
            await savePrivacy("friend");
            closeModal();
          },
        },
      ]}
    />
  );
};
