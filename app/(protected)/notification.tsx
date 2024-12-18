import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NotificationItem } from "@/components/NotificationItem";
import useFetchData from "@/hooks/useFetchData";

import ErrorScreen from "@/components/ErrorScreen";
import LoadingScreen from "@/components/LoadingScreen";
import type { NotificationResponse } from "@/types/Notification.interface";
import {
  getCurrentSession,
  getNotifications,
  updateNotificationCheck,
} from "@/utils/supabase";

export default function Notification() {
  const queryClient = useQueryClient();

  const { data: session, error: userError } = useFetchData<Session>(
    ["session"],
    getCurrentSession,
    "로그인 정보 조회에 실패했습니다.",
  );

  const {
    data: notifications,
    isLoading,
    error: notificationError,
  } = useFetchData<NotificationResponse[]>(
    ["notification", session?.user.id],
    () => getNotifications(session?.user.id || ""),
    "알림 조회에 실패했습니다.",
    !!session?.user,
  );

  useFocusEffect(() => {
    if (!session) return;

    // 알림 페이지 방문 시간 업데이트하고, 그에 따라 유저 알림 정보 다시 가져오도록 함
    updateNotificationCheck(session.user.id);
    queryClient.invalidateQueries({
      queryKey: ["user", "notificationCheckedAt"],
    });
  });

  if (userError || notificationError) {
    const errorMessage =
      userError?.message ||
      notificationError?.message ||
      "알림 조회에 실패했습니다.";
    return <ErrorScreen errorMessage={errorMessage} />;
  }

  if (isLoading || !notifications) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-white">
      <FlatList
        data={notifications}
        keyExtractor={(notification) => String(notification.id)}
        renderItem={({ item: notification }) => (
          <NotificationItem {...notification} />
        )}
        className="w-full grow px-8"
        contentContainerStyle={notifications.length ? {} : { flex: 1 }}
        ListHeaderComponent={<View className="h-2" />}
        ListFooterComponent={<View className="h-[34px]" />}
        ListEmptyComponent={
          <ErrorScreen errorMessage="새로운 알림이 없습니다." />
        }
      />
    </SafeAreaView>
  );
}
