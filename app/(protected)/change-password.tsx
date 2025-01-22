import useFetchData from "@/hooks/useFetchData";
import { useModal } from "@/hooks/useModal";
import { getCurrentUser, updateNewPassword } from "@/utils/supabase";
import { validateChangePasswordForm } from "@/utils/validation";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ChangePassword = () => {
  const { openModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);

  const [resetPassword, setResetPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { data: currentUser } = useFetchData(
    ["currentUser"],
    getCurrentUser,
    "현재 사용자를 불러올 수 없습니다.",
  );

  const handleResetPassword = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const validationError = await validateChangePasswordForm(
        currentUser?.email || "",
        resetPassword.currentPassword,
        resetPassword.newPassword,
        resetPassword.confirmPassword,
      );

      if (validationError) {
        Alert.alert("알림", validationError.message);
        return;
      }

      await updateNewPassword(resetPassword.newPassword);

      // 비밀번호 변경 완료 모달 표시
      openModal({ type: "PASSWORD_RESET_COMPLETE" });
    } catch (error) {
      // 에러메시지 한글로 변환
      const errorMessage =
        error instanceof Error
          ? error.message ===
            "New password should be different from the old password."
            ? "새 비밀번호는 현재 비밀번호와 달라야 합니다."
            : error.message
          : "비밀번호 변경에 실패했습니다.";

      Alert.alert("알림", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="h-full flex-1 bg-white"
    >
      <ScrollView>
        <View className="mt-[32px] flex items-center justify-center px-6">
          <View className="flex w-full gap-[20px]">
            <TextInput
              className="placeholder:body-1 h-[58px] w-full rounded-[10px] border border-gray-20 px-4 placeholder:text-gray-40 focus:border-primary"
              autoCapitalize="none"
              placeholder="현재 비밀번호를 입력해주세요"
              accessibilityLabel="현재 비밀번호 입력"
              accessibilityHint="현재 비밀번호를 입력해주세요"
              value={resetPassword.currentPassword}
              onChangeText={(text) =>
                setResetPassword({ ...resetPassword, currentPassword: text })
              }
              secureTextEntry
            />
            <TextInput
              className="placeholder:body-1 h-[58px] w-full rounded-[10px] border border-gray-20 px-4 placeholder:text-gray-40 focus:border-primary"
              autoCapitalize="none"
              placeholder="새 비밀번호를 입력해주세요"
              accessibilityLabel="새 비밀번호 입력"
              accessibilityHint="새 비밀번호를 입력해주세요"
              value={resetPassword.newPassword}
              onChangeText={(text) =>
                setResetPassword({ ...resetPassword, newPassword: text })
              }
              secureTextEntry
            />
            <TextInput
              className="placeholder:body-1 h-[58px] w-full rounded-[10px] border border-gray-20 px-4 placeholder:text-gray-40 focus:border-primary"
              autoCapitalize="none"
              placeholder="비밀번호를 한번 더 입력해주세요"
              accessibilityLabel="비밀번호 재입력"
              accessibilityHint="비밀번호를 한번 더 입력해주세요"
              value={resetPassword.confirmPassword}
              onChangeText={(text) =>
                setResetPassword({ ...resetPassword, confirmPassword: text })
              }
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className={`mt-10 h-[62px] w-full items-center justify-center rounded-[10px] ${
              isLoading ? "bg-gray-20" : "bg-primary"
            }`}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            <Text className="heading-2 text-white">
              {isLoading ? "변경 중..." : "완료"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ChangePassword;
