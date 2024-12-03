import { View, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FriendRequest } from "@/components/FriendItem";
import { getFriendRequests, getFriends } from "@/utils/supabase";
import useFetchData from "@/hooks/useFetchData";
import type { FriendResponse, RequestResponse } from "@/types/Friend.interface";

const OFFSET = 0;
const LIMIT = 12;

export default function Request() {
  const {
    data: friends,
    isLoading: isLoadingFriend,
    error: errorFriend,
  } = useFetchData<FriendResponse>(
    ["friends", OFFSET],
    () => getFriends({ offset: OFFSET, limit: LIMIT }),
    "친구 조회에 실패했습니다.",
  );

  const {
    data: requests,
    isLoading,
    error,
  } = useFetchData<RequestResponse>(
    ["friendRequests", OFFSET],
    () => getFriendRequests({ offset: OFFSET, limit: LIMIT }),
    "친구 요청 조회에 실패했습니다.",
  );

  // NOTE 추후 페이지 분리 및 개선할 예정
  if (error || errorFriend) {
    return (
      <SafeAreaView edges={[]} className="flex-1 bg-white">
        <View className="size-full justify-center items-center">
          <Text className="title-1">
            {error?.message || errorFriend?.message}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // NOTE 추후 페이지 분리 및 개선할 예정
  if (isLoading || isLoadingFriend || !requests || !friends) {
    return <SafeAreaView edges={[]} className="flex-1 bg-white" />;
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-white">
      <ScrollView className="px-8 grow w-full">
        {/* 상단에 패딩을 주면 일부 모바일에서 패딩만큼 끝이 잘려보여서 높이 조절을 위해 추가 */}
        <View className="h-2" />
        {requests.data.map((request) => (
          <FriendRequest key={request.requestId} {...request} />
        ))}
        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
