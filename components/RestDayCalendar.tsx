import { Text, TouchableOpacity, View } from "react-native";

interface RestDayCalendarProps {
  date: Date;
  restDates: { date: `${number}-${number}-${number}` }[];
  onSelectDate: (date: Date) => void;
}

export default function RestDayCalendar({
  date,
  restDates,
  onSelectDate,
}: RestDayCalendarProps) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const days = Array.from(
    { length: firstDayOfMonth + daysInMonth },
    (_, index) => {
      if (index < firstDayOfMonth) return null;

      const day = index - firstDayOfMonth + 1;
      const formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(
        day,
      ).padStart(2, "0")}` as `${number}-${number}-${number}`;
      const isRest = !!restDates.some((rd) => rd.date === formattedDate);

      return { day, isRest };
    },
  );

  // 마지막 주의 빈 공간을 null로 채우기
  const totalDays = Math.ceil(days.length / 7) * 7;
  for (let i = days.length; i < totalDays; i++) {
    days.push(null);
  }

  const weeks = Array.from({ length: days.length / 7 }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );

  const isToday = (day: number) => {
    const today = new Date();

    return (
      year === today.getFullYear() &&
      month === today.getMonth() + 1 &&
      day === today.getDate()
    );
  };

  const isPastDate = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(year, month - 1, day);
    return targetDate < today;
  };

  const handleSelectDate = (day: number | null) => {
    if (day) {
      onSelectDate(new Date(year, month - 1, day));
    }
  };

  return (
    <View className="mt-[20px] h-[320px] w-full items-center">
      <View className="w-full flex-row justify-between">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <Text key={day} className="body-4 w-[32px] text-center text-gray-65">
            {day}
          </Text>
        ))}
      </View>

      <View className="w-full">
        {weeks.map((week, weekIndex) => (
          <View
            key={week ? `${year}-${month}-${weekIndex}` : `empty-${weekIndex}`}
            className="mt-[16px] w-full flex-row items-center justify-between"
          >
            {week.map((day, dayIndex) => (
              <TouchableOpacity
                key={day ? `${year}-${month}-${day.day}` : `empty-${dayIndex}`}
                className={`h-[32px] w-[32px] items-center justify-center rounded-[10px] ${day ? (day.isRest ? "bg-secondary-yellow" : isToday(day.day) ? "bg-[#DDD0FF]" : "") : ""}`}
                onPress={() => {
                  handleSelectDate(day?.day ?? null);
                }}
                disabled={!day || isPastDate(day.day)}
              >
                {day ? (
                  <Text
                    className={`body-4 ${isPastDate(day.day) ? "text-gray-30" : "text-gray-65"}`}
                  >
                    {day.day}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
