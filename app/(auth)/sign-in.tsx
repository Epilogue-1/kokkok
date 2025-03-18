import {
  Alert,
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import colors from "@/constants/colors";
import { signIn, supabase } from "@/utils/supabase";
import { validateSignInForm } from "@/utils/validation";
import icons from "@constants/icons";
import images, { DEFAULT_AVATAR_URL } from "@constants/images";
import type { Provider } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as Linking from "expo-linking";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession(); // required for web only
const redirectTo = makeRedirectUri({});

const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token } = params;

  if (!access_token) return;

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
};

const SignIn = () => {
  const url = Linking.useURL();
  if (url) createSessionFromUrl(url);

  const router = useRouter();

  const [userInput, setUserInput] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const performOAuth = async (provider: Provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        // OAuth 스코프 설정 구글이면 이메일과 프로필, 깃허브면 이메일과 사용자 정보
        scopes:
          provider === "google" ? "email profile" : "read:user user:email",
        queryParams:
          provider === "google"
            ? {
                prompt: "select_account",
                access_type: "offline",
              }
            : {
                login: "true",
              },
      },
    });
    if (error) throw error;

    const res = await WebBrowser.openAuthSessionAsync(
      data?.url ?? "",
      redirectTo,
    );

    if (res.type === "success") {
      const { url } = res;
      const session = await createSessionFromUrl(url);

      // OAuth 사용자 정보 저장
      if (session?.user) {
        const { data: existingUser } = await supabase
          .from("user")
          .select()
          .eq("id", session.user.id)
          .single();

        if (!existingUser && session.user.email) {
          const { error: insertError } = await supabase.from("user").insert({
            id: session.user.id,
            email: session.user.email,
            username:
              session.user.user_metadata.full_name ||
              session.user.email.split("@")[0],
            avatarUrl: DEFAULT_AVATAR_URL,
            isOAuth: true,
          });

          if (insertError) throw insertError;

          router.replace("/onboarding");
          return;
        }
      }
    }
  };

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
    <SafeAreaView className="h-full bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View className="mt-[92px] flex items-center justify-center px-6">
            <Image
              source={images.AuthLogo}
              className="h-[37px] w-[163px]"
              resizeMode="contain"
            />

            <View className="mt-[85px] flex w-full gap-[24px]">
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

            <Link className="mt-[10px] ml-auto" href="/password-reset/step1">
              <Text className="body-1 text-purple">비밀번호를 잊으셨나요?</Text>
            </Link>

            <TouchableOpacity
              className="mt-[36px] h-[62px] w-full items-center justify-center rounded-[10px] bg-primary"
              onPress={handleSignIn}
            >
              <Text className="heading-2 text-white">로그인</Text>
            </TouchableOpacity>

            <View className="mt-14 flex items-center">
              <View>
                <Text className="title-3 text-gray-80">간편 로그인</Text>
              </View>
              <View className="mt-[16px] flex-row items-center gap-[40px]">
                <TouchableOpacity onPress={() => performOAuth("google")}>
                  <icons.GoogleIcon width={56} height={56} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => performOAuth("github")}>
                  <icons.GithubIcon width={56} height={56} />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mt-[56px]">
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;
