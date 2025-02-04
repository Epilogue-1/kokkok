import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import { useModal } from "@/hooks/useModal";
import type { EmojiType } from "@/types/Modal.interface";
import { deleteUser, supabase, updatePushSetting } from "@/utils/supabase";
import { showToast } from "../ToastConfig";

import Icons from "@/constants/icons";

/* -------------------------------------------------------------------------- */
/*                           이모티콘 맵 (EmojiIcons)                         */
/* -------------------------------------------------------------------------- */
const EmojiIcons = {
  SAD: <Icons.FaceNotDoneIcon width={40} height={40} />,
  HAPPY: <Icons.FaceDoneIcon width={40} height={40} />,
};

/* -------------------------------------------------------------------------- */
/*                           TwoButtonModal (기본 UI)                         */
/* -------------------------------------------------------------------------- */
/**
 * @description
 * - 이모티콘(이모지)
 * - 메시지(내용)
 * - 왼/오른쪽 버튼
 *
 * 두 개의 버튼으로 구성된 모달 컴포넌트입니다.
 */
export function TwoButtonModal({
  onClose,
  emoji,
  contents,
  leftButtonText,
  rightButtonText,
  onLeftButtonPress,
  onRightButtonPress,
  isLoading,
  variant = "default",
}: {
  onClose: () => void;
  emoji?: EmojiType;
  contents: string;
  leftButtonText: string;
  rightButtonText: string;
  onLeftButtonPress: () => void;
  onRightButtonPress: () => void;
  isLoading?: boolean;
  variant?: "default" | "danger";
}) {
  /**
   * 왼쪽 버튼 스타일(기본/위험)
   */
  const leftButtonStyle =
    variant === "danger"
      ? "h-full flex-1 items-center justify-center rounded-[8px] bg-gray-40"
      : "h-full flex-1 items-center justify-center rounded-[8px] border-2 border-primary bg-white";

  /**
   * 왼쪽 버튼 텍스트(기본/위험)
   */
  const leftButtonTextStyle =
    variant === "danger"
      ? "font-pbold text-[17px] text-white leading-[150%]"
      : "font-pbold text-[17px] text-primary leading-[150%]";

  return (
    <View
      className="h-full items-center justify-center px-7"
      onTouchStart={onClose}
    >
      <View
        className="items-center rounded-xl bg-white px-7 py-6"
        onTouchStart={(e) => e.stopPropagation()} // 모달 밖 이벤트 막기
      >
        {/* 이모지 아이콘 표시 */}
        {emoji && EmojiIcons[emoji]}

        {/* 모달 내용 */}
        <Text className="title-3 mt-4 text-center text-gray-90">
          {contents}
        </Text>

        {/* 버튼 영역 */}
        <View className="mt-5 h-[52px] w-full flex-row items-center gap-5">
          {/* 왼쪽 버튼 (취소/뒤로/등) */}
          <TouchableOpacity
            onPress={onLeftButtonPress}
            className={leftButtonStyle}
            disabled={isLoading}
          >
            <Text className={leftButtonTextStyle}>{leftButtonText}</Text>
          </TouchableOpacity>

          {/* 오른쪽 버튼 (확인/탈퇴/로그아웃/등) */}
          <TouchableOpacity
            onPress={onRightButtonPress}
            className="h-full flex-1 items-center justify-center rounded-[8px] bg-primary"
            disabled={isLoading}
          >
            <Text className="font-pbold text-[17px] text-white leading-[150%]">
              {rightButtonText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                             PostNotFoundModal                              */
/* -------------------------------------------------------------------------- */
/**
 * @description
 * 게시글이 이미 삭제되었거나 찾을 수 없을 때 사용자에게 안내하는 모달
 * - 뒤로가기 / 홈으로
 */
export function PostNotFoundModal() {
  const { closeModal } = useModal();
  const router = useRouter();

  const handleBack = () => {
    closeModal();
    router.back();
  };

  const handleGoHome = () => {
    closeModal();
    router.replace("/home");
  };

  return (
    <TwoButtonModal
      onClose={handleBack}
      emoji="SAD"
      contents="게시글이 삭제되었어요."
      leftButtonText="뒤로가기"
      rightButtonText="홈으로"
      onLeftButtonPress={handleBack}
      onRightButtonPress={handleGoHome}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                           AccountDeleteModal                               */
/* -------------------------------------------------------------------------- */
/**
 * @description
 * 계정 탈퇴를 최종 확인하는 모달
 * - 취소 / 탈퇴
 */
export function AccountDeleteModal() {
  const { closeModal } = useModal();

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      // 탈퇴 후 로그아웃
      await supabase.auth.signOut();
      closeModal();
    },
    onError: () => {
      showToast("error", "탈퇴 도중 오류가 발생했습니다.");
    },
  });

  // 계정 탈퇴 핸들러
  const handleDeleteAccount = () => {
    if (deleteUserMutation.isPending) return;
    deleteUserMutation.mutate();
  };

  return (
    <TwoButtonModal
      onClose={closeModal}
      emoji="SAD"
      contents={"탈퇴하면 되돌릴 수 없어요\n그래도 탈퇴하시겠어요?"}
      leftButtonText="취소"
      rightButtonText="탈퇴"
      onLeftButtonPress={closeModal}
      onRightButtonPress={handleDeleteAccount}
      isLoading={deleteUserMutation.isPending}
      variant="danger"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                             SignOutModal                                   */
/* -------------------------------------------------------------------------- */
/**
 * @description
 * 사용자에게 로그아웃을 최종 확인하는 모달
 * - 취소 / 로그아웃
 */
export function SignOutModal() {
  const { closeModal } = useModal();

  const signOutMutation = useMutation({
    mutationFn: async () => {
      // 로그아웃 시 푸시 토큰 삭제
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
      // 무조건 모달 닫기
      closeModal();
    },
  });

  // 로그아웃 핸들러
  const handleSignOut = () => {
    if (signOutMutation.isPending) return;
    signOutMutation.mutate();
  };

  return (
    <TwoButtonModal
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
