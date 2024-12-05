import { Image, Text, TouchableOpacity, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import icons from "@/constants/icons";
import images from "@/constants/images";
import {
  createFriendRequest,
  createNotification,
  deleteFriendRequest,
  getCurrentUser,
  putFriendRequest,
} from "@/utils/supabase";
import type { User, UserProfile } from "@/types/User.interface";
import useFetchData from "@/hooks/useFetchData";
import { showToast } from "./ToastConfig";
import { NOTIFICATION_TYPE } from "@/types/Notification.interface";

/* Interfaces */

interface FriendProfileProps {
  username: string;
  avatarUrl: string;
  description: string;
}

interface FriendItemProps {
  friend: UserProfile;
}

interface FriendRequestProps {
  requestId: string;
  toUserId: string;
  fromUser: UserProfile;
  isLoading: boolean;
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
      <Text className="title-4 text-gray-90" numberOfLines={1}>
        {username}
      </Text>
      <Text className="caption-3 text-gray-45" numberOfLines={1}>
        {description}
      </Text>
    </View>
  </View>
);

/* Components */

export function FriendItem({ friend }: FriendItemProps) {
  // 로그인한 유저 정보 조회
  const { data: user, error: userError } = useFetchData<User>(
    ["currentUser"],
    getCurrentUser,
    "로그인 정보 조회에 실패했습니다.",
  );

  // 친구 콕 찌르기
  const { mutate: handlePoke } = useMutation({
    mutationFn: async () => {
      await createNotification({
        from: user?.id || "",
        to: friend.id,
        type: NOTIFICATION_TYPE.POKE,
      });
    },
    onSuccess: () => {
      // TODO 1시간 제한 추가
      showToast("success", `👈 ${friend.username}님을 콕! 찔렀어요`);
    },
    onError: (error) => {
      console.error("콕 찌르기 실패:", error);
      showToast("fail", "콕 찌르기에 실패했어요!");
    },
  });

  return (
    <View className="py-4 px-2 border-b-[1px] border-gray-25 flex-row justify-between items-center">
      <FriendProfile {...friend} />

      <TouchableOpacity
        className={`${!friend.status ? "bg-primary" : "bg-gray-40"} w-[89px] h-[36px] rounded-[10px] flex-row items-center justify-center`}
        disabled={!!friend.status}
        accessibilityLabel="친구 찌르기"
        accessibilityHint="이 버튼을 누르면 친구에게 찌르기 알람을 보냅니다"
        onPress={() => handlePoke()}
      >
        {friend.status === "done" ? (
          <View className="flex-row items-center justify-center">
            <Text className="body-5 text-white mr-[5px]">운동 완료</Text>
            <icons.FaceDoneIcon width={19} height={19} />
          </View>
        ) : friend.status === "rest" ? (
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
  requestId,
  toUserId,
  fromUser,
  isLoading,
}: FriendRequestProps) {
  const queryClient = useQueryClient();

  // 친구 요청 수락
  const { mutate: handleAccept, isPending: isAcceptPending } = useMutation({
    mutationFn: async () => {
      await Promise.all([
        putFriendRequest(requestId, true),
        createFriendRequest(toUserId, fromUser.id, true),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: (error) => {
      console.error("친구 요청 수락 실패:", error);
      showToast("fail", "요청 수락에 실패했어요!");
    },
  });

  // 친구 요청 거절
  const { mutate: handleRefuse, isPending: isRefusePending } = useMutation({
    mutationFn: async () => {
      await deleteFriendRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
    onError: (error) => {
      console.error("친구 요청 거절 실패:", error);
      showToast("fail", "요청 거절에 실패했어요!");
    },
  });

  return (
    <View className="py-4 border-b-[1px] border-gray-25 flex-row justify-between items-center">
      <FriendProfile {...fromUser} />

      <View className="flex-row gap-[11px]">
        <TouchableOpacity
          className="bg-primary px-[12px] py-[11px] rounded-[10px]"
          onPress={() => handleAccept()}
          disabled={isAcceptPending || isRefusePending || isLoading}
          accessibilityLabel="친구 요청 수락"
          accessibilityHint="이 버튼을 누르면 친구 요청을 수락합니다"
        >
          <Text className="caption-1 font-pmedium text-white">수락</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white  px-[12px] py-[11px] rounded-[10px] border-primary border-[1px]"
          onPress={() => handleRefuse()}
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
