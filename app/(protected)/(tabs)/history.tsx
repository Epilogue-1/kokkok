import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
  View,
} from "react-native";

import CalendarNavigator from "@/components/CalendarNavigator";
import { Skeleton } from "@/components/Skeleton";
import WorkoutCalendar from "@/components/WorkoutCalendar";
import RestDayModal from "@/components/modals/RestDayModal";
import icons from "@/constants/icons";
import useCalendar from "@/hooks/useCalendar";
import useFetchData from "@/hooks/useFetchData";
import { useModal } from "@/hooks/useModal";
import { getCurrentUser, getHistories } from "@/utils/supabase";

type History = Awaited<ReturnType<typeof getHistories>>[number];

export default function History() {
  const {
    date,
    year,
    month,
    currentYear,
    currentMonth,
    changeMonth,
    resetDate,
  } = useCalendar();
  const { openModal } = useModal();

  const {
    data: histories = [],
    isLoading: isHistoriesLoading,
    refetch,
  } = useFetchData(
    ["histories", year, month],
    () => getHistories(year, month),
    "사용자의 기록을 불러올 수 없습니다.",
  );

  const { data: currentUser, isLoading: isUserLoading } = useFetchData(
    ["currentUser"],
    getCurrentUser,
    "현재 사용자를 불러올 수 없습니다.",
  );

  const isLoading = isUserLoading || isHistoriesLoading;

  const userCreatedDate = currentUser
    ? new Date(currentUser.createdAt)
    : new Date(2025, 0, 1, 0, 0, 0);

  const handlePreviousMonth = () => {
    changeMonth(-1);
  };
  const handleNextMonth = () => {
    changeMonth(1);
  };

  useFocusEffect(
    useCallback(() => {
      resetDate();
      refetch();
    }, [refetch, resetDate]),
  );

  const workoutDays = histories.filter(
    (item) =>
      new Date(item.date).getMonth() + 1 === month && item.status === "done",
  ).length;

  return (
    <ScrollView className="flex-1 bg-gray-5 px-[24px] pt-[18px]">
      <View className="flex-row items-center">
        {isLoading ? (
          <Skeleton className="mr-auto" width={180} height={20} />
        ) : (
          <Text className="heading-2 grow">
            {month}월은 <Text className="text-primary">{workoutDays}</Text>일
            운동 완료!
          </Text>
        )}

        <SetRestDayButton
          onPress={() => {
            openModal(<RestDayModal />, "bottom");
          }}
        />
      </View>

      <View className="mt-[20px] min-h-[300px] items-center rounded-[10px] border border-gray-10 bg-white px-[24px] pt-[16px] pb-[32px]">
        <CalendarNavigator
          date={date}
          onPrevious={handlePreviousMonth}
          onNext={handleNextMonth}
          isPreviousDisabled={
            year < userCreatedDate.getFullYear() ||
            (year === userCreatedDate.getFullYear() &&
              month <= userCreatedDate.getMonth() + 1)
          }
          isNextDisabled={
            year > currentYear ||
            (year === currentYear && month >= currentMonth)
          }
        />

        <WorkoutCalendar
          startingDate={userCreatedDate}
          currentDate={date}
          workoutStatuses={histories}
          isLoading={isLoading}
        />
      </View>

      <FaceExplanation />
    </ScrollView>
  );
}

function SetRestDayButton({ onPress }: TouchableOpacityProps) {
  return (
    <TouchableOpacity
      className="h-[36px] w-[85px] items-center justify-center rounded-[8px] border border-gray-10 bg-white"
      onPress={onPress}
    >
      <Text className="body-5 text-gray-90">휴일 설정</Text>
    </TouchableOpacity>
  );
}

function FaceExplanation() {
  const faces = [
    { icon: <icons.FaceDefaultIcon width={24} height={24} />, label: "기본" },
    { icon: <icons.FaceDoneIcon width={24} height={24} />, label: "운동함" },
    { icon: <icons.FaceNotDoneIcon width={24} height={24} />, label: "안함" },
    { icon: <icons.FaceRestIcon width={24} height={24} />, label: "쉬는 날" },
  ];

  return (
    <View className="mt-[8px] mb-[18px] flex-row items-center rounded-[10px] border border-gray-10 bg-white px-[27px] py-[16px]">
      <Text className="title-4">표정의 의미는?</Text>

      <View className="ml-auto flex-row gap-[8px]">
        {faces.map(({ icon, label }) => (
          <View key={label} className="w-[34px] items-center">
            {icon}
            <Text className="caption-3">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
