import { Image, Text, TouchableOpacity, View } from "react-native";

import icons from "@/constants/icons";
import images from "@/constants/images";

// 추후 적당한 위치로 이동
const FIT_STATUS = {
  DONE: "운동함",
  REST: "쉬는 날",
} as const;
type StatusType = keyof typeof FIT_STATUS;

/* Interfaces */

interface FriendProfileProps {
  username: string;
  avatarUrl: string;
  description: string;
}

interface FriendItemProps extends FriendProfileProps {
  status?: StatusType;
}

/* SubComponent */

const FriendProfile = ({
  username,
  avatarUrl,
  description,
}: FriendProfileProps) => (
  <View className="flex-row gap-2">
    <Image
      src={avatarUrl}
      defaultSource={images.AvaTarDefault}
      style={{ width: 48, height: 48, borderRadius: 9999 }}
    />
    <View className="gap-[4px] w-[150px]">
      <Text className="title-4 text-gray-90 truncate">{username}</Text>
      <Text className="caption-3 text-gray-45 truncate">{description}</Text>
    </View>
  </View>
);

/* Components */

export function FriendItem({
  username,
  avatarUrl,
  description,
  status,
}: FriendItemProps) {
  return (
    <View className="py-4 border-b-[1px] border-gray-25 flex-row justify-between items-center">
      <FriendProfile
        username={username}
        avatarUrl={avatarUrl}
        description={description}
      />

      <TouchableOpacity
        className="bg-primary disabled:bg-gray-40 w-[89px] h-[36px] rounded-[10px] flex-row items-center justify-center"
        disabled={!!status}
      >
        {status === "DONE" ? (
          <View className="flex-row items-center justify-center">
            <Text className="body-5 text-white mr-[5px]">운동 완료</Text>
            <icons.FaceDoneIcon width={19} height={19} />
          </View>
        ) : status === "REST" ? (
          <View className="flex-row items-center justify-center">
            <Text className="body-5 text-white mr-[8px]">쉬는 중</Text>
            <icons.FaceRestIcon width={19} height={19} />
          </View>
        ) : (
          <Text className="body-5 text-white">👈 콕 찌르기</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export function FriendRequest({
  username,
  avatarUrl,
  description,
}: FriendProfileProps) {
  return (
    <View className="py-4 border-b-[1px] border-gray-25 flex-row justify-between items-center">
      <FriendProfile
        username={username}
        avatarUrl={avatarUrl}
        description={description}
      />

      <View className="flex-row gap-[11px]">
        <TouchableOpacity className="bg-primary px-[12px] py-[11px] rounded-[10px]">
          <Text className="caption-1 font-pmedium text-white">수락</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-white  px-[12px] py-[11px] rounded-[10px] border-primary border-[1px]">
          <Text className="caption-1 font-pmedium text-gray-90">거절</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
