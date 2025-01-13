import LoadingScreen from "@/components/LoadingScreen";
import PostGrid from "@/components/PostGrid";
import ProfileSection from "@/components/ProfileSection";
import useFetchData from "@/hooks/useFetchData";
import { useModal } from "@/hooks/useModal";
import { getCurrentUser, getMyPosts } from "@/utils/supabase";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyPage() {
  const { openModal } = useModal();

  const { data: currentUser, isLoading: isUserLoading } = useFetchData(
    ["currentUser"],
    getCurrentUser,
    "현재 사용자를 불러올 수 없습니다.",
  );

  const {
    data: posts,
    isLoading: isPostsLoading,
    isError: isPostsError,
    refetch,
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
            onSettingsPress={() =>
              openModal({ type: "SELECT_PROFILE_EDIT" }, "bottom")
            }
          />
          <PostGrid
            refetch={refetch}
            posts={
              posts
                ? posts.map((post) => ({ ...post, id: post.id.toString() }))
                : null
            }
            isError={isPostsError}
          />
        </View>
      </SafeAreaView>
    </>
  );
}
