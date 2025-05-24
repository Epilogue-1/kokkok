import icons from "@/constants/icons";
import images, { DEFAULT_AVATAR_URL } from "@/constants/images";
import { supabase } from "@/utils/supabase";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import Constants from "expo-constants";
import { Link, router } from "expo-router";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

GoogleSignin.configure({
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  webClientId: Constants.expoConfig?.extra?.GOOGLE_CLIENT_ID,
});

const SignIn = () => {
  const performGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.data?.idToken) {
        const {
          data: { user },
          error,
        } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: userInfo.data?.idToken,
        });

        if (error) {
          Alert.alert("알림", "Google 로그인에 실패했습니다.");
          console.error("Google Sign In Error:", error);
          return;
        }

        if (user) {
          const { data: existingUser } = await supabase
            .from("user")
            .select()
            .eq("id", user.id)
            .single();

          if (!existingUser && user.email) {
            const { error: insertError } = await supabase.from("user").insert({
              id: user.id,
              email: user.email,
              username: userInfo.data.user.id ?? user.email.split("@")[0],
              avatarUrl: userInfo.data.user.photo ?? DEFAULT_AVATAR_URL,
              isOAuth: true,
            });

            if (insertError) {
              Alert.alert("알림", "사용자 정보 저장에 실패했습니다.");
              console.error("User Insert Error (Google):", insertError);
              return;
            }
            router.replace("/onboarding");
            return;
          }
          // 이미 사용자가 존재하면 홈으로 이동 또는 다른 처리
          router.replace("/(protected)/home");
        }
      } else {
        Alert.alert("알림", "Google ID 토큰을 가져오지 못했습니다.");
      }
    } catch (e: unknown) {
      // error가 code 속성을 가지는지 확인 (타입 가드)
      const error = e as { code?: string; message?: string }; // code와 message를 포함할 수 있도록 타입 단언
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("Google Sign In Canceled");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Google Sign In In Progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("알림", "Google Play 서비스를 사용할 수 없습니다.");
      } else {
        Alert.alert("알림", "Google 로그인 중 오류가 발생했습니다.");
        console.error("Google Sign In Exception:", error.message || e); // error.message가 있으면 사용, 없으면 원래 에러 객체 e 로깅
      }
    }
  };

  const performAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const {
          data: { user },
          error,
        } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
        });

        if (error) {
          Alert.alert("알림", "Apple 로그인에 실패했습니다.");
          console.error("Apple Sign In Error:", error);
          return;
        }

        if (user) {
          const { data: existingUser } = await supabase
            .from("user")
            .select()
            .eq("id", user.id)
            .single();

          if (!existingUser && user.email) {
            const fullName =
              credential.fullName?.givenName && credential.fullName?.familyName
                ? `${credential.fullName.givenName} ${credential.fullName.familyName}`
                : user.email.split("@")[0];

            const { error: insertError } = await supabase.from("user").insert({
              id: user.id,
              email: user.email,
              username: fullName,
              avatarUrl: DEFAULT_AVATAR_URL,
              isOAuth: true,
            });

            if (insertError) {
              Alert.alert("알림", "사용자 정보 저장에 실패했습니다.");
              console.error("User Insert Error:", insertError);
              return;
            }
            router.replace("/onboarding");
            return;
          }
          // 이미 사용자가 존재하면 홈으로 이동 또는 다른 처리
          router.replace("/(protected)/home");
        }
      } else {
        Alert.alert("알림", "Apple ID 토큰을 가져오지 못했습니다.");
      }
    } catch (e: unknown) {
      if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        e.code === "ERR_REQUEST_CANCELED"
      ) {
        console.log("Apple Sign In Canceled");
      } else {
        Alert.alert("알림", "Apple 로그인 중 오류가 발생했습니다.");
        console.error("Apple Sign In Exception:", e);
      }
    }
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView keyboardShouldPersistTaps="handled" className="h-full">
          <View className="mt-[97px] flex items-center px-[16px]">
            <Image
              source={images.AuthLogo}
              className="h-[44px] w-[195px]"
              resizeMode="contain"
            />
            <Text className="mt-[16px] mb-[42px] font-bold text-[17px] text-primary">
              콕콕이와 함께 운동해요!
            </Text>

            <icons.SignInKoKKoK width={164} height={164} />

            <View className="mt-[46px] gap-[16px]">
              <Link href="/email">
                <View className="mt-[46px] h-[52px] w-full flex-row items-center justify-center gap-[10px] rounded-[10px] bg-primary">
                  <icons.EmailIcon width={24} height={24} />
                  <Text className="font-psemibold text-[17px] text-white">
                    이메일로 시작하기
                  </Text>
                </View>
              </Link>

              <TouchableOpacity onPress={performGoogleSignIn}>
                <View className="h-[52px] w-full flex-row items-center justify-center gap-[10px] rounded-[10px] border border-gray-90">
                  <icons.OAuthGoogle width={24} height={24} />
                  <Text className="font-psemibold text-[17px] text-gray-90">
                    구글로 시작하기
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={performAppleSignIn}>
                <View className="h-[52px] w-full flex-row items-center justify-center gap-[10px] rounded-[10px] bg-gray-90">
                  <icons.OAuthApple width={32} height={32} />
                  <Text className="font-psemibold text-[17px] text-white">
                    애플로 시작하기
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;
