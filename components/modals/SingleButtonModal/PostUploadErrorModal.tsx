import { useModal } from "@/hooks/useModal";
import { SingleButtonModal } from ".";

export function PostUploadErrorModal() {
  const { closeModal } = useModal();

  const handleClose = () => {
    closeModal();
  };

  return (
    <SingleButtonModal
      key="upload-info-modal"
      emoji="SAD"
      contents={"업로드에 실패했습니다 \n다시한번 시도해주세요"}
      buttonText="확인"
      onClose={handleClose}
      onPress={handleClose}
    />
  );
}
