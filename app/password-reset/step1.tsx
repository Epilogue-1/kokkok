import colors from "@/constants/colors";
import { passwordResetFormAtom } from "@/contexts/auth";
import { useModal } from "@/hooks/useModal";
import { resetPassword } from "@/utils/supabase";
import { validatePasswordResetEmail } from "@/utils/validation";
import images from "@constants/images";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Step1 = () => {
  const [resetEmail, setResetEmail] = useAtom(passwordResetFormAtom);
  const { openModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      setResetEmail({ email: "" });
    };
  }, [setResetEmail]);

  const handleSendEmail = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // 이메일 유효성 검사
      const validationError = await validatePasswordResetEmail(
        resetEmail.email,
      );
      if (validationError) {
        Alert.alert("알림", validationError.message);
        return;
      }

      await resetPassword(resetEmail.email);

      // 이메일 인증 모달 표시
      openModal({ type: "PASSWORD_RESET_EMAIL_CHECK" });
    } catch (error: unknown) {
      Alert.alert(
        "비밀번호 재설정 실패",
        error instanceof Error
          ? error.message
          : "비밀번호 재설정에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="h-full flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-[80px] flex-1 items-center px-6">
          <Image
            source={images.Step1}
            className="h-[90px] w-full"
            resizeMode="contain"
          />
          {/* mb-[120px]는 keyboard 올라가는 현상을 위한 class */}
          <View className="mt-10 mb-[120px] flex w-full gap-10">
            <TextInput
              className="placeholder:body-1 h-[58px] w-full rounded-[10px] border border-gray-25 px-4 text-gray-90 focus:border-primary"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="이메일을 입력해주세요"
              placeholderTextColor={colors.gray[60]}
              accessibilityLabel="이메일 입력"
              accessibilityHint="이메일을 입력해주세요"
              value={resetEmail.email}
              onChangeText={(text) => setResetEmail({ email: text })}
            />
          </View>

          <TouchableOpacity
            className={`absolute bottom-[32px] h-[62px] w-full items-center justify-center rounded-[10px] ${
              isLoading ? "bg-gray-20" : "bg-primary"
            }`}
            onPress={handleSendEmail}
            disabled={isLoading}
          >
            <Text className="heading-2 text-white">
              {isLoading ? "인증번호 전송 중..." : "인증번호 발송"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Step1;
