import { useModal } from "@/hooks/useModal";
import { useRouter } from "expo-router";
import { SingleButtonModal } from ".";

export function ResetPasswordSuccessModal() {
  const { closeModal } = useModal();
  const router = useRouter();

  const handleConfirm = () => {
    closeModal();
    router.replace("/home");
  };

  return (
    <SingleButtonModal
      onClose={handleConfirm}
      onPress={handleConfirm}
      emoji="HAPPY"
      contents={"비밀번호가 변경되었습니다"}
      buttonText="확인"
    />
  );
}
