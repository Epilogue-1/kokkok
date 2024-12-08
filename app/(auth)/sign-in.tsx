import {
  ScrollView,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

import images from "@constants/images";
import icons from "@constants/icons";
import { useState } from "react";
import { Link } from "expo-router";
import { signIn, supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import type { Provider } from "@supabase/supabase-js";

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

        if (!existingUser) {
          const { error: insertError } = await supabase.from("user").insert({
            id: session.user.id,
            email: session.user.email,
            username:
              session.user.user_metadata.full_name ||
              session.user.email?.split("@")[0],
            avatarUrl:
              session.user.user_metadata.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                session.user.email || "",
              )}`,
            isOAuth: true,
          });

          if (insertError) throw insertError;
        }
      }

      router.replace("/home");
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn({
        email: userInput.email,
        password: userInput.password,
      });

      router.replace("/home");
    } catch (error: unknown) {
      Alert.alert(
        "로그인 실패",
        error instanceof Error
          ? error.message
          : "로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.",
      );
    }
  };

  return (
    <View className="h-full bg-white">
      <ScrollView>
        <View className="mt-10 flex items-center justify-center px-6">
          <Image
            source={images.AuthLogo}
            className="h-[90px] w-[328px]"
            resizeMode="contain"
          />

          <View className="mt-10 flex w-full gap-8">
            <TextInput
              className="placeholder:body-1 h-[58px] w-full rounded-[10px] border border-gray-20 px-4 placeholder:text-gray-40 focus:border-primary"
              placeholder="이메일을 입력해주세요."
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
                className="placeholder:body-1 h-[58px] w-full rounded-[10px] border border-gray-20 px-4 placeholder:text-gray-40 focus:border-primary"
                placeholder="비밀번호를 입력해주세요."
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

          <TouchableOpacity
            className="mt-10 h-[62px] w-full items-center justify-center rounded-[10px] bg-primary"
            onPress={handleSignIn}
          >
            <Text className="heading-2 text-white">로그인</Text>
          </TouchableOpacity>

          <View className="mt-10 flex flex-row justify-center gap-3">
            <Link href="/password-reset/step1">
              <Text className="body-1 text-gray-50">비밀번호 찾기</Text>
            </Link>
            <Text className="body-1 text-gray-50">|</Text>
            <Link href="/sign-up/step1">
              <Text className="body-1 text-gray-50">회원가입</Text>
            </Link>
          </View>

          <View className="mt-14 flex items-center">
            <View>
              <Text className="title-3 text-gray-65">간편 로그인</Text>
            </View>
            <View className="mt-4 flex-row items-center gap-4">
              <TouchableOpacity onPress={() => performOAuth("google")}>
                <icons.GoogleIcon width={56} height={56} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => performOAuth("github")}>
                <icons.GithubIcon width={56} height={56} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SignIn;
