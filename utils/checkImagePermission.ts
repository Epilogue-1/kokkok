import * as ExpoImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useCallback } from "react";
import { Alert } from "react-native";

// 카메라 / 앨범 권한 체크
const checkPermission = useCallback(async (type: "camera" | "gallery") => {
  const permissionFn =
    type === "camera"
      ? ExpoImagePicker.requestCameraPermissionsAsync
      : ExpoImagePicker.requestMediaLibraryPermissionsAsync;

  const { status } = await permissionFn();

  if (status !== "granted") {
    Alert.alert(
      `${type === "camera" ? "카메라" : "사진"} 접근 권한 필요`,
      `${
        type === "camera" ? "카메라를 사용" : "사진을 업로드"
      }하기 위해 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.`,
      [
        { text: "취소", style: "cancel" },
        { text: "설정으로 이동", onPress: () => Linking.openSettings() },
      ],
    );
    return false;
  }
  return true;
}, []);

export default checkPermission;
