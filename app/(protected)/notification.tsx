import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NotificationItem } from "@/components/NotificationItem";
import useFetchData from "@/hooks/useFetchData";

import ErrorScreen from "@/components/ErrorScreen";
import LoadingScreen from "@/components/LoadingScreen";
import type { NotificationResponse } from "@/types/Notification.interface";
import { getNotifications, updateNotificationCheck } from "@/utils/supabase";

export default function Notification() {
  const queryClient = useQueryClient();

  const {
    data: notifications,
    isLoading,
    error,
  } = useFetchData<NotificationResponse[]>(
    ["notification"],
    () => getNotifications(),
    "알림 조회에 실패했습니다.",
  );

  useFocusEffect(() => {
    // 알림 페이지 방문 시간 업데이트하고, 그에 따라 유저 알림 정보 다시 가져오도록 함
    const handleUpdate = async () => {
      try {
        await updateNotificationCheck();
        queryClient.invalidateQueries({
          queryKey: ["notificationCheckedAt"],
        });
      } catch (error) {
        console.error("알림 체크 업데이트 실패:", error);
      }
    };

    handleUpdate();
  });

  if (error) {
    return <ErrorScreen errorMessage={error.message} />;
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
        className="w-full grow px-7"
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
