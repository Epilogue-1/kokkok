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
    <View className="mt-6 px-5">
      <View className="w-full flex-row justify-between pr-5">
        <View className="w-full flex-row items-center gap-6">
          <Image
            source={avatarUrl ? { uri: avatarUrl } : images.AvaTarDefault}
            className="size-[88px] rounded-full"
            accessibilityLabel="프로필 이미지"
            accessibilityRole="image"
            resizeMode="cover"
          />
          <Text
            className="title-3 flex-1"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {username}
          </Text>
        </View>
        <View>
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
      </View>

      <View className="mt-4 rounded-[10px] bg-[#f0f0f0] p-4">
        <Text className="body-5 text-gray-80">
          {description || "소개글을 입력해주세요"}
        </Text>
      </View>
    </View>
  );
}
