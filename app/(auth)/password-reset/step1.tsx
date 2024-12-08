import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import images from "@constants/images";
import { useRouter } from "expo-router";
import { resetPassword } from "@/utils/supabase";
import { useAtom } from "jotai";
import { passwordResetFormAtom } from "@/contexts/auth";

const Step1 = () => {
  const router = useRouter();
  const [resetEmail, setResetEmail] = useAtom(passwordResetFormAtom);

  const handleSendEmail = async () => {
    try {
      await resetPassword(resetEmail.email);
      router.push("/password-reset/step2");
    } catch (error: unknown) {
      Alert.alert(
        "비밀번호 재설정 실패",
        error instanceof Error
          ? error.message
          : "비밀번호 재설정에 실패했습니다.",
      );
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
            source={images.Step1}
            className="h-[90px] w-full"
            resizeMode="contain"
          />
          <View className="mt-10 flex w-full gap-10">
            <TextInput
              className="placeholder:body-1 h-[58px] w-full rounded-[10px] border border-gray-20 px-4 placeholder:text-gray-40 focus:border-primary"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="이메일을 입력해주세요"
              accessibilityLabel="이메일 입력"
              accessibilityHint="이메일을 입력해주세요"
              value={resetEmail.email}
              onChangeText={(text) => setResetEmail({ email: text })}
            />
          </View>

          <TouchableOpacity
            className="mt-10 h-[62px] w-full items-center justify-center rounded-[10px] bg-primary"
            onPress={handleSendEmail}
          >
            <Text className="heading-2 text-white">인증번호 발송</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Step1;
