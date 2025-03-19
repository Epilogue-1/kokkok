import { useModal } from "@/hooks/useModal";
import { useRouter } from "expo-router";
import { SingleButtonModal } from ".";

export function ResetPasswordVerifyModal() {
  const { closeModal } = useModal();
  const router = useRouter();

  const handleConfirm = () => {
    closeModal();
    router.push("/password-reset/step2");
  };

  return (
    <SingleButtonModal
      onClose={handleConfirm}
      onPress={handleConfirm}
      emoji="HAPPY"
      contents={"이메일로 전송된\n인증 코드를 확인해주세요!"}
      buttonText="확인"
    />
  );
}
