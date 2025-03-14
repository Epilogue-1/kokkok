import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import images from "@/constants/images";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ProfileSectionProps {
  username: string;
  avatarUrl?: string;
  description?: string;
  onSettingsPress: () => void;
}

export default function ProfileSection({
  username,
  avatarUrl,
  description,
  onSettingsPress,
}: ProfileSectionProps) {
  return (
    <>
      <View className="absolute h-[105px] w-full bg-primary" />
      <View className="mt-[98px] rounded-t-[3px] bg-white px-4">
        <View className="w-full justify-between">
          <Image
            source={avatarUrl ? { uri: avatarUrl } : images.AvaTarDefault}
            className="absolute top-[-44px] size-[88px] rounded-full border-[1.5px] border-white"
            accessibilityLabel="프로필 이미지"
            accessibilityRole="image"
            resizeMode="cover"
          />
          <View className="mt-[22px] flex-row justify-end gap-[24px]">
            <TouchableOpacity>
              <Text>친구 요청</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSettingsPress}
              accessibilityRole="button"
            >
              <Icons.MeatballIcon
                height={24}
                width={24}
                color={colors.gray[70]}
              />
            </TouchableOpacity>
          </View>
          <View className="mt-[13px] w-full flex-row items-center gap-6">
            <Text
              className="title-3 flex-1"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {username}
            </Text>
          </View>
        </View>

        <View className="mt-[12px] rounded-[10px] bg-gray-5 p-4">
          <Text className="body-5 text-gray-80">
            {description || "소개글을 입력해주세요"}
          </Text>
        </View>
      </View>
    </>
  );
}
