import icons from "@/constants/icons";
import images, { DEFAULT_AVATAR_URL } from "@/constants/images";
import { supabase } from "@/utils/supabase";
import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as Linking from "expo-linking";
import { Link, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

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
  const { bottom } = useSafeAreaInsets();
  const url = Linking.useURL();
  if (url) createSessionFromUrl(url);

  const performGoogleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        scopes: "email profile",
        queryParams: {
          prompt: "select_account",
          access_type: "offline",
        },
      },
    });
    if (error) {
      Alert.alert("알림", "OAuth 로그인에 실패했습니다.");
      console.error("OAuth Error:", error);
      return;
    }

    const res = await WebBrowser.openAuthSessionAsync(
      data?.url ?? "",
      redirectTo,
    );

    if (res.type === "success") {
      const { url } = res;
      const session = await createSessionFromUrl(url);

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

          if (insertError) {
            Alert.alert("알림", "사용자 정보 저장에 실패했습니다.");
            console.error("User Insert Error:", insertError);
            return;
          }
          router.replace("/onboarding");
          return;
        }
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

              {Platform.OS === "ios" && (
                <TouchableOpacity onPress={performAppleSignIn}>
                  <View className="h-[52px] w-full flex-row items-center justify-center gap-[10px] rounded-[10px] bg-gray-90">
                    <icons.OAuthApple width={32} height={32} />
                    <Text className="font-psemibold text-[17px] text-white">
                      애플로 시작하기
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View
        className="absolute w-full items-center"
        style={{ bottom: bottom + 12 }}
      >
        <View className="items-center">
          <Text className="font-pregular text-[11px] text-gray-80">
            가입을 진행할 경우, 아래의 정책에 동의한 것으로 간주합니다.
          </Text>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                "https://ash-anchovy-874.notion.site/188b8ea65e92808fa75aea1e1a255563",
              )
            }
          >
            <Text className="font-pregular text-[11px] text-gray-80 underline">
              서비스약관 및 개인정보처리방침
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignIn;
