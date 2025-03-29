import { useModal } from "@/hooks/useModal";
import { useRouter } from "expo-router";
import { ListModal } from ".";

export const ProfileOptionsModal: React.FC = () => {
  const { closeModal } = useModal();
  const router = useRouter();

  return (
    <ListModal
      position="bottom"
      buttons={[
        {
          text: "수정하기",
          onPress: async () => {
            closeModal();
            router.push("/profile");
          },
        },
      ]}
    />
  );
};
