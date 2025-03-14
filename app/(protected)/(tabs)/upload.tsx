import { showToast } from "@/components/ToastConfig";
import type { ImageItem } from "@/components/modals/ListModals";
import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import useFetchData from "@/hooks/useFetchData";
import { useModal } from "@/hooks/useModal";
import { formatDate } from "@/utils/formatDate";
import {
  addWorkoutHistory,
  createPost,
  getPost,
  updatePost,
} from "@/utils/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
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

export default function Upload() {
  const params = useLocalSearchParams<{ postId?: string }>();
  const postId = params.postId ? Number(params.postId) : undefined;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { openModal } = useModal();

  // 상태 정의
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [contents, setContents] = useState<string>("");
  const flatListRef = useRef<FlatList<ImageItem> | null>(null);

  const postUploadFailModal = () => {
    openModal({ type: "POST_UPLOAD_FAIL" });
  };

  // 게시글 데이터를 불러오는 훅
  const { data: post, refetch } = useFetchData(
    ["post", postId],
    () => (postId ? getPost(postId) : Promise.resolve(null)),
    "게시글을 불러오는 도중 에러가 발생했습니다.",
    postId !== undefined,
  );

  // 게시글 작성 뮤테이션
  const uploadPostMutation = useMutation({
    mutationFn: () => {
      const newImages = imageItems
        .filter((item) => item.type === "new")
        .map((item) => item.imagePickerAsset!)
        .filter(Boolean);
      return createPost({ contents, images: newImages });
    },
    onSuccess: () => {
      showToast("success", "글이 작성되었어요!");

      // 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["histories"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });

      // 폼 초기화
      resetForm();

      router.back();
    },
    onError: () => postUploadFailModal(),
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

      return updatePost({ postId, contents, images: newImages, prevImages });
    },
    onSuccess: () => {
      showToast("success", "글이 수정되었어요!");

      // 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });

      // 폼 초기화
      resetForm();

      router.push("/home");
    },
    onError: () => postUploadFailModal(),
  });

  // 운동 기록 추가 뮤테이션
  const addWorkoutHistoryMutation = useMutation({
    mutationFn: () => addWorkoutHistory({ date: formatDate(new Date()) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["histories"] });
    },
    onError: () => postUploadFailModal(),
  });

  // 폼 초기화 함수
  const resetForm = useCallback(() => {
    setImageItems([]); // 이미지 목록 초기화
    setContents(""); // 내용 초기화
  }, []);

  // 게시글 업로드 처리
  const handleUpload = async () => {
    if (imageItems.length === 0) {
      Alert.alert("알림", "이미지를 추가해주세요.");
      return;
    }

    if (
      uploadPostMutation.isPending ||
      addWorkoutHistoryMutation.isPending ||
      editPostMutation.isPending
    )
      return;

    try {
      if (postId) {
        // 게시글 수정
        await editPostMutation.mutateAsync();
      } else {
        // 운동 기록 추가
        await addWorkoutHistoryMutation.mutateAsync();
        // 게시글 업로드
        await uploadPostMutation.mutateAsync();
      }
    } catch {
      postUploadFailModal();
    }
  };

  // 화면이 포커스될 때 게시글 불러오기
  useFocusEffect(
    useCallback(() => {
      // 게시글 ID가 없으면 폼 초기화
      if (!postId) {
        resetForm();
        return;
      }

      // 게시글 불러오기
      refetch().then((data) => {
        if (!data?.data) {
          resetForm();
          return;
        }

        const prevImageItems: ImageItem[] = (data.data.images ?? []).map(
          (uri, index) => ({ type: "prev", uri, index }),
        ); // 기존 이미지 목록 설정

        setImageItems(prevImageItems);
        setContents(data.data.contents ?? "");
      });
    }, [postId, refetch, resetForm]),
  );

  // 내용 변경 여부 확인
  const hasContentChanged = post?.contents !== contents;
  // 이미지 변경 여부 확인
  const hasImagesChanged =
    imageItems.some((item) => item.type === "new") || // 새 이미지 추가 여부
    imageItems.length !== post?.images?.length || // 이미지 개수 변경 여부
    imageItems
      .filter((item) => item.type === "prev")
      .some((item, idx) => item.uri !== post?.images?.[idx]); // 기존 이미지 변경 여부 확인

  return (
    <>
      <View className="flex-1 bg-white">
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
                disabled={uploadPostMutation.isPending}
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
                  disabled={uploadPostMutation.isPending}
                >
                  <Icons.XIcon width={16} height={16} color={colors.white} />
                </TouchableOpacity>
              </TouchableOpacity>
            </ScaleDecorator>
          )}
          className="flex-shrink-0 flex-grow-0 pt-6"
          contentContainerStyle={{ gap: 16 }}
          containerStyle={{ paddingHorizontal: 16 }}
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
                  openModal({
                    type: "SELECT_POST_UPLOAD_IMAGE",
                    imageItems,
                    setImageItems,
                    flatListRef,
                    isLoading: uploadPostMutation.isPending,
                  })
                }
                disabled={uploadPostMutation.isPending}
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
        <View className="w-full items-center justify-center px-6 pt-7">
          <TextInput
            className="body-1 h-[150px] w-full rounded-[15px] border border-gray-20 bg-gray-10 p-4 text-gray-100"
            placeholder="자유롭게 글을 적어주세요. (선택)"
            placeholderTextColor={colors.gray[40]}
            multiline
            textAlignVertical="top"
            value={contents}
            onChangeText={setContents}
            editable={!uploadPostMutation.isPending}
          />
        </View>

        {/* 인증 버튼 */}
        <View
          className={`flex-1 justify-end px-6 ${Platform.OS === "ios" ? "pb-[48px]" : "pb-[32px]"}`}
        >
          <TouchableOpacity
            className="mt-8 h-[62px] w-full items-center justify-center rounded-[10px] bg-primary disabled:bg-gray-20"
            onPress={handleUpload}
            disabled={
              uploadPostMutation.isPending ||
              (postId
                ? !hasContentChanged && !hasImagesChanged
                : imageItems.length === 0 && contents === "")
            }
          >
            <Text className="heading-2 text-white">
              {uploadPostMutation.isPending ? "인증중..." : "인증"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
