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
import { useState } from "react";
import { updateNewPassword } from "@/utils/supabase";

const Step3 = () => {
  const [resetPassword, setResetPassword] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const router = useRouter();

  const handleResetPassword = async () => {
    if (resetPassword.newPassword !== resetPassword.confirmPassword) {
      Alert.alert("알림", "비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await updateNewPassword(resetPassword.newPassword);

      router.replace("/home");
    } catch (error) {
      Alert.alert(
        "알림",
        error instanceof Error
          ? error.message
          : "비밀번호 변경에 실패했습니다.",
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
            source={images.Step3}
            className="h-[90px] w-full"
            resizeMode="contain"
          />
          <View className="mt-10 flex w-full gap-10">
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
            className="mt-10 h-[62px] w-full items-center justify-center rounded-[10px] bg-primary"
            onPress={handleResetPassword}
          >
            <Text className="heading-2 text-white">완료</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Step3;
