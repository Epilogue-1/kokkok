import { View } from "react-native";
import Skeleton from "./Skeleton";

export default function CalendarSkeleton() {
  return (
    <View className="mt-[24px] w-full gap-[10px] px-[3px]">
      <Skeleton height={15} />
      {Array.from({ length: 5 }, (_, rowIndex) => (
        <View
          className="gap-[12px]"
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          key={`calendar-skeleton-${rowIndex}`}
        >
          <Skeleton height={10} />
          <View className="flex-row justify-between">
            <Skeleton width={30} height={30} circle count={7} />
          </View>
        </View>
      ))}
    </View>
  );
}
