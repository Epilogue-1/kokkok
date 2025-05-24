import icons from "@/constants/icons";
import images, { DEFAULT_AVATAR_URL } from "@/constants/images";
import { supabase } from "@/utils/supabase";
import * as AppleAuthentication from "expo-apple-authentication";
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

const SignIn = () => {
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

              <TouchableOpacity>
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
