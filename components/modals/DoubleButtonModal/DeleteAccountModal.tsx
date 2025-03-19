import { showToast } from "@/components/ToastConfig";
import { useModal } from "@/hooks/useModal";
import { deleteUser, supabase } from "@/utils/supabase";
import { useMutation } from "@tanstack/react-query";
import { DoubleButtonModal } from ".";

export function DeleteAccountModal() {
  const { closeModal } = useModal();

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      // 탈퇴 후 로그아웃 처리
      await supabase.auth.signOut();
      closeModal();
    },
    onError: () => {
      showToast("error", "탈퇴 도중 오류가 발생했습니다.");
    },
  });

  const handleDelete = () => {
    if (deleteUserMutation.isPending) return;
    deleteUserMutation.mutate();
  };

  return (
    <DoubleButtonModal
      onClose={closeModal}
      emoji="SAD"
      contents={"탈퇴하면 되돌릴 수 없어요\n그래도 탈퇴하시겠어요?"}
      leftButtonText="취소"
      rightButtonText="탈퇴"
      onLeftButtonPress={closeModal}
      onRightButtonPress={handleDelete}
      isLoading={deleteUserMutation.isPending}
      variant="danger"
    />
  );
}
