import colors from "@/constants/colors";
import { useModal } from "@/hooks/useModal";
import { sendUpOTP } from "@/utils/supabase";
import { validateSignUpFormWithSupabase } from "@/utils/validation";
import images from "@constants/images";
import { signUpFormAtom } from "@contexts/auth";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";

const Step1 = () => {
  const [signUpForm, setSignUpForm] = useAtom(signUpFormAtom);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const { openModal } = useModal();

  useEffect(() => {
    return () => {
      setSignUpForm({ email: "", username: "", password: "" });
    };
  }, [setSignUpForm]);

  const handleContinue = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const validationError = await validateSignUpFormWithSupabase(
        signUpForm.email,
        signUpForm.username,
        signUpForm.password,
        passwordConfirm,
        isSelected,
      );

      if (validationError) {
        Alert.alert("알림", validationError.message);
        return;
      }

      await sendUpOTP(signUpForm.email);

      openModal({ type: "EMAIL_CHECK" });
    } catch (error) {
      Alert.alert(
        "알림",
        error instanceof Error ? error.message : "이메일 전송에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="h-full flex-1 bg-white"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mt-[84px] flex-1 items-center px-6">
            <Image
              source={images.AuthLogo}
              className="h-[34px] w-[221px]"
              resizeMode="contain"
            />

            {/* mb-[120px]는 keyboard 올라가는 현상을 위한 class */}
            <View className="mt-[84px] mb-[120px] flex w-full gap-[24px]">
              <TextInput
                className="placeholder:body-1 h-[52px] w-full rounded-[10px] border border-gray-25 px-4 text-gray-90 focus:border-primary"
                placeholder="이메일을 입력해주세요"
                placeholderTextColor={colors.gray[60]}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="이메일 입력"
                accessibilityHint="이메일을 입력해주세요."
                value={signUpForm.email}
                onChangeText={(text) =>
                  setSignUpForm({ ...signUpForm, email: text })
                }
              />

              <TextInput
                className="placeholder:body-1 h-[52px] w-full rounded-[10px] border border-gray-25 px-4 text-gray-90 focus:border-primary"
                placeholder="닉네임을 입력해주세요"
                placeholderTextColor={colors.gray[60]}
                autoCapitalize="none"
                accessibilityLabel="닉네임 입력"
                accessibilityHint="닉네임을 입력해주세요."
                value={signUpForm.username}
                onChangeText={(text) =>
                  setSignUpForm({ ...signUpForm, username: text })
                }
              />

              <TextInput
                className="placeholder:body-1 h-[52px] w-full rounded-[10px] border border-gray-25 px-4 text-gray-90 focus:border-primary"
                placeholder="비밀번호를 입력해주세요"
                placeholderTextColor={colors.gray[60]}
                autoCapitalize="none"
                secureTextEntry
                accessibilityLabel="비밀번호 입력"
                accessibilityHint="비밀번호를 입력해주세요."
                value={signUpForm.password}
                onChangeText={(text) =>
                  setSignUpForm({ ...signUpForm, password: text })
                }
              />

              <TextInput
                className="placeholder:body-1 h-[52px] w-full rounded-[10px] border border-gray-25 px-4 text-gray-90 focus:border-primary"
                placeholder="비밀번호를 한번 더 입력해주세요"
                placeholderTextColor={colors.gray[60]}
                autoCapitalize="none"
                secureTextEntry
                accessibilityLabel="비밀번호 재입력"
                accessibilityHint="비밀번호를 한번 더 입력해주세요"
                value={passwordConfirm}
                onChangeText={(text) => setPasswordConfirm(text)}
              />

              <View className="w-full flex-row items-center justify-between">
                <View className="flex-row items-center gap-[12px]">
                  <BouncyCheckbox
                    disabled={false}
                    fillColor={colors.primary}
                    size={28}
                    iconStyle={{
                      borderColor: colors.primary,
                      borderRadius: 10,
                    }}
                    innerIconStyle={{
                      borderRadius: 10,
                    }}
                    onPress={(isChecked) => setIsSelected(!!isChecked)}
                    className="size-[28px]"
                  />
                  <Text className="title-3 text-gray-70">
                    개인정보처리방침 및 운영정책
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      "https://ash-anchovy-874.notion.site/188b8ea65e92808fa75aea1e1a255563",
                    )
                  }
                >
                  <Text className="body-1 text-purple">상세보기</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className={`absolute bottom-[32px] h-[56px] w-full items-center justify-center rounded-[10px] ${
                isLoading ? "bg-gray-20" : "bg-primary"
              }`}
              onPress={handleContinue}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text className="title-2 text-white">인증 메일 전송 중...</Text>
              ) : (
                <Text className="title-2 text-white">다음</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default Step1;
