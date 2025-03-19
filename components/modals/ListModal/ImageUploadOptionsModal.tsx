import { showToast } from "@/components/ToastConfig";
import { useModal } from "@/hooks/useModal";
import optimizeImage from "@/utils/optimizeImage";
import * as ImagePicker from "expo-image-picker";
import type { ImagePickerOptions, ImagePickerResult } from "expo-image-picker";
import * as Linking from "expo-linking";
import { useCallback } from "react";
import { Alert, Platform } from "react-native";
import type { FlatList } from "react-native-gesture-handler";
import { ListModal } from ".";

export interface ImageItem {
  type: "prev" | "new";
  index: number;
  uri: string;
  imagePickerAsset?: ImagePicker.ImagePickerAsset;
}

export const IMAGE_LIMIT = 5;

export const IMAGE_OPTIONS: ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.5,
  exif: false,
  legacy: Platform.OS === "android",
};

interface ImageUploadOptionsModalProps {
  imageItems: ImageItem[];
  setImageItems: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  flatListRef: React.RefObject<FlatList<ImageItem>>;
  isLoading: boolean;
}

export const ImageUploadOptionsModal: React.FC<
  ImageUploadOptionsModalProps
> = ({ imageItems, setImageItems, flatListRef, isLoading }) => {
  const { closeModal } = useModal();

  const handleImageProcess = useCallback(
    async (result: ImagePickerResult) => {
      if (result.canceled) return;

      try {
        const originUri = result.assets[0].uri;
        const optimizedUri = await optimizeImage(originUri);

        const newImage: ImageItem = {
          type: "new",
          uri: optimizedUri,
          index: imageItems.length,
          imagePickerAsset: {
            ...result.assets[0],
            uri: optimizedUri,
            mimeType: "image/webp",
            width: 520,
            height: 520,
          },
        };

        setImageItems((prev) => [...prev, newImage]);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        showToast("fail", "이미지 처리 중 오류가 발생했습니다.");
      }
    },
    [imageItems, setImageItems, flatListRef],
  );

  const checkPermission = useCallback(async (type: "camera" | "gallery") => {
    const permissionFn =
      type === "camera"
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;

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

  const pickImage = async () => {
    if (isLoading || imageItems.length >= IMAGE_LIMIT) {
      showToast("fail", "이미지는 5개까지 선택가능해요");
      return;
    }

    if (!(await checkPermission("gallery"))) return;

    const result = await ImagePicker.launchImageLibraryAsync(IMAGE_OPTIONS);
    await handleImageProcess(result);
  };

  const takePhoto = async () => {
    if (isLoading || imageItems.length >= IMAGE_LIMIT) {
      showToast("fail", "이미지는 5개까지 선택가능해요");
      return;
    }

    if (!(await checkPermission("camera"))) return;

    const result = await ImagePicker.launchCameraAsync(IMAGE_OPTIONS);
    await handleImageProcess(result);
  };

  return (
    <ListModal
      position="center"
      buttons={[
        {
          text: "카메라",
          onPress: async () => {
            await takePhoto();
            closeModal();
          },
        },
        {
          text: "갤러리",
          onPress: async () => {
            await pickImage();
            closeModal();
          },
        },
      ]}
    />
  );
};
