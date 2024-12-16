import { Image, Text, TouchableWithoutFeedback, View } from "react-native";

import images from "@/constants/images";
import type { NotificationResponse } from "@/types/Notification.interface";
import { formMessage } from "@/utils/formMessage";
import { diffDate } from "@/utils/formatDate";
import { router } from "expo-router";

export function NotificationItem({
  from,
  type,
  data,
  createdAt,
}: NotificationResponse) {
  const diff = diffDate(new Date(createdAt));
  const message = formMessage({
    type,
    username: from.username,
    comment: data?.commentInfo?.content,
  });

  return (
    <TouchableWithoutFeedback
      onPress={() => data?.postId && router.push(`/post/${data?.postId}`)}
    >
      <View className="w-full py-4 border-b border-gray-25 flex-row justify-between items-center">
        <View className="flex-row gap-4">
          <Image
            source={
              from.avatarUrl ? { uri: from.avatarUrl } : images.AvaTarDefault
            }
            style={{ width: 48, height: 48, borderRadius: 9999 }}
          />

          <View className="gap-[4px] w-[198px]">
            <Text className="title-4 text-gray-90" numberOfLines={1}>
              {message.title}
            </Text>
            {type === "like" || type === "commentLike" ? (
              <Text className="title-4 text-gray-90" numberOfLines={1}>
                {message.content}
              </Text>
            ) : (
              <Text className="body-5 text-gray-45" numberOfLines={1}>
                {message.content}
              </Text>
            )}
          </View>
        </View>

        <Text className="caption-3 font-pmedium text-gray-50">{diff}</Text>
      </View>
    </TouchableWithoutFeedback>
  );
}
