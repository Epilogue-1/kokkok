import { useCallback } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import type { FlatList } from "react-native-gesture-handler";

import * as ExpoImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";

import { RELATION_TYPE, type RelationType } from "@/types/Friend.interface";
import type { ListButton, ModalPosition } from "@/types/Modal.interface";

import useManageFriend from "@/hooks/useManageFriend";
import { useModal } from "@/hooks/useModal";
import optimizeImage from "@/utils/optimizeImage";
import { showToast } from "../ToastConfig";

import checkPermission from "@/utils/checkImagePermission";
import ImagePicker from "react-native-image-crop-picker";

/* -------------------------------------------------------------------------- */
/*                                ListModal                                   */
/* -------------------------------------------------------------------------- */
/**
 * 리스트 형태의 모달 창을 보여주는 컴포넌트.
 * @param {ModalPosition} position 모달 위치 (center | bottom)
 * @param {ListButton[]} buttons 버튼 목록
 */
export function ListModal({
  position,
  buttons,
}: {
  position: ModalPosition;
  buttons: ListButton[];
}) {
  const containerPadding = position === "center" ? "px-[46px]" : "";
  const borderRadiusStyle =
    position === "center" ? "rounded-xl" : "rounded-t-xl";

  return (
    <View className={containerPadding}>
      <View className={`items-center bg-white ${borderRadiusStyle}`}>
        {buttons.map((buttonItem, idx) => {
          const isNotLast = idx !== buttons.length - 1;
          const dividerClass = isNotLast ? "border-gray-20 border-b" : "";
          const extraClass = buttonItem.className || "";

          return (
            <TouchableOpacity
              key={buttonItem.text}
              className={`h-[82px] w-full items-center justify-center ${dividerClass} ${extraClass}`}
              onPress={async () => {
                await buttonItem.onPress();
              }}
            >
              <Text className="title-2 text-gray-90">{buttonItem.text}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                      SelectPostEditDeleteModal                             */
/* -------------------------------------------------------------------------- */

// 게시글 수정/삭제 모달
export function SelectPostEditDeleteModal({
  position,
  postId,
}: {
  position: ModalPosition;
  postId: number;
}) {
  const { openModal, closeModal } = useModal();
  const router = useRouter();

  return (
    <ListModal
      position={position}
      buttons={[
        {
          text: "수정",
          onPress: () => {
            closeModal();
            router.push(`/upload?postId=${postId}`);
          },
        },
        {
          text: "삭제",
          onPress: () => {
            openModal({ type: "DELETE_POST", postId }, "center");
          },
        },
      ]}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                       SelectCommentDeleteModal                             */
/* -------------------------------------------------------------------------- */

// 댓글 삭제 모달
export function SelectCommentDeleteModal({
  position,
  postId,
  commentId,
}: {
  position: ModalPosition;
  postId: number;
  commentId: number;
}) {
  const { openModal } = useModal();

  return (
    <ListModal
      position={position}
      buttons={[
        {
          text: "삭제",
          onPress: () => {
            openModal({ type: "DELETE_COMMENT", postId, commentId }, "center");
          },
        },
      ]}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                        SelectProfileImageEditModal                         */
/* -------------------------------------------------------------------------- */
interface ProfileEditModalProps {
  setProfileInput: React.Dispatch<
    React.SetStateAction<{
      avatarUrl: string;
      username: string;
      description: string;
    }>
  >;
}

// 프로필 이미지 선택/삭제 모달
export function SelectProfileImageEditModal({
  setProfileInput,
}: ProfileEditModalProps) {
  const { closeModal } = useModal();

  const requestLibraryPermissions = async () => {
    const { status, accessPrivileges } =
      await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
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

    const result = await ExpoImagePicker.launchImageLibraryAsync({
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
          onPress: () => {
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
}

/* -------------------------------------------------------------------------- */
/*                        SelectProfileEditModal                              */
/* -------------------------------------------------------------------------- */

// 프로필 수정 모달
export function SelectProfileEditModal() {
  const { closeModal } = useModal();
  const router = useRouter();

  return (
    <ListModal
      position={"bottom"}
      buttons={[
        {
          text: "수정하기",
          onPress: () => {
            closeModal();
            router.push("/profile");
          },
        },
      ]}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                             SelectPostUploadImageModal                     */
/* -------------------------------------------------------------------------- */
export interface ImageItem {
  type: "prev" | "new";
  index: number;
  uri: string;
  imagePickerAsset?: {
    uri: string;
    width: number;
    height: number;
    mimeType: string;
  };
}

export const IMAGE_LIMIT = 5;

// 이미지 선택 옵션
// export const IMAGE_OPTIONS: ImagePickerOptions = {
//   mediaTypes: ["images"],
//   allowsEditing: true,
//   quality: 1,
//   exif: false,
//   legacy: Platform.OS === "android",
// };

interface SelectPostUploadImageModalProps {
  imageItems: ImageItem[];
  setImageItems: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  flatListRef: React.RefObject<FlatList<ImageItem>>;
  isLoading: boolean;
}

// 게시글 업로드 이미지 선택(카메라/앨범) 모달
export function SelectPostUploadImageModal({
  imageItems,
  setImageItems,
  flatListRef,
  isLoading,
}: SelectPostUploadImageModalProps) {
  const { closeModal } = useModal();

  // 이미지 최적화 후 처리
  const handleImageProcess = useCallback(
    async (result: {
      canceled: boolean;
      assets: { uri: string; width: number; height: number };
    }) => {
      if (result.canceled) return;

      try {
        const originUri = result.assets.uri;
        const optimizedUri = await optimizeImage(originUri);

        const newImage: ImageItem = {
          type: "new",
          uri: optimizedUri,
          index: imageItems.length,
          imagePickerAsset: {
            uri: optimizedUri,
            mimeType: "image/webp",
            width: (() => {
              const { width, height } = result.assets;
              if (width <= 720 && height <= 720) return width;
              if (width > height) return 720;
              return Math.floor((width / height) * 720);
            })(),
            height: (() => {
              const { width, height } = result.assets;
              if (width <= 720 && height <= 720) return height;
              if (width > height) return Math.floor((height / width) * 720);
              return 720;
            })(),
          },
        };

        setImageItems((prev) => [...prev, newImage]);

        // 이미지 추가 후 자동 스크롤
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        showToast("fail", "이미지 처리 중 오류가 발생했습니다.");
      }
    },
    [imageItems, setImageItems, flatListRef],
  );

  // 갤러리에서 이미지 선택
  const pickImage = async () => {
    if (isLoading || imageItems.length >= IMAGE_LIMIT) {
      showToast("fail", "이미지는 5개까지 선택가능해요");
      return;
    }

    if (!(await checkPermission("gallery"))) return;

    const result = await ImagePicker.openPicker({
      cropping: true,
      multiple: false,
      mediaType: "photo",
      compressImageQuality: 1,
      includeBase64: false,
      freeStyleCropEnabled: true,
    }).then((res) => {
      return {
        canceled: false,
        assets: {
          uri: res.path,
          width: res.width,
          height: res.height,
        },
      };
    });

    await handleImageProcess(result);
  };

  // 카메라 촬영
  const takePhoto = async () => {
    if (isLoading || imageItems.length >= IMAGE_LIMIT) {
      showToast("fail", "이미지는 5개까지 선택가능해요");
      return;
    }

    if (!(await checkPermission("camera"))) return;

    const result = await ImagePicker.openCamera({
      cropping: true,
      multiple: false,
      mediaType: "photo",
      compressImageQuality: 1,
      includeBase64: false,
      freeStyleCropEnabled: true,
    }).then((res) => {
      return {
        canceled: false,
        assets: {
          uri: res.path,
          width: res.width,
          height: res.height,
        },
      };
    });

    await handleImageProcess(result);
  };

  return (
    <ListModal
      position={"center"}
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
}

/* -------------------------------------------------------------------------- */
/*                          SelectFriendRequestModal                          */
/* -------------------------------------------------------------------------- */
export function SelectFriendRequestModal({
  userId,
  relation,
}: {
  userId: string;
  relation: RelationType;
}) {
  const { useUnfriend, useAcceptRequest, useCreateRequest } = useManageFriend();
  const { mutate: handleUnfriend } = useUnfriend();
  const { mutate: handleAccept } = useAcceptRequest();
  const { mutate: handleCreate } = useCreateRequest();
  const { closeModal } = useModal();

  // 버튼 라벨과 핸들러를 relation 상태에 따라 매핑
  const FRIEND_REQUEST_BUTTON_CONFIG = {
    [RELATION_TYPE.FRIEND]: {
      label: "친구 끊기",
      onPress: () => handleUnfriend({ toUserId: userId }),
    },
    [RELATION_TYPE.ASKING]: {
      label: "친구 요청 취소",
      onPress: () => handleUnfriend({ toUserId: userId }),
    },
    [RELATION_TYPE.ASKED]: {
      label: "친구 요청 수락",
      onPress: () => handleAccept({ fromUserId: userId }),
    },
    [RELATION_TYPE.NONE]: {
      label: "친구 요청",
      onPress: () => handleCreate({ toUserId: userId }),
    },
  };

  const { label, onPress } = FRIEND_REQUEST_BUTTON_CONFIG[relation];

  return (
    <View className="items-center rounded-t-xl bg-white">
      <TouchableOpacity
        className="h-[82px] w-full items-center justify-center"
        onPress={() => {
          onPress();
          closeModal();
        }}
      >
        <Text className="title-2 text-gray-90">{label}</Text>
      </TouchableOpacity>
    </View>
  );
}
