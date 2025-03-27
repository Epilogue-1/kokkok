import colors from "@/constants/colors";
import { OTP_TIME } from "@/constants/time";
import { passwordResetFormAtom } from "@/contexts/auth";
import {
  alertExpirationOnTimeout,
  useTimerWithDuration,
} from "@/hooks/useTimer";
import { formatTime } from "@/utils/formatTime";
import { verifyResetToken } from "@/utils/supabase";
import images from "@constants/images";
import { useRouter } from "expo-router";
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

const Step2 = () => {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [resetEmail, setResetEmail] = useAtom(passwordResetFormAtom);
  const { timeLeft } = useTimerWithDuration(OTP_TIME, alertExpirationOnTimeout);

  useEffect(() => {
    return () => {
      setResetEmail({ email: "" });
    };
  }, [setResetEmail]);

  const handleVerifyToken = async () => {
    try {
      await verifyResetToken(resetEmail.email, token);
      router.replace("/password-reset/step3");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message === "Token has expired or is invalid"
            ? "인증번호가 만료되었거나\n유효하지 않습니다."
            : error.message
          : "인증에 실패했습니다.";

      Alert.alert("알림", errorMessage);
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
            source={images.Step2}
            className="h-[90px] w-full"
            resizeMode="contain"
          />
          {/* mb-[120px]는 keyboard 올라가는 현상을 위한 class */}
          <View className="relative mt-10 mb-[120px] flex w-full gap-10">
            <TextInput
              className="placeholder:body-1 h-[58px] w-full rounded-[10px] border border-gray-25 px-4 text-gray-90 focus:border-primary"
              placeholder="인증코드를 입력해주세요"
              placeholderTextColor={colors.gray[60]}
              accessibilityLabel="인증코드 입력"
              accessibilityHint="인증코드를 입력해주세요"
              value={token}
              onChangeText={(text) => setToken(text)}
            />
            <Text className="-translate-y-1/2 body-1 absolute top-1/2 right-4 text-gray-40">
              {formatTime(timeLeft)}
            </Text>
          </View>

          <TouchableOpacity
            className="absolute bottom-[32px] h-[62px] w-full items-center justify-center rounded-[10px] bg-primary"
            onPress={handleVerifyToken}
          >
            <Text className="heading-2 text-white">인증번호 입력</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Step2;
