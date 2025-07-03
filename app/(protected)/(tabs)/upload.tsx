import { showToast } from "@/components/ToastConfig";
import {
  type ImageItem,
  ImageUploadOptionsModal,
} from "@/components/modals/ListModal/ImageUploadOptionsModal";
import { PostUploadErrorModal } from "@/components/modals/SingleButtonModal/PostUploadErrorModal";
import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import useCheckPrivacy, {
  saveUploadPrivacy,
  type PrivacySetting,
} from "@/hooks/useCheckPrivacy";
import useFetchData from "@/hooks/useFetchData";
import { useModal } from "@/hooks/useModal";
import { NOTIFICATION_TYPE } from "@/types/Notification.interface";
import { formatDate } from "@/utils/formatDate";
import {
  addWorkoutHistory,
  createNotification,
  createPost,
  getPost,
  getUsersWhoFavoritedMe,
  isWorkoutDoneToday,
  updatePost,
} from "@/utils/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import type { FlatList } from "react-native-gesture-handler";

// 이미지 최대 개수 및 옵션 설정
const IMAGE_LIMIT = 5;
const QUERY_KEYS = ["posts", "histories", "userPosts"];

export default function Upload() {
  const params = useLocalSearchParams<{ postId?: string }>();
  const postId = params.postId ? Number(params.postId) : undefined;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { openModal } = useModal();
  const { uploadPrivacy } = useCheckPrivacy();

  // 낙관적 업데이트를 위한 로컬 상태 추가
  const [localPrivacy, setLocalPrivacy] =
    useState<PrivacySetting>(uploadPrivacy);

  // uploadPrivacy가 외부에서 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    setLocalPrivacy(uploadPrivacy);
  }, [uploadPrivacy]);

  // 상태 정의
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [contents, setContents] = useState<string>("");
  const [originalPrivacy, setOriginalPrivacy] = useState<PrivacySetting>("all");
  const flatListRef = useRef<FlatList<ImageItem> | null>(null);

  // 게시글 데이터를 불러오는 훅
  const { data: post, refetch } = useFetchData(
    ["post", postId],
    () => (postId ? getPost(postId) : Promise.resolve(null)),
    "게시글을 불러오는 도중 에러가 발생했습니다.",
    postId !== undefined,
  );

  // 에러 모달 표시
  const postUploadFailModal = () => openModal(<PostUploadErrorModal />);

  // 쿼리 무효화
  const invalidateQueries = useCallback(() => {
    for (const key of [...QUERY_KEYS, ["post", postId]]) {
      queryClient.invalidateQueries({
        queryKey: Array.isArray(key) ? key : [key],
      });
    }
  }, [queryClient, postId]);

  // 폼 초기화 함수
  const resetForm = useCallback(() => {
    setImageItems([]);
    setContents("");
  }, []);

  // 게시글 작성 뮤테이션
  const uploadPostMutation = useMutation({
    mutationFn: () => {
      const newImages = imageItems
        .filter((item) => item.type === "new")
        .map((item) => item.imagePickerAsset!)
        .filter(Boolean);
      return createPost({
        contents,
        images: newImages,
        privacy: localPrivacy,
      });
    },
    onSuccess: () => {
      showToast("success", "글이 작성되었어요!");
      invalidateQueries();
      resetForm();
      router.back();
    },
    onError: postUploadFailModal,
  });

  // 게시글 수정 뮤테이션
  const editPostMutation = useMutation({
    mutationFn: () => {
      if (!postId) throw new Error("게시물 ID가 없습니다.");

      const sortedImages = imageItems.sort((a, b) => a.index - b.index);
      const [prevImages, newImages] = sortedImages.reduce<
        [
          ImageItem[],
          { imagePickerAsset: ImagePicker.ImagePickerAsset; index: number }[],
        ]
      >(
        ([prev, next], item) => {
          if (item.type === "prev") {
            prev.push({
              uri: item.uri,
              index: item.index,
              type: "prev",
            });
          } else if (item.imagePickerAsset) {
            next.push({
              imagePickerAsset: item.imagePickerAsset,
              index: item.index,
            });
          }
          return [prev, next];
        },
        [[], []],
      );

      return updatePost({
        postId,
        contents,
        images: newImages,
        prevImages,
        privacy: localPrivacy,
      });
    },
    onSuccess: () => {
      showToast("success", "글이 수정되었어요!");
      invalidateQueries();
      resetForm();
      router.push("/home");
    },
    onError: postUploadFailModal,
  });

  // 운동 기록 추가 뮤테이션
  const addWorkoutHistoryMutation = useMutation({
    mutationFn: () => addWorkoutHistory({ date: formatDate(new Date()) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["histories"] });
    },
    onError: postUploadFailModal,
  });

  // 즐겨찾기 알림 뮤테이션
  const sendNotificationMutation = useMutation({
    mutationFn: async () => {
      try {
        // 나를 즐겨찾기한 유저들 조회
        const favoritedData = await getUsersWhoFavoritedMe();

        const results = await Promise.allSettled(
          favoritedData.map((favorited) => {
            createNotification({
              to: favorited.userId,
              type: NOTIFICATION_TYPE.FAVORITE,
            });
          }),
        );

        // 실패한 알림 개수 경고 표시
        const failed = results.filter((r) => r.status === "rejected");
        if (failed.length > 0) {
          console.warn(`알림 전송 실패 ${failed.length}건`);
        }
      } catch (error) {
        console.error(
          "즐겨찾기 알림 전송 실패: sendNotificationMutation",
          error,
        );
      }
    },
  });

  // 로딩 상태 통합
  const isLoading =
    uploadPostMutation.isPending ||
    addWorkoutHistoryMutation.isPending ||
    editPostMutation.isPending;

  // 게시글 업로드 처리
  const handleUpload = async () => {
    if (imageItems.length === 0) {
      Alert.alert("알림", "이미지를 추가해주세요.");
      return;
    }

    if (isLoading) return;

    try {
      if (postId) {
        await editPostMutation.mutateAsync();
      } else {
        // 게시글 업로드
        await uploadPostMutation.mutateAsync();

        // 오늘 첫 업로드라면, 나를 즐겨찾기한 유저들에게 알람 전송
        const isDone = await isWorkoutDoneToday();
        if (!isDone) {
          await sendNotificationMutation.mutateAsync();
        }

        // 운동 기록 추가
        await addWorkoutHistoryMutation.mutateAsync();
      }
    } catch {
      postUploadFailModal();
    }
  };

  // 화면이 포커스될 때 게시글 불러오기
  useFocusEffect(
    useCallback(() => {
      if (!postId) {
        resetForm();
        return;
      }

      refetch().then((data) => {
        if (!data?.data) {
          resetForm();
          return;
        }

        const prevImageItems: ImageItem[] = (data.data.images ?? []).map(
          (uri, index) => ({ type: "prev", uri, index }),
        );

        setImageItems(prevImageItems);
        setContents(data.data.contents ?? "");

        // 원본 게시물의 프라이버시 설정 저장
        if (data.data.privacy) {
          setOriginalPrivacy(data.data.privacy as PrivacySetting);
          // 수정 화면을 열 때는 게시물의 원래 프라이버시 설정으로 초기화
          setLocalPrivacy(data.data.privacy as PrivacySetting);
        }
      });
    }, [postId, refetch, resetForm]),
  );

  // 변경 여부 확인 (프라이버시 변경 감지 추가)
  const hasContentChanged = post?.contents !== contents;
  const hasImagesChanged =
    imageItems.some((item) => item.type === "new") ||
    imageItems.length !== post?.images?.length ||
    imageItems
      .filter((item) => item.type === "prev")
      .some((item, idx) => item.uri !== post?.images?.[idx]);

  // 프라이버시 설정 변경 감지 로직 추가
  const hasPrivacyChanged = postId && originalPrivacy !== localPrivacy;

  // 버튼 비활성화 조건 (프라이버시 변경 감지 포함)
  const isButtonDisabled =
    isLoading ||
    (postId
      ? !hasContentChanged && !hasImagesChanged && !hasPrivacyChanged
      : imageItems.length === 0);

  // 버튼 텍스트
  const getButtonText = () => {
    if (uploadPostMutation.isPending) return "인증 중...";
    if (editPostMutation.isPending) return "수정 중...";
    return postId ? "수정" : "인증";
  };

  // 프라이버시 변경 핸들러
  const handlePrivacyChange = (privacy: PrivacySetting) => {
    // 이미 같은 설정이면 동작하지 않음
    if (localPrivacy === privacy) return;

    // 낙관적 업데이트
    const previousPrivacy = localPrivacy;
    setLocalPrivacy(privacy);

    // 수정 화면일 경우 AsyncStorage 저장하지 않음
    if (!postId) {
      // 게시물 생성 모드일 때만 AsyncStorage에 저장
      saveUploadPrivacy(privacy).catch((error) => {
        // 저장 실패 시 원래 상태로 복원하고 오류 알림
        console.error("프라이버시 설정 저장 실패:", error);
        setLocalPrivacy(previousPrivacy);
      });
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        horizontal={false}
      >
        {/* 공개 범위 설정 */}
        <View className="mx-[16px] mt-[24px] h-[44px] flex-row items-center justify-center rounded-[10px] border border-gray-20 bg-gray-10 ">
          <TouchableOpacity
            onPress={() => handlePrivacyChange("all")}
            activeOpacity={0.7}
            className={`mx-[-1px] h-[44px] flex-1 flex-row items-center justify-center gap-[12px] rounded-[10px] ${
              localPrivacy === "all"
                ? "border-[1.5px] border-primary bg-white"
                : ""
            }`}
            disabled={isLoading}
          >
            <Icons.EarthIcon
              width={20}
              height={20}
              color={localPrivacy === "all" ? colors.primary : colors.gray[65]}
            />
            <Text
              className={
                localPrivacy === "all"
                  ? "title-5 text-primary"
                  : "body-3 text-gray-65"
              }
            >
              전체 공개
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handlePrivacyChange("friend")}
            activeOpacity={0.7}
            className={`mx-[-1px] h-[44px] flex-1 flex-row items-center justify-center gap-[12px] rounded-[10px] ${
              localPrivacy === "friend"
                ? "border-[1.5px] border-primary bg-white"
                : ""
            }`}
            disabled={isLoading}
          >
            <Icons.PeopleIcon
              width={20}
              height={20}
              color={
                localPrivacy === "friend" ? colors.primary : colors.gray[65]
              }
            />
            <Text
              className={
                localPrivacy === "friend"
                  ? "title-5 text-primary"
                  : "body-3 text-gray-65"
              }
            >
              친구 공개
            </Text>
          </TouchableOpacity>
        </View>

        {/* 이미지 리스트 (드래그 가능) */}
        <DraggableFlatList
          ref={flatListRef}
          horizontal
          data={imageItems}
          onDragEnd={({ data }) =>
            setImageItems(data.map((item, index) => ({ ...item, index })))
          }
          keyExtractor={(item, index) => `${item.type}-${item.uri}-${index}`}
          renderItem={({ item, drag, getIndex }) => (
            <ScaleDecorator>
              <TouchableOpacity
                onLongPress={drag}
                delayLongPress={200}
                activeOpacity={0.7}
                className="relative"
                disabled={isLoading}
              >
                <Image
                  source={{ uri: item.uri }}
                  className="size-[152px] rounded-[15px]"
                />
                <TouchableOpacity
                  className="-top-3 -right-3 absolute size-[25.5px] items-center justify-center rounded-full border-[1.5px] border-white bg-gray-25"
                  onPress={() =>
                    setImageItems((prev) =>
                      prev.filter((_, idx) => idx !== getIndex()),
                    )
                  }
                  disabled={isLoading}
                >
                  <Icons.XIcon width={16} height={16} color={colors.white} />
                </TouchableOpacity>
              </TouchableOpacity>
            </ScaleDecorator>
          )}
          className="flex-shrink-0 flex-grow-0 px-[16px] py-[24px]"
          contentContainerStyle={{ gap: 16 }}
          autoscrollSpeed={70}
          activationDistance={5}
          dragHitSlop={{ top: 0, bottom: 0, left: 10, right: 10 }}
          showsHorizontalScrollIndicator={false}
          dragItemOverflow={true}
          scrollEnabled={true}
          ListFooterComponent={
            imageItems.length < IMAGE_LIMIT ? (
              <TouchableOpacity
                className="size-[152px] items-center justify-center rounded-[15px] bg-gray-25"
                onPress={() =>
                  openModal(
                    <ImageUploadOptionsModal
                      flatListRef={flatListRef}
                      imageItems={imageItems}
                      setImageItems={setImageItems}
                      isLoading={isLoading}
                    />,
                  )
                }
                disabled={isLoading}
              >
                <Icons.CameraAddIcon
                  width={24}
                  height={24}
                  color={colors.white}
                />
              </TouchableOpacity>
            ) : null
          }
        />

        {/* 글 입력란 */}
        <View className="w-full items-center justify-center px-[16px]">
          <TextInput
            className="body-1 h-[150px] w-full rounded-[15px] border border-gray-20 bg-gray-10 p-4 text-gray-100"
            placeholder="자유롭게 글을 적어주세요. (선택)"
            placeholderTextColor={colors.gray[40]}
            multiline
            textAlignVertical="top"
            value={contents}
            onChangeText={setContents}
            editable={!isLoading}
          />
        </View>

        {/* 인증 버튼 */}
        <View
          className={`mt-auto px-6 ${Platform.OS === "ios" ? "pb-[48px]" : "pb-[32px]"}`}
        >
          <TouchableOpacity
            className="mt-8 h-[62px] w-full items-center justify-center rounded-[10px] bg-primary disabled:bg-gray-20"
            onPress={handleUpload}
            disabled={isButtonDisabled}
          >
            <Text className="heading-2 text-white">{getButtonText()}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
