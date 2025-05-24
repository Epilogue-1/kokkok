import Icons from "@/constants/icons";
import type { JSX } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type EmojiType = "SAD" | "HAPPY";

const EmojiIcons: Record<EmojiType, JSX.Element> = {
  SAD: <Icons.FaceNotDoneIcon width={40} height={40} />,
  HAPPY: <Icons.FaceDoneIcon width={40} height={40} />,
};

export function DoubleButtonModal({
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
  // 왼쪽 버튼 스타일 (default / danger)
  const leftButtonStyle =
    variant === "danger"
      ? "h-full flex-1 items-center justify-center rounded-[8px] bg-gray-40"
      : "h-full flex-1 items-center justify-center rounded-[8px] border-2 border-primary bg-white";

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
        onTouchStart={(e) => e.stopPropagation()} // 모달 외부 터치 이벤트 차단
      >
        {emoji && EmojiIcons[emoji]}
        <Text className="title-3 mt-4 text-center text-gray-90">
          {contents}
        </Text>
        <View className="mt-5 h-[52px] w-full flex-row items-center gap-5">
          <TouchableOpacity
            onPress={onLeftButtonPress}
            className={leftButtonStyle}
            disabled={isLoading}
          >
            <Text className={leftButtonTextStyle}>{leftButtonText}</Text>
          </TouchableOpacity>
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
