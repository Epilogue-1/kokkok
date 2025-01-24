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
    <View className="relative bg-primary">
      <Image
        source={avatarUrl ? { uri: avatarUrl } : images.AvaTarDefault}
        className="absolute top-[52px] left-[16px] z-10 size-[100px] rounded-full border-[1.5px] border-white"
        accessibilityLabel="프로필 이미지"
        accessibilityRole="image"
        resizeMode="cover"
      />
      <View className="mt-[98px] rounded-t-[3px] bg-white px-4">
        <View className="mt-[22px] w-full flex-row justify-end">
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
        <View className="mt-[22px] w-full flex-row items-center gap-6">
          <Text
            className="title-3 flex-1"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {username}
          </Text>
        </View>
        <View className="mt-[8px] mb-[25px]">
          <Text className="body-5 text-gray-80">{description}</Text>
        </View>
      </View>
    </View>
  );
}
