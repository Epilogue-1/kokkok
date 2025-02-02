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
          className="mb-4 gap-[13px] pb-[16px]"
          aria-hidden={true}
        >
          {/* header */}
          <View className="flex-row items-center justify-between gap-[8px]">
            <Skeleton width={48} height={48} circle />

            <View className="flex-1 items-start gap-2">
              <Skeleton width={64} height={16} />
              <Skeleton width={42} height={13} />
            </View>

            <Skeleton width={28} height={28} circle />
          </View>

          {/* contents */}
          <Skeleton width="100%" height={18} />

          {/* reply button */}
          <Skeleton width={42} height={14} />
        </View>
      ))}
    </>
  );
}
