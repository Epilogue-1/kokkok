import { View } from "react-native";
import Skeleton from "./Skeleton";

interface CommentSkeletonProps {
  count?: number;
}

export default function CommentSkeleton({ count = 1 }: CommentSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={`comment-skeleton-${index}of${count}`}
          className="mb-[16px] gap-[16px] pb-[16px]"
          aria-hidden={true}
        >
          {/* header */}
          <View className="flex-row items-center justify-between gap-[8px]">
            <Skeleton width={32} height={32} circle />

            <View className="flex-1 items-start gap-2">
              <Skeleton width={64} height={16} />
              <Skeleton width={42} height={13} />
            </View>

            <View className="flex-row items-center gap-[16px]">
              <Skeleton width={24} height={24} circle />
              <View className="h-[24px] w-[24px] items-center justify-center">
                <Skeleton width={5} height={20} />
              </View>
            </View>
          </View>

          {/* contents */}
          <View className="gap-[13px]">
            <Skeleton width="92%" height={18} />
            <Skeleton width={42} height={14} />
          </View>
        </View>
      ))}
    </>
  );
}
