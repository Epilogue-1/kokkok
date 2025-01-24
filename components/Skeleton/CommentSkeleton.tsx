import { View } from "react-native";

export default function CommentSkeleton() {
  return (
    <View className="mb-4 animate-pulse">
      {/* header */}
      <View className="flex-row items-center justify-between pb-[13px]">
        <View className="flex-1 flex-row items-center gap-2">
          <View className="size-12 rounded-full bg-gray-25" />
          <View className="max-w-[80%] gap-1">
            <View className="h-[16px] w-20 rounded-md bg-gray-25" />
            <View className="h-[10px] w-12 rounded-md bg-gray-25" />
          </View>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="size-6 rounded-full bg-gray-25" />
          <View className="size-6 rounded-full bg-gray-25" />
        </View>
      </View>

      {/* contents */}
      <View className="pb-[13px]">
        <View className="h-[18px] w-[90%] rounded-md bg-gray-25" />
      </View>

      {/* reply button */}
      <View className="pb-[5px]">
        <View className="h-[14px] w-16 rounded-md bg-gray-25" />
      </View>
    </View>
  );
}
