import { OTP_TIME } from "@/constants/time";
import {
  alertExpirationOnTimeout,
  useTimerWithDuration,
} from "@/hooks/useTimer";
import { formatTime } from "@/utils/formatTime";
import { signUp, verifySignUpOTP } from "@/utils/supabase";
import { validateStep2Form } from "@/utils/validation";
import images from "@constants/images";
import { signUpFormAtom } from "@contexts/auth";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { useState } from "react";
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
  const [signUpForm, setSignUpForm] = useAtom(signUpFormAtom);
  const [otpcode, setOtpcode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { timeLeft } = useTimerWithDuration(OTP_TIME, alertExpirationOnTimeout);

  const handleSignUp = async () => {
    if (isLoading) return;

    const validationError = validateStep2Form(signUpForm.username, otpcode);
    if (validationError) {
      Alert.alert("알림", validationError.message);
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifySignUpOTP(signUpForm.email, otpcode);

      await signUp({
        id: res.user?.id ?? "",
        email: signUpForm.email,
        password: signUpForm.password,
        username: signUpForm.username,
        description: signUpForm.description,
      });

      setSignUpForm({
        email: "",
        password: "",
        username: "",
        description: "",
      });

      router.replace("/onboarding");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("User already registered")
      ) {
        Alert.alert("알림", "이미 가입된 이메일입니다.", [
          { text: "확인", onPress: () => router.replace("/sign-up/step1") },
        ]);
      } else {
        Alert.alert(
          "회원가입 실패",
          "회원가입에 실패했습니다.\n인증코드를 확인해주세요",
        );
      }
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
        <View className="mt-[58px] flex items-center justify-center px-6">
          <Image
            source={images.AuthLogo}
            className="h-[90px] w-[328px]"
            resizeMode="contain"
          />
          <View className="relative mt-10 flex w-full gap-10">
            <TextInput
              className="placeholder:body-1 h-[58px] w-full rounded-[10px] border border-gray-20 px-4 placeholder:text-gray-40 focus:border-primary"
              placeholder="인증코드를 입력해주세요."
              accessibilityLabel="인증코드 입력"
              accessibilityHint="인증코드를 입력해주세요."
              value={otpcode}
              onChangeText={(text) => setOtpcode(text)}
            />
            <Text className="-translate-y-1/2 body-1 absolute top-1/2 right-4 text-gray-40">
              {formatTime(timeLeft)}
            </Text>
          </View>

          <TouchableOpacity
            className={`mt-10 h-[62px] w-full items-center justify-center rounded-[10px] ${
              isLoading ? "bg-gray-20" : "bg-primary"
            }`}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text className="heading-2 text-white">인증코드 확인중...</Text>
            ) : (
              <Text className="heading-2 text-white">완료</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Step2;
