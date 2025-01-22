import Icons from "@/constants/icons";
import useFetchData from "@/hooks/useFetchData";
import { useModal } from "@/hooks/useModal";
import { getCurrentUser, updateMyProfile } from "@/utils/supabase";
import images from "@constants/images";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Profile = () => {
  const { data: currentUser } = useFetchData(
    ["currentUser"],
    getCurrentUser,
    "현재 사용자를 불러올 수 없습니다.",
  );

  const [profileInput, setProfileInput] = useState({
    avatarUrl: currentUser?.avatarUrl || "",
    username: currentUser?.username || "",
    description: currentUser?.description || "",
  });

  const { openModal } = useModal();

  // profile 데이터가 로드되면 input 값을 업데이트
  useEffect(() => {
    if (currentUser) {
      setProfileInput({
        avatarUrl: currentUser.avatarUrl || "",
        username: currentUser.username || "",
        description: currentUser.description || "",
      });
    }
  }, [currentUser]);

  const router = useRouter();

  const handleEditProfile = async () => {
    if (profileInput.username.trim().length < 3) {
      Alert.alert("닉네임은 3글자 이상이어야 합니다.");
      return;
    }

    await updateMyProfile({
      ...profileInput,
      avatarUrl: profileInput.avatarUrl
        ? { uri: profileInput.avatarUrl, width: 500, height: 500 }
        : undefined,
    });

    router.replace("/mypage");
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="h-full flex-1 bg-white"
      >
        <ScrollView>
          <View className="mt-12 flex items-center justify-center px-6">
            <TouchableOpacity
              onPress={() => {
                openModal({
                  type: "SELECT_PROFILE_IMAGE_EDIT",
                  setProfileInput: setProfileInput,
                });
              }}
              className="relative"
            >
              <Image
                source={
                  profileInput.avatarUrl
                    ? { uri: profileInput.avatarUrl }
                    : images.AvatarInput
                }
                className="size-[236px] rounded-full"
                resizeMode="cover"
              />
              <Icons.CameraIcon
                style={{ position: "absolute", bottom: 12, right: 14 }}
              />
            </TouchableOpacity>

            <View className="mt-10 flex w-full gap-10">
              <TextInput
                className="placeholder:body-1 h-[58px] w-full rounded-[10px] border border-gray-20 px-4 focus:border-primary"
                placeholder="닉네임을 입력해주세요."
                accessibilityLabel="닉네임 입력"
                accessibilityHint="닉네임을 입력해주세요."
                value={profileInput.username}
                onChangeText={(text) =>
                  setProfileInput({ ...profileInput, username: text })
                }
              />
              <TextInput
                className="placeholder:body-1 h-[108px] w-full rounded-[10px] border border-gray-20 p-4 focus:border-primary"
                placeholder="소개글을 입력해주세요."
                accessibilityLabel="소개글 입력"
                accessibilityHint="소개글을 입력해주세요."
                multiline={true} // 여러 줄 입력 가능
                numberOfLines={4} // 기본 표시 줄 수
                value={profileInput.description}
                onChangeText={(text) =>
                  setProfileInput({ ...profileInput, description: text })
                }
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              className="mt-12 h-[62px] w-full items-center justify-center rounded-[10px] bg-primary"
              onPress={handleEditProfile}
            >
              <Text className="heading-2 text-white">완료</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default Profile;
