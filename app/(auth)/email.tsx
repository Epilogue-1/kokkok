import {
  Alert,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import colors from "@/constants/colors";
import { signIn } from "@/utils/supabase";
import { validateSignInForm } from "@/utils/validation";
import icons from "@constants/icons";
import images from "@constants/images";

import { Link } from "expo-router";
import { useState } from "react";
import { Platform } from "react-native";

const Email = () => {
  const [userInput, setUserInput] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    try {
      const validationError = validateSignInForm(
        userInput.email,
        userInput.password,
      );

      if (validationError) {
        Alert.alert("알림", validationError.message);
        return;
      }

      await signIn({
        email: userInput.email,
        password: userInput.password,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message === "Invalid login credentials"
            ? "이메일 또는 비밀번호가 올바르지 않습니다."
            : error.message
          : "로그인에 실패했습니다.";

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
        <View className="flex-1">
          {/* mb 120px + 비밀번호 잊으셨나요 43px 163px 사이 간격 */}
          <View className="mt-[84px] mb-[163px] items-center justify-center px-6">
            <Image
              source={images.AuthLogo}
              className="h-[34px] w-[221px]"
              resizeMode="contain"
            />

            <View className="mt-[87px] flex w-full gap-[24px]">
              <TextInput
                className="placeholder:body-1 h-[52px] w-full rounded-[10px] border border-gray-25 px-4 text-gray-90 focus:border-primary"
                placeholder="이메일을 입력해주세요"
                placeholderTextColor={colors.gray[60]}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="이메일 입력"
                accessibilityHint="이메일을 입력해주세요."
                value={userInput.email}
                onChangeText={(text) =>
                  setUserInput((prev) => ({ ...prev, email: text }))
                }
              />
              <View className="w-full">
                <TextInput
                  className="placeholder:body-1 h-[52px] w-full rounded-[10px] border border-gray-25 px-4 text-gray-90 focus:border-primary"
                  placeholder="비밀번호를 입력해주세요"
                  placeholderTextColor={colors.gray[60]}
                  autoCapitalize="none"
                  secureTextEntry={!showPassword}
                  accessibilityLabel="비밀번호 입력"
                  accessibilityHint="비밀번호를 입력해주세요."
                  value={userInput.password}
                  onChangeText={(text) =>
                    setUserInput((prev) => ({ ...prev, password: text }))
                  }
                />
                <TouchableOpacity
                  className="-translate-y-1/2 absolute top-1/2 right-4"
                  onPress={() => setShowPassword((prev) => !prev)}
                  accessibilityLabel={
                    showPassword ? "비밀번호 숨기기" : "비밀번호 표시"
                  }
                  accessibilityRole="button"
                >
                  {showPassword ? (
                    <icons.EyeOffIcon width={24} height={24} color="#828282" />
                  ) : (
                    <icons.EyeIcon width={24} height={24} color="#828282" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <Link className="ml-auto p-[10px]" href="/password-reset/step1">
              <Text className="body-1 text-purple">비밀번호를 잊으셨나요?</Text>
            </Link>
          </View>
          <View className="absolute bottom-[32px] flex w-full items-center px-[16px]">
            <View className="mb-[22px]">
              <Text className="body-1 text-gray-60">
                계정이 없다면?{" "}
                <Link
                  href="/sign-up/step1"
                  className="title-4 mr-[4px] text-purple"
                >
                  이메일로 회원가입
                </Link>
              </Text>
            </View>

            <TouchableOpacity
              className="h-[56px] w-full items-center justify-center rounded-[10px] bg-primary"
              onPress={handleSignIn}
            >
              <Text className="title-2 text-white">로그인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Email;
