import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import { useModal } from "@/hooks/useModal";
import type { Database } from "@/types/supabase";
import { reportUser } from "@/utils/supabase";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { showToast } from "../ToastConfig";
import { UserBlockModal } from "./DoubleButtonModal/UserBlockModal";

interface ReportModalProps {
  postId?: number;
  commentId?: number;
  reportedId: string;
}

type ReportType = Database["public"]["Enums"]["reportType"];

interface ReportTypeOption {
  type: ReportType;
  label: string;
  description?: string;
}

export function ReportModal({
  postId,
  commentId,
  reportedId,
}: ReportModalProps) {
  const { openModal, closeModal } = useModal();
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [reportContent, setReportContent] = useState("");

  const reportOptions: ReportTypeOption[] = [
    {
      type: "Inappropriate",
      label: "부적절한 컨텐츠",
      description: "(욕설, 혐오표현, 모욕, 조롱)",
    },
    {
      type: "Conflict",
      label: "정치·사회적 갈등 유발",
    },
    {
      type: "Violence",
      label: "폭력 조장",
    },
    {
      type: "Ads",
      label: "광고 및 홍보",
    },
    {
      type: "Spam",
      label: "게시글 / 댓글 도배",
    },
    {
      type: "Other",
      label: "기타",
    },
  ];

  const handleSelectReportType = (type: ReportType) => {
    setReportType(type);
  };

  const reportMutation = useMutation({
    mutationFn: reportUser,
    onSuccess: () => {
      showToast("success", "신고가 접수되었습니다.");
      openModal(<UserBlockModal blockedId={reportedId} />, "center");
    },
    onError: (error) => {
      // console.error("신고 중 오류 발생:", error);
      showToast("fail", "신고 중 오류가 발생했습니다.");
    },
  });

  const handleReport = () => {
    if (!reportType || reportMutation.isPending) return;

    reportMutation.mutate({
      reportedId,
      postId,
      commentId,
      reportType,
      reportContent,
    });
  };

  return (
    <View
      className="h-full items-center justify-center px-7"
      onTouchStart={closeModal}
    >
      <View
        className="w-full items-center gap-[32px] rounded-xl bg-white p-[24px]"
        onTouchStart={(e) => e.stopPropagation()}
      >
        <View className="w-full flex-row items-center justify-between">
          <Text className="title-1 text-gray-90">신고하기</Text>

          <TouchableOpacity onPress={closeModal}>
            <Icons.XIcon width={24} height={24} color={colors.gray[90]} />
          </TouchableOpacity>
        </View>

        <View className="w-full gap-[16px]">
          {reportOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              className="w-full flex-row items-start gap-[16px]"
              onPress={() => handleSelectReportType(option.type)}
            >
              <View
                className={`size-[28px] rounded-[8px] border-[1.5px] ${
                  reportType === option.type
                    ? "border-primary"
                    : "border-gray-25"
                } items-center justify-center`}
              >
                {reportType === option.type && (
                  <Icons.CheckIcon
                    width={24}
                    height={24}
                    color={colors.primary}
                  />
                )}
              </View>

              <Text className="title-4 text-gray-90">
                {option.label}
                {option.description && (
                  <>
                    {"\n"}
                    <Text className="body-2 text-gray-90">
                      {option.description}
                    </Text>
                  </>
                )}
              </Text>
            </TouchableOpacity>
          ))}

          <TextInput
            className="body-3 h-[76px] w-full rounded-[15px] border-[1.5px] border-gray-25 px-[16px] py-[10px] placeholder:text-gray-60 focus:border-primary"
            value={reportContent}
            onChangeText={setReportContent}
            multiline
            textAlignVertical="top"
            placeholder="내용을 입력해주세요"
          />
        </View>

        <View className="w-full px-[52px]">
          <TouchableOpacity
            onPress={handleReport}
            disabled={
              !reportType || reportType === "Other" ? !reportContent : false
            }
            className="w-full items-center rounded-[10px] bg-primary py-3 disabled:bg-gray-40"
          >
            <Text className="title-2 text-white">신고</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
