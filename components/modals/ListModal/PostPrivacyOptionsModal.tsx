import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import { savePrivacy } from "@/hooks/useCheckPrivacy";
import useCheckPrivacy from "@/hooks/useCheckPrivacy";
import { useModal } from "@/hooks/useModal";
import { Platform, Text, TouchableOpacity, View } from "react-native";

export const PostPrivacyOptionsModal: React.FC = () => {
  const { closeModal } = useModal();
  const { privacy } = useCheckPrivacy();
  const bottomPadding = Platform.OS === "ios" ? "pb-[20px]" : "";

  const buttons = [
    {
      text: "전체글",
      value: "all" as const,
      onPress: async () => {
        await savePrivacy("all");
        closeModal();
      },
    },
    {
      text: "친구글",
      value: "friend" as const,
      onPress: async () => {
        await savePrivacy("friend");
        closeModal();
      },
    },
  ];

  return (
    <View className={`items-center rounded-t-[10px] bg-white ${bottomPadding}`}>
      {buttons.map((buttonItem, idx) => {
        const isNotLast = idx !== buttons.length - 1;
        const dividerClass = isNotLast ? "border-gray-20 border-b" : "";
        const isSelected = privacy === buttonItem.value;
        const textColor = isSelected ? "text-primary" : "text-gray-100";

        return (
          <TouchableOpacity
            key={buttonItem.text}
            className={`h-[82px] w-full flex-row items-center pr-[64px] pl-[48px] ${dividerClass}`}
            onPress={async () => {
              await buttonItem.onPress();
            }}
          >
            <View className="flex-1 flex-row items-center gap-[20px]">
              {buttonItem.value === "all" ? (
                <Icons.EarthIcon
                  width={24}
                  height={24}
                  color={isSelected ? colors.primary : colors.gray[100]}
                />
              ) : (
                <Icons.PeopleIcon
                  width={24}
                  height={24}
                  color={isSelected ? colors.primary : colors.gray[100]}
                />
              )}

              {/* 텍스트 */}
              <Text
                className={`flex-1 font-pbold text-[18px] leading-[150%] ${textColor}`}
              >
                {buttonItem.text}
              </Text>
            </View>

            {/* 체크 아이콘이 들어갈 공간 */}
            {isSelected && (
              <Icons.CheckBoldIcon
                width={24}
                height={24}
                color={colors.primary}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
