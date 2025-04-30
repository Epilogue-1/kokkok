import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import useCalendar from "@/hooks/useCalendar";
import { useModal } from "@/hooks/useModal";

import { formatDate } from "@/utils/formatDate";
import { addRestDay, deleteRestDay, getRestDays } from "@/utils/supabase";

import CalendarNavigator from "../CalendarNavigator";
import RestDayCalendar from "../RestDayCalendar";

import colors from "@/constants/colors";
import icons from "@/constants/icons";
import useFetchData from "@/hooks/useFetchData";
import { showToast } from "../ToastConfig";

type RestDay = Awaited<ReturnType<typeof getRestDays>>[number];

/* -------------------------------------------------------------------------- */
/*                             RestDayModal                                   */
/* -------------------------------------------------------------------------- */
/**
 * @description
 * 1) 사용자 지정 '쉬는 날'을 가져와 화면에 달력 형태로 표시
 * 2) 사용자가 날짜를 선택/해제하여 쉬는 날을 설정
 * 3) 완료 시 Supabase로 추가/삭제 요청
 */
export default function RestDayModal() {
  const {
    date,
    year,
    month,
    currentYear,
    currentMonth,
    changeMonth,
    resetDate,
  } = useCalendar();
  const { closeModal } = useModal();
  const queryClient = useQueryClient();

  // 서버에서 가져온 기본값 & 화면에서 편집 중인 값
  const [restDates, setRestDates] = useState<RestDay[]>([]);

  // 사용자의 쉬는 날 목록 불러오기
  const { data: defaultDates = [], isSuccess: isFetchSuccess } = useFetchData(
    ["restDates"],
    getRestDays,
    "사용자의 쉬는 날을 불러올 수 없습니다.",
  );

  /**
   * 쉬는 날 저장 요청 (React Query Mutation)
   * - 추가/삭제된 날짜를 Supabase에 반영
   */
  const { mutate: mutateRestDays } = useMutation({
    mutationFn: async () => {
      const addedDays = restDates
        .filter(
          (newRest) => !defaultDates.some((def) => def.date === newRest.date),
        )
        .map((item) => ({ date: item.date }));

      const deletedDays = defaultDates
        .filter((def) => !restDates.some((rest) => rest.date === def.date))
        .map((item) => ({ date: item.date }));

      if (addedDays.length > 0) await addRestDay(addedDays);
      if (deletedDays.length > 0) await deleteRestDay(deletedDays);

      // 모달 닫기 시, 선택값을 초기화
      handleClose();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["histories"] });
      queryClient.invalidateQueries({ queryKey: ["restDates"] });
    },
    onError: (error) => {
      console.error("쉬는 날 설정 실패:", error);
      showToast("fail", "쉬는 날 설정에 실패했어요!");
    },
  });

  /**
   * 모달 닫기 시 선택한 날짜를 초기 상태로 되돌리고 달력도 리셋
   */
  const handleClose = () => {
    closeModal();
    setRestDates(defaultDates);
    resetDate();
  };

  /**
   * 이전 달 / 다음 달로 이동
   */
  const handlePreviousMonth = () => changeMonth(-1);
  const handleNextMonth = () => changeMonth(1);

  /**
   * 데이터 패치 성공 시, restDates 상태를 서버 값으로 세팅
   */
  useEffect(() => {
    if (isFetchSuccess) {
      setRestDates(defaultDates);
    }
  }, [isFetchSuccess, defaultDates]);

  /**
   * 날짜 클릭 이벤트
   * 이미 존재하면 삭제, 없으면 추가
   */
  const handleSelectDate = (selectedDate: Date) => {
    const formattedDate = formatDate(
      selectedDate,
    ) as `${number}-${number}-${number}`;

    setRestDates((prev) => {
      const exists = prev.some((rd) => rd.date === formattedDate);
      return exists
        ? prev.filter((rd) => rd.date !== formattedDate)
        : [...prev, { date: formattedDate }];
    });
  };

  return (
    <View className="items-center rounded-t-xl bg-white px-[39px] pt-[40px] pb-[52px]">
      {/* 모달 닫기 버튼 */}
      <TouchableOpacity
        className="absolute top-[16px] right-[16px]"
        onPress={handleClose}
      >
        <icons.XIcon width={24} height={24} color={colors.gray[90]} />
      </TouchableOpacity>

      <Text className="heading-1 mb-[20px]">휴일을 설정하세요</Text>

      {/* 달력 상단 내비게이터 */}
      <CalendarNavigator
        date={date}
        onPrevious={handlePreviousMonth}
        onNext={handleNextMonth}
        isPreviousDisabled={year === currentYear && month <= currentMonth}
      />

      {/* 달력 (여러 날짜 선택 가능) */}
      <RestDayCalendar
        date={date}
        restDates={restDates}
        onSelectDate={handleSelectDate}
      />

      {/* 저장 버튼 */}
      <TouchableOpacity
        className="mt-[16px] h-[52px] w-[256px] items-center justify-center rounded-[10px] bg-primary"
        onPress={() => mutateRestDays()}
      >
        <Text className="title-2 text-white">완료</Text>
      </TouchableOpacity>
    </View>
  );
}
