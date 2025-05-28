import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

import colors from "@/constants/colors";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { POKE_TIME } from "@/constants/time";
import useFetchData from "@/hooks/useFetchData";
import useManageFriend from "@/hooks/useManageFriend";
import { useTimerWithStartAndDuration } from "@/hooks/useTimer";
import type { UserProfile } from "@/types/User.interface";
import { formatTime } from "@/utils/formatTime";
import { getLatestStabForFriend } from "@/utils/supabase";

/* Interfaces */

interface FriendItemProps {
  friend: UserProfile;
}

interface NonFriendItemProps {
  user: UserProfile;
}

interface FriendRequestProps {
  requestId: number;
  toUser: UserProfile;
  fromUser: UserProfile;
  isLoading: boolean;
}

/* SubComponent */

const FriendProfile = ({
  id,
  username,
  avatarUrl,
  description,
}: UserProfile) => {
  return (
    <Link className="grow" href={`/user/${id}`}>
      <View className="flex-row gap-[12px]">
        <Image
          source={avatarUrl ? { uri: avatarUrl } : images.AvaTarDefault}
          style={{ width: 48, height: 48, borderRadius: 9999 }}
        />

        <View className={`w-[140px] ${description ? "gap-[4px]" : "mt-3"}`}>
          <Text className="title-5" numberOfLines={1}>
            {username}
          </Text>
          {description && (
            <Text className="caption-2" numberOfLines={1}>
              {description}
            </Text>
          )}
        </View>
      </View>
    </Link>
  );
};

/* Components */

export function FriendItem({ friend }: FriendItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: lastPokeCreatedAt } = useFetchData<string>(
    ["poke", friend.id],
    () => getLatestStabForFriend(friend.id),
    "찌르기 정보 조회에 실패했습니다.",
  );

  const { timeLeft, start: timerStart } = useTimerWithStartAndDuration();
  const isPokeDisable = !!friend.status || !!timeLeft || isProcessing;

  const { usePoke } = useManageFriend();
  const { mutate: handlePoke } = usePoke({
    onError: () => setIsProcessing(false),
  });

  useEffect(() => {
    if (lastPokeCreatedAt) {
      timerStart(Date.parse(lastPokeCreatedAt), POKE_TIME);
      setIsProcessing(false);
    }
  }, [lastPokeCreatedAt, timerStart]);

  return (
    <View className="flex-row items-center border-gray-20 border-b-[1px] py-4">
      <TouchableOpacity className="mr-[10px] h-[32px] w-[32px] items-start justify-center pl-[4px]">
        {/* <icons.StarFilledIcon width={20} height={20} color="#FFE818" /> */}
        <icons.StarIcon width={20} height={20} color={colors.gray[60]} />
      </TouchableOpacity>

      <FriendProfile {...friend} />

      <TouchableOpacity
        className={`${isPokeDisable ? "bg-gray-40" : "bg-primary"} h-[36px] w-[84px] flex-row items-center justify-center rounded-[10px]`}
        disabled={isPokeDisable}
        accessibilityLabel="친구 찌르기"
        accessibilityHint="이 버튼을 누르면 친구에게 찌르기 알람을 보냅니다"
        onPress={() => {
          setIsProcessing(true);
          handlePoke({ friend });
        }}
      >
        {friend.status === "done" ? (
          <View className="flex-row items-center justify-center">
            <Text className="caption-2 mr-[5px] text-white">운동 완료</Text>
            <icons.FaceDoneIcon width={19} height={19} />
          </View>
        ) : friend.status === "rest" ? (
          <View className="flex-row items-center justify-center">
            <Text className="caption-2 mr-[8px] text-white">쉬는 중</Text>
            <icons.FaceRestIcon width={19} height={19} />
          </View>
        ) : (
          <Text className="caption-2 text-white">
            {!timeLeft ? "👈 콕 찌르기" : formatTime(timeLeft)}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export function NonFriendItem({ user }: NonFriendItemProps) {
  const { useCreateRequest } = useManageFriend();
  const { mutate: handleCreateRequest, isPending: isCreatePending } =
    useCreateRequest();

  return (
    <View className="flex-row items-center justify-between border-gray-20 border-b-[1px] py-4">
      <FriendProfile {...user} />

      <TouchableOpacity
        className="h-[36px] w-[84px] items-center justify-center rounded-[10px] bg-primary"
        disabled={isCreatePending}
        accessibilityLabel="친구 요청"
        accessibilityHint="이 버튼을 누르면 친구 요청을 보냅니다"
        onPress={() => handleCreateRequest({ toUserId: user.id })}
      >
        <Text className="caption-2 text-white">친구 요청</Text>
      </TouchableOpacity>
    </View>
  );
}

export function FriendRequest({
  requestId,
  toUser,
  fromUser,
  isLoading,
}: FriendRequestProps) {
  const { useAcceptRequest, useRefuseRequest } = useManageFriend();
  const { mutate: handleAccept, isPending: isAcceptPending } =
    useAcceptRequest();
  const { mutate: handleRefuse, isPending: isRefusePending } =
    useRefuseRequest();

  return (
    <View className="flex-row items-center justify-between border-gray-20 border-b-[1px] py-4">
      <FriendProfile {...fromUser} />

      <View className="flex-row gap-[12px]">
        <TouchableOpacity
          className="rounded-[10px] bg-primary px-[12px] py-[11px]"
          onPress={() => handleAccept({ requestId, fromUserId: fromUser.id })}
          disabled={isAcceptPending || isRefusePending || isLoading}
          accessibilityLabel="친구 요청 수락"
          accessibilityHint="이 버튼을 누르면 친구 요청을 수락합니다"
        >
          <Text className="caption-1 font-pmedium text-white">수락</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="rounded-[10px] border-[1px] border-primary bg-white px-[12px] py-[11px]"
          onPress={() =>
            handleRefuse({
              requestId,
              fromUserId: fromUser.id,
            })
          }
          disabled={isAcceptPending || isRefusePending || isLoading}
          accessibilityLabel="친구 요청 거절"
          accessibilityHint="이 버튼을 누르면 친구 요청을 거절합니다"
        >
          <Text className="caption-1 font-pmedium text-gray-90">거절</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
