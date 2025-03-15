import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import images from "@/constants/images";
import useFetchData from "@/hooks/useFetchData";
import useManageFriend from "@/hooks/useManageFriend";
import { getRelationship } from "@/utils/supabase";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ProfileSectionProps {
  userId?: string | string[];
  username: string;
  avatarUrl?: string;
  description?: string;
  onSettingsPress: () => void;
}

export default function ProfileSection({
  userId,
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
            className="absolute top-[-50px] z-50 size-[100px] rounded-full border-[1.5px] border-white"
            accessibilityLabel="프로필 이미지"
            accessibilityRole="image"
            resizeMode="cover"
          />
          <View className="mt-[22px] flex-row items-center justify-end gap-[24px]">
            {userId && <FriendRequest userId={userId} />}
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

        <View className="mt-[12px]">
          {description ? (
            <Text className="body-5 rounded-[10px] bg-gray-5 p-4 text-gray-80">
              {description}
            </Text>
          ) : (
            <View className="mt-[20px]" />
          )}
        </View>
      </View>
    </>
  );
}

export function FriendRequest({ userId }: { userId: string | string[] }) {
  const { useCreateRequest, useUnfriend, useCancelRequest } = useManageFriend();
  const { data: relation, isPending: isRelationPending } = useFetchData(
    ["relation", userId],
    () => getRelationship(userId as string),
    "친구 정보를 불러올 수 없습니다.",
  );

  const { mutate: handleCreateRequest, isPending: isCreatePending } =
    useCreateRequest();
  const { mutate: handleUnfriend, isPending: isUnfriendPending } =
    useUnfriend();
  const { mutate: handleCancelRequest, isPending: isCancelPending } =
    useCancelRequest();

  // 관계 정보가 로딩 중이면 로딩 상태 표시
  if (isRelationPending) {
    return (
      <View className="h-[36px] w-[89px] items-center justify-center rounded-[10px] bg-gray-40">
        <Text className="body-5 text-white">로딩 중...</Text>
      </View>
    );
  }

  // 관계 상태에 따라 다른 UI와 기능 제공
  switch (relation) {
    // 친구가 아닌 경우: 친구 요청 버튼
    case "none":
      return (
        <TouchableOpacity
          className="h-[36px] w-[113px] flex-row items-center justify-center gap-1 rounded-[8px] border border-gray-80"
          disabled={isCreatePending}
          accessibilityLabel="친구 요청"
          accessibilityHint="이 버튼을 누르면 친구 요청을 보냅니다"
          onPress={() => handleCreateRequest({ toUserId: userId as string })}
        >
          <Icons.FriendAddIcon width={16} height={16} />
          <Text className="body-5 text-gray-90">친구 요청</Text>
        </TouchableOpacity>
      );

    // 내가 친구 요청을 보낸 경우: 요청 중 버튼 (취소 가능)
    case "asking":
      return (
        <TouchableOpacity
          className="h-[36px] w-[113px] flex-row items-center justify-center gap-1 rounded-[8px] border border-gray-80"
          disabled={isCancelPending}
          accessibilityLabel="친구 요청 취소"
          accessibilityHint="이 버튼을 누르면 보낸 친구 요청을 취소합니다"
          onPress={() => handleCancelRequest({ toUserId: userId as string })}
        >
          <Icons.FriendSendingIcon width={16} height={16} />
          <Text className="body-5 text-gray-90">친구 요청 중</Text>
        </TouchableOpacity>
      );

    // 이미 친구인 경우: 친구 끊기 버튼
    case "friend":
      return (
        <TouchableOpacity
          className="h-[36px] w-[113px] flex-row items-center justify-center gap-1 rounded-[8px] border border-gray-80"
          disabled={isUnfriendPending}
          accessibilityLabel="친구 삭제"
          accessibilityHint="이 버튼을 누르면 친구 관계를 끊습니다"
          onPress={() => handleUnfriend({ toUserId: userId as string })}
        >
          <Icons.FriendDeleteIcon width={16} height={16} />
          <Text className="body-5 text-gray-90">친구 삭제</Text>
        </TouchableOpacity>
      );

    default:
      return null;
  }
}
