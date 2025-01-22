import Icons from "@/constants/icons";
import { useModal } from "@/hooks/useModal";
import type { EmojiType } from "@/types/Modal.interface";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

/* -------------------------------------------------------------------------- */
/*                              Emoji Icon Map                                */
/* -------------------------------------------------------------------------- */
/**
 * 모달에 표시할 이모티콘(아이콘)을 매핑합니다.
 */
const EmojiIcons = {
  SAD: <Icons.FaceNotDoneIcon width={40} height={40} />,
  HAPPY: <Icons.FaceDoneIcon width={40} height={40} />,
};

/* -------------------------------------------------------------------------- */
/*                              OneButtonModal                                */
/* -------------------------------------------------------------------------- */
/**
 * @description
 * 한 개의 버튼만 있는 공통 모달 컴포넌트입니다.
 *
 * @param {() => void} onClose 모달 바깥 부분 or 취소 처리를 위한 함수
 * @param {() => void} onPress 버튼 클릭 시 실행할 함수
 * @param {string} contents 모달 내부에 표시할 문자열
 * @param {string} buttonText 버튼에 표시할 문자열
 * @param {EmojiType} [emoji] 아이콘을 표시할지 여부 ("SAD" / "HAPPY")
 */
export function OneButtonModal({
  onClose,
  onPress,
  contents,
  buttonText,
  emoji,
}: {
  onClose: () => void;
  onPress: () => void;
  contents: string;
  buttonText: string;
  emoji?: EmojiType;
}) {
  return (
    <View
      className="h-full items-center justify-center px-7"
      onTouchStart={onClose}
    >
      <View
        className="w-full items-center rounded-xl bg-white px-[55px] py-6"
        onTouchStart={(e) => e.stopPropagation()} // 부모의 onTouchStart로 이벤트 버블링 차단
      >
        {/* 이모지(아이콘)가 존재할 경우 표시 */}
        {emoji && EmojiIcons[emoji]}

        <Text className="title-3 mt-4 text-center text-gray-90">
          {contents}
        </Text>

        <TouchableOpacity
          onPress={onPress}
          className="mt-5 h-[52px] w-full flex-row items-center justify-center rounded-[8px] bg-primary"
        >
          <Text className="text-center font-pbold text-[17px] text-white leading-[150%]">
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                             EmailCheckModal                                */
/* -------------------------------------------------------------------------- */
/**
 * @description
 * 회원가입 시 이메일 인증을 위해 안내하는 모달입니다.
 */
export function EmailCheckModal() {
  const { closeModal } = useModal();
  const router = useRouter();

  const handleConfirm = () => {
    // 모달 닫기
    closeModal();
    // 회원가입 2단계 페이지 이동
    router.push("/sign-up/step2");
  };

  return (
    <OneButtonModal
      onClose={handleConfirm}
      onPress={handleConfirm}
      emoji="HAPPY"
      contents={"이메일로 전송된\n인증 코드를 확인해주세요!"}
      buttonText="확인"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                         PasswordResetCompleteModal                         */
/* -------------------------------------------------------------------------- */
/**
 * @description
 * 비밀번호 재설정 완료 안내 모달입니다.
 */
export function PasswordResetCompleteModal() {
  const { closeModal } = useModal();
  const router = useRouter();

  const handleConfirm = () => {
    closeModal();
    router.replace("/home");
  };

  return (
    <OneButtonModal
      onClose={handleConfirm}
      onPress={handleConfirm}
      emoji="HAPPY"
      contents={"비밀번호가 변경되었습니다"}
      buttonText="확인"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                           PostUploadFailModal                              */
/* -------------------------------------------------------------------------- */
/**
 * @description
 * 게시글 업로드 실패 시 사용자에게 재시도를 안내하는 모달입니다.
 */
export function PostUploadFailModal() {
  const { closeModal } = useModal();

  const handleClose = () => {
    closeModal();
  };

  return (
    <OneButtonModal
      key="upload-info-modal"
      emoji="SAD"
      contents={"업로드에 실패했습니다 \n다시한번 시도해주세요"}
      buttonText="확인"
      onClose={handleClose}
      onPress={handleClose}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                         PasswordResetEmailCheckModal                        */
/* -------------------------------------------------------------------------- */
/**
 * @description
 * 비밀번호 재설정 시 이메일 인증을 위해 안내하는 모달입니다.
 */
export function PasswordResetEmailCheckModal() {
  const { closeModal } = useModal();
  const router = useRouter();

  const handleConfirm = () => {
    closeModal();
    router.push("/password-reset/step2");
  };

  return (
    <OneButtonModal
      onClose={handleConfirm}
      onPress={handleConfirm}
      emoji="HAPPY"
      contents={"이메일로 전송된\n인증 코드를 확인해주세요!"}
      buttonText="확인"
    />
  );
}
