import { showToast } from "@/components/ToastConfig";
import { useModal } from "@/hooks/useModal";
import { supabase, updatePushSetting } from "@/utils/supabase";
import { useMutation } from "@tanstack/react-query";
import { DoubleButtonModal } from ".";

export function LogoutModal() {
  const { closeModal } = useModal();

  const signOutMutation = useMutation({
    mutationFn: async () => {
      // 로그아웃 시 푸시 토큰 업데이트 후 로그아웃
      await updatePushSetting({ token: "logout" });
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      showToast("success", "로그아웃이 완료되었습니다!");
    },
    onError: () => {
      showToast("error", "로그아웃 도중 오류가 발생했습니다.");
    },
    onSettled: () => {
      closeModal();
    },
  });

  const handleSignOut = () => {
    if (signOutMutation.isPending) return;
    signOutMutation.mutate();
  };

  return (
    <DoubleButtonModal
      onClose={closeModal}
      contents={"이 계정에서\n로그아웃 하시겠어요?"}
      leftButtonText="취소"
      rightButtonText="로그아웃"
      onLeftButtonPress={closeModal}
      onRightButtonPress={handleSignOut}
      isLoading={signOutMutation.isPending}
      variant="danger"
    />
  );
}
