import { BackgroundImageOptionsModal } from "@/components/modals/ListModal/BackgroundImageOptionsModal";
import { ProfileImageOptionsModal } from "@/components/modals/ListModal/ProfileImageOptionsModal";
import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import useFetchData from "@/hooks/useFetchData";
import { useModal } from "@/hooks/useModal";
import { getCurrentUser, updateMyProfile } from "@/utils/supabase";
import images from "@constants/images";
import type { ImagePickerAsset } from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
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
  // 뒷배경 이미지는 모달 구분을 위해 분리
  const [backgroundImageUri, setBackgroundImageUri] = useState<
    ImagePickerAsset | string | null
  >(null);

  const { openModal } = useModal();

  // profile 데이터가 로드되면 input 값을 업데이트
  useEffect(() => {
    if (currentUser) {
      setProfileInput({
        avatarUrl: currentUser.avatarUrl || "",
        username: currentUser.username || "",
        description: currentUser.description || "",
      });
      if (currentUser.backgroundUrl) {
        setBackgroundImageUri(currentUser.backgroundUrl);
      }
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
      backgroundUrl: backgroundImageUri,
    });

    router.replace("/mypage");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="h-full flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        // 키보드 올라올 때 버튼 클릭 가능
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => {
            openModal(
              <BackgroundImageOptionsModal
                setBackgroundInput={setBackgroundImageUri}
              />,
            );
          }}
        >
          {backgroundImageUri ? (
            <ImageBackground
              source={{
                uri:
                  typeof backgroundImageUri === "string"
                    ? backgroundImageUri
                    : backgroundImageUri.uri,
              }}
              className="relative aspect-video w-full"
              resizeMode="cover"
            >
              <View className="absolute right-[12px] bottom-[12px] size-[32px] items-center justify-center rounded-full border-2 border-white bg-gray-25">
                <Icons.CameraIcon width={16} height={16} />
              </View>
            </ImageBackground>
          ) : (
            <View className="relative h-[148px] w-full bg-primary">
              <View className="absolute right-[12px] bottom-[12px] size-[32px] items-center justify-center rounded-full border-2 border-white bg-gray-25">
                <Icons.CameraIcon width={16} height={16} />
              </View>
            </View>
          )}
        </TouchableOpacity>
        <View className="relative flex-1">
          <TouchableOpacity
            onPress={() => {
              openModal(
                <ProfileImageOptionsModal setProfileInput={setProfileInput} />,
              );
            }}
            className="absolute top-[-22px] left-[20px] z-50"
          >
            <Image
              source={
                profileInput.avatarUrl
                  ? { uri: profileInput.avatarUrl }
                  : images.AvatarInput
              }
              className="size-[80px] rounded-full border-[3px] border-white"
              resizeMode="cover"
            />
            <View className="absolute bottom-[6px] left-[58px] size-[32px] items-center justify-center rounded-full border-2 border-white bg-gray-25">
              <Icons.CameraIcon width={16} height={16} />
            </View>
          </TouchableOpacity>
          <View className="mt-12 flex items-center justify-center px-6">
            {/* mb-[110px]는 keyboard 올라가는 현상을 위한 class */}
            <View className="mt-10 mb-[110px] flex w-full">
              <TextInput
                className="title-3 h-[58px] w-full rounded-[10px] border border-gray-25 px-4 text-gray-90 focus:border-primary"
                placeholder="닉네임을 입력해주세요."
                placeholderTextColor={colors.gray[60]}
                accessibilityLabel="닉네임 입력"
                accessibilityHint="닉네임을 입력해주세요."
                value={profileInput.username}
                onChangeText={(text) =>
                  setProfileInput({ ...profileInput, username: text })
                }
              />
              <TouchableOpacity
                className="absolute top-[17px] right-[16px]"
                onPress={() =>
                  setProfileInput({ ...profileInput, username: "" })
                }
              >
                <Icons.XIcon color={colors.gray[80]} />
              </TouchableOpacity>
              <TextInput
                className="body-5 mt-[24px] h-[132px] w-full rounded-[10px] border border-gray-25 p-4 text-gray-100 focus:border-primary"
                placeholder="소개글을 입력해주세요."
                placeholderTextColor={colors.gray[60]}
                accessibilityLabel="소개글 입력"
                accessibilityHint="소개글을 입력해주세요"
                multiline={true} // 여러 줄 입력 가능
                numberOfLines={3} // 기본 표시 줄 수
                value={profileInput.description}
                onChangeText={(text) =>
                  setProfileInput({ ...profileInput, description: text })
                }
                textAlignVertical="top"
              />
              <Text className="caption-2 p-[8px] text-gray-80">
                ({profileInput.description.length}/100)
              </Text>
            </View>
          </View>
          <View className="absolute right-0 bottom-[32px] left-0 px-6">
            <TouchableOpacity
              className={`h-[62px] w-full items-center justify-center rounded-[10px] ${
                profileInput.description.length > 100
                  ? "bg-gray-40"
                  : "bg-primary"
              }`}
              onPress={handleEditProfile}
              disabled={profileInput.description.length > 100}
              activeOpacity={0.8}
            >
              <Text className="heading-2 text-white">완료</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Profile;
