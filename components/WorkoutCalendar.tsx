import { Text, View } from "react-native";

import { CalendarSkeleton } from "@/components/Skeleton";
import icons from "@/constants/icons";
import type { getHistories } from "@/utils/supabase";

type History = Awaited<ReturnType<typeof getHistories>>[number];
type FaceStatus = "default" | "rest" | "done" | "not-done";

const ICONS = {
  rest: <icons.FaceRestIcon width={28} height={28} />,
  done: <icons.FaceDoneIcon width={28} height={28} />,
  "not-done": <icons.FaceNotDoneIcon width={28} height={28} />,
  default: <icons.FaceDefaultIcon width={28} height={28} />,
};

interface WorkoutCalendarProps {
  startingDate: Date;
  currentDate: Date;
  workoutStatuses: History[];
  isLoading?: boolean;
}

export default function WorkoutCalendar({
  startingDate,
  currentDate,
  workoutStatuses,
  isLoading = false,
}: WorkoutCalendarProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const getStatusForDay = (day: number): FaceStatus => {
    const today = new Date();
    const targetDate = new Date(year, month - 1, day);
    const cleanStartingDate = new Date(
      startingDate.getFullYear(),
      startingDate.getMonth(),
      startingDate.getDay(),
    );

    // 사용자 가입일 이전의 날짜는 기본으로 표시
    if (targetDate <= cleanStartingDate) {
      return "default";
    }

    const formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(
      day,
    ).padStart(2, "0")}`;
    const status =
      workoutStatuses.find((ws) => ws.date === formattedDate)?.status ?? null;

    // 쉬는 날 혹은 운동한 날 표시
    if (status) return status;

    // 오늘 이후의 날짜는 기본으로 표시
    if (targetDate > today) {
      return "default";
    }

    // 그 외에는 운동안한 날로 표시
    return "not-done";
  };

  const totalDaysInCalendar =
    Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

  const days = Array.from({ length: totalDaysInCalendar }, (_, index) => {
    // 달력에서 날짜에 해당되지 않는 빈 공간
    if (index < firstDayOfMonth || index >= firstDayOfMonth + daysInMonth) {
      return null;
    }

    const day = index - firstDayOfMonth + 1;
    const status = getStatusForDay(day);
    return { day, status };
  });

  const weeks = Array.from({ length: days.length / 7 }, (_, i) =>
    days.slice(i * 7, i * 7 + 7),
  );

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <View className="w-full">
      <View className="mt-[24px] w-full flex-row justify-between px-[12px]">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <Text key={day} className="body-4 text-center text-gray-65">
            {day}
          </Text>
        ))}
      </View>

      <View className="w-full px-[3px]">
        {weeks.map((week, weekIndex) => (
          <View
            key={week ? `${year}-${month}-${weekIndex}` : `empty-${weekIndex}`}
            className="mt-[8px] flex-row items-center justify-between"
          >
            {week.map((day, dayIndex) => (
              <View
                key={day ? `${year}-${month}-${day.day}` : `empty-${dayIndex}`}
                className="w-[30px] items-center justify-start"
              >
                {day ? (
                  <View className="items-center justify-center gap-[8px]">
                    <Text className="body-4 text-gray-65">{day.day}</Text>
                    {ICONS[day.status]}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
