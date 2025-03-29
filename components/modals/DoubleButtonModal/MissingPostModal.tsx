import { useModal } from "@/hooks/useModal";
import { useRouter } from "expo-router";
import { DoubleButtonModal } from ".";

export function MissingPostModal() {
  const { closeModal } = useModal();
  const router = useRouter();

  const handleBack = () => {
    closeModal();
    router.back();
  };

  const handleHome = () => {
    closeModal();
    router.replace("/home");
  };

  return (
    <DoubleButtonModal
      onClose={handleBack}
      emoji="SAD"
      contents="게시글이 삭제되었어요."
      leftButtonText="뒤로가기"
      rightButtonText="홈으로"
      onLeftButtonPress={handleBack}
      onRightButtonPress={handleHome}
    />
  );
}
