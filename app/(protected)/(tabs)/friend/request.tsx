import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ErrorScreen from "@/components/ErrorScreen";
import { FriendRequest } from "@/components/FriendItem";
import LoadingScreen from "@/components/LoadingScreen";
import colors from "@/constants/colors";
import useInfiniteLoad from "@/hooks/useInfiniteLoad";
import {
  getFriendRequests,
  subscribeFriendRequest,
  supabase,
} from "@/utils/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";

const LIMIT = 12;

export default function Request() {
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  // 유저의 친구 요청 정보 조회
  const {
    data: requestData,
    isLoading,
    isFetchingNextPage,
    error,
    loadMore,
    refetch,
  } = useInfiniteLoad({
    queryFn: getFriendRequests,
    queryKey: ["friendRequests"],
    limit: LIMIT,
  });
  const hasRequests = !!requestData?.pages[0].total;

  // 친구 요청창에 focus 들어올 때마다 친구목록 새로고침
  useFocusEffect(
    useCallback(() => {
      if (!isFetchingNextPage) {
        queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      }
    }, [isFetchingNextPage, queryClient]),
  );

  // 친구 요청이 추가되면 쿼리 다시 패치하도록 정보 구독
  useEffect(() => {
    let requestChannel: RealtimeChannel;

    const handleSubscribe = async () => {
      requestChannel = await subscribeFriendRequest((payload) => {
        if (!payload.new.isAccepted)
          queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      });
    };

    handleSubscribe();

    return () => {
      supabase.removeChannel(requestChannel);
    };
  }, [queryClient.invalidateQueries]);

  const handleScrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    refetch();
  }, [refetch]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "SCROLL_REQUEST_TO_TOP",
      handleScrollToTop,
    );

    return () => subscription.remove();
  }, [handleScrollToTop]);

  // 에러 스크린
  if (error) {
    return <ErrorScreen errorMessage={error.message} />;
  }

  // 로딩 스크린
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-white">
      <FlatList
        ref={flatListRef}
        className="w-full grow px-8"
        data={hasRequests ? requestData.pages.flatMap((page) => page.data) : []}
        keyExtractor={(request) => String(request.requestId)}
        renderItem={({ item: request }) => (
          <FriendRequest {...request} isLoading={isLoading} />
        )}
        onEndReached={loadMore}
        contentContainerStyle={hasRequests ? {} : { flex: 1 }}
        ListHeaderComponent={<View className="h-2" />}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              size="large"
              className="py-4"
              color={colors.primary}
            />
          ) : (
            <View className="h-4" />
          )
        }
        ListEmptyComponent={
          <ErrorScreen errorMessage="친구 요청이 없습니다." />
        }
      />
    </SafeAreaView>
  );
}
