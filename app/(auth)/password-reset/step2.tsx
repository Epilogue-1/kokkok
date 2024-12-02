import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import images from "@constants/images";
import { useRouter } from "expo-router";

const Step2 = () => {
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="h-full flex-1 bg-white"
    >
      <ScrollView>
        <View className="mt-[58px] flex items-center justify-center px-6">
          <Image
            source={images.Step2}
            className="h-[90px] w-full"
            resizeMode="contain"
          />

          <View className="relative mt-10 flex w-full gap-10">
            <TextInput
              className="placeholder:body-1 h-[58px] w-full rounded-[10px] border border-gray-20 px-4 placeholder:text-gray-40 focus:border-primary"
              placeholder="인증코드를 입력해주세요"
              accessibilityLabel="인증코드 입력"
              accessibilityHint="인증코드를 입력해주세요"
            />
            <Text className="-translate-y-1/2 body-1 absolute top-1/2 right-4 text-gray-40">
              nn : nn
            </Text>
          </View>

          <TouchableOpacity
            className="mt-10 h-[62px] w-full items-center justify-center rounded-[10px] bg-primary"
            onPress={() => {
              router.replace("/password-reset/step3");
            }}
          >
            <Text className="heading-2 text-white">인증번호 입력</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Step2;
