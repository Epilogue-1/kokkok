import { useModal } from "@/hooks/useModal";
import * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";
import { ListModal } from ".";

interface ProfileImageOptionsModalProps {
  setProfileInput: React.Dispatch<
    React.SetStateAction<{
      avatarUrl: string;
      username: string;
      description: string;
    }>
  >;
}

export const ProfileImageOptionsModal: React.FC<
  ProfileImageOptionsModalProps
> = ({ setProfileInput }) => {
  const { closeModal } = useModal();

  const requestLibraryPermissions = async (): Promise<boolean> => {
    const { status, accessPrivileges } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    const isDenied = status !== "granted" && accessPrivileges !== "limited";

    if (isDenied) {
      Alert.alert(
        "사진 접근 권한 필요",
        "사진을 업로드하기 위해 사진 라이브러리 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.",
        [
          { text: "취소", style: "cancel" },
          {
            text: "설정으로 이동",
            onPress: () => Linking.openURL("app-settings:"),
          },
        ],
      );
      return false;
    }
    return true;
  };

  const handleAvatarPress = async () => {
    const allowed = await requestLibraryPermissions();
    if (!allowed) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileInput((prev) => ({
        ...prev,
        avatarUrl: result.assets[0].uri,
      }));
    }
  };

  return (
    <ListModal
      position="center"
      buttons={[
        {
          text: "앨범 선택",
          onPress: async () => {
            await handleAvatarPress();
            closeModal();
          },
        },
        {
          text: "이미지 삭제",
          onPress: async () => {
            setProfileInput((prev) => ({
              ...prev,
              avatarUrl: "",
            }));
            closeModal();
          },
        },
      ]}
    />
  );
};
