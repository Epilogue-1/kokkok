import Icons from "@/constants/icons";
import { Text, TouchableOpacity, View } from "react-native";

type EmojiType = "SAD" | "HAPPY";

const EmojiIcons = {
  SAD: <Icons.FaceNotDoneIcon width={40} height={40} />,
  HAPPY: <Icons.FaceDoneIcon width={40} height={40} />,
};

export function SingleButtonModal({
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
        onTouchStart={(e) => e.stopPropagation()} // 부모 이벤트 버블링 차단
      >
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
