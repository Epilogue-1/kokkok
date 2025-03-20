import { showToast } from "@/components/ToastConfig";
import { useModal } from "@/hooks/useModal";
import { blockUser } from "@/utils/supabase";
import { useMutation } from "@tanstack/react-query";
import { DoubleButtonModal } from ".";

export function UserBlockModal({ blockedId }: { blockedId: string }) {
  const { closeModal } = useModal();

  const userBlockMutation = useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      closeModal();
      showToast("success", "사용자를 차단했습니다.");
    },
    onError: () => {
      showToast("fail", "사용자 차단에 실패 했습니다.");
    },
  });

  const handleCancel = () => {
    closeModal();
  };

  const handleBlock = () => {
    if (!blockedId || userBlockMutation.isPending) return;

    userBlockMutation.mutate(blockedId);
  };

  return (
    <DoubleButtonModal
      onClose={handleCancel}
      contents="사용자를 차단하시겠습니까?"
      leftButtonText="취소"
      rightButtonText="차단"
      onLeftButtonPress={handleCancel}
      onRightButtonPress={handleBlock}
      variant="danger"
    />
  );
}
