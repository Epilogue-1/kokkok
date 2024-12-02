import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import WorkoutCalendar from "@/components/WorkoutCalendar";
import icons from "@/constants/icons";
import colors from "@/constants/colors";

type Status = "DONE" | "REST";
interface Mock {
  date: string;
  status: Status;
}
const mock: Mock[] = [
  { date: "2024-11-01T00:00:00.000Z", status: "DONE" },
  { date: "2024-11-02T00:00:00.000Z", status: "REST" },
  { date: "2024-11-05T00:00:00.000Z", status: "REST" },
  { date: "2024-11-08T00:00:00.000Z", status: "DONE" },
  { date: "2024-11-14T00:00:00.000Z", status: "DONE" },
  { date: "2024-11-15T00:00:00.000Z", status: "DONE" },
  { date: "2024-11-16T00:00:00.000Z", status: "DONE" },
  { date: "2024-11-19T00:00:00.000Z", status: "DONE" },
  { date: "2024-11-20T00:00:00.000Z", status: "REST" },
  { date: "2024-11-24T00:00:00.000Z", status: "DONE" },
  { date: "2024-11-25T00:00:00.000Z", status: "DONE" },
  { date: "2024-11-28T00:00:00.000Z", status: "DONE" },
  { date: "2024-11-29T00:00:00.000Z", status: "REST" },
  { date: "2024-11-30T00:00:00.000Z", status: "DONE" },
  { date: "2024-12-01T00:00:00.000Z", status: "DONE" },
  { date: "2024-12-10T00:00:00.000Z", status: "REST" },
  { date: "2024-12-13T00:00:00.000Z", status: "DONE" },
];

export default function History() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const month = currentDate.getMonth() + 1;

  const workoutDays = mock.filter(
    (item) =>
      Number(item.date.split("-")[1]) === month && item.status === "DONE",
  ).length;

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  return (
    <ScrollView className="flex-1 bg-white px-[24px] pt-[18px]">
      <View className="flex-row items-center">
        <Text className="heading-1 grow">
          {month}월 <Text className="text-primary">{workoutDays}</Text>일 운동
          완료!
        </Text>

        <TouchableOpacity className="h-[36px] w-[85px] items-center justify-center rounded-[8px] border border-gray-25">
          <Text className="body-5 text-gray-90">쉬는 날 설정</Text>
        </TouchableOpacity>
      </View>

      <View className="mt-[20px] items-center rounded-[10px] border border-gray-25 px-[16px] pt-[16px] pb-[32px]">
        <CalendarNavigator
          date={currentDate}
          onPrevious={handlePreviousMonth}
          onNext={handleNextMonth}
        />
        <WorkoutCalendar date={currentDate} workoutStatus={mock} />
      </View>

      <FaceExplanation />
    </ScrollView>
  );
}

interface CalendarNavigatorProps {
  date: Date;
  onPrevious: () => void;
  onNext: () => void;
}

function CalendarNavigator({
  date,
  onPrevious,
  onNext,
}: CalendarNavigatorProps) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const isNextDisabled = year === currentYear && month >= currentMonth;

  return (
    <View className="flex-row items-center gap-[24px]">
      {/* Previous Button */}
      <TouchableOpacity onPress={onPrevious}>
        <icons.ChevronLeftIcon width={20} height={20} color={colors.gray[90]} />
      </TouchableOpacity>

      {/* Month Display */}
      <Text
        className={`heading-2 text-center ${year === currentYear ? "w-[43px]" : "w-[87px]"}`}
      >
        {year === currentYear
          ? `${month}월`
          : `${String(year).slice(2)}년 ${month}월`}
      </Text>

      {/* Next Button */}
      <TouchableOpacity onPress={onNext} disabled={isNextDisabled}>
        <icons.ChevronRightIcon
          width={20}
          height={20}
          color={isNextDisabled ? colors.gray[30] : colors.gray[90]}
        />
      </TouchableOpacity>
    </View>
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
    <View className="mt-[8px] mb-[18px] flex-row items-center rounded-[10px] border border-gray-25 px-[27px] py-[16px]">
      <Text className="title-4">표정의 의미는?</Text>

      <View className="ml-auto flex-row gap-[8px]">
        {faces.map(({ icon, label }) => (
          <View key={label} className="w-[32px] items-center">
            {icon}
            <Text className="caption-3">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
