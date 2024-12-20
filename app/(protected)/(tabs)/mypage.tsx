import LoadingScreen from "@/components/LoadingScreen";
import CustomModal from "@/components/Modal";
import PostGrid from "@/components/PostGrid";
import ProfileSection from "@/components/ProfileSection";
import useFetchData from "@/hooks/useFetchData";
import { getCurrentUser, getMyPosts } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyPage() {
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { data: currentUser, isLoading: isUserLoading } = useFetchData(
    ["currentUser"],
    getCurrentUser,
    "현재 사용자를 불러올 수 없습니다.",
  );

  const {
    data: posts,
    isLoading: isPostsLoading,
    isError: isPostsError,
  } = useFetchData(
    ["userPosts"],
    () => getMyPosts(),
    "게시물을 불러올 수 없습니다.",
  );

  if (isUserLoading || isPostsLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <SafeAreaView edges={[]} className="flex-1 bg-white">
        <View className="w-full flex-1">
          <ProfileSection
            username={currentUser?.username || ""}
            avatarUrl={currentUser?.avatarUrl || undefined}
            description={currentUser?.description || undefined}
            onSettingsPress={() => setIsModalVisible(true)}
          />
          <PostGrid
            posts={
              posts
                ? posts.map((post) => ({ ...post, id: post.id.toString() }))
                : null
            }
            isError={isPostsError}
          />
        </View>
      </SafeAreaView>
      <CustomModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        position="bottom"
      >
        <View className="items-center">
          <TouchableOpacity
            className="h-[82px] w-full items-center justify-center"
            onPress={() => {
              setIsModalVisible(false);
              router.push("/profile");
            }}
          >
            <Text className="title-2 text-gray-90">수정하기</Text>
          </TouchableOpacity>
        </View>
      </CustomModal>
    </>
  );
}
