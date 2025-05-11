import { HeaderWithUsername } from "@/components/Header";
import PostGrid from "@/components/PostGrid";
import ProfileSection from "@/components/ProfileSection";
import { UserOptionsModal } from "@/components/modals/ListModal/UserOptionsModal";
import useFetchData from "@/hooks/useFetchData";
import { useModal } from "@/hooks/useModal";
import {
  getUser,
  getUserPosts,
  subscribeFriendRequest,
  supabase,
} from "@/utils/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const User = () => {
  const { openModal } = useModal();
  const { userId } = useLocalSearchParams();
  const queryClient = useQueryClient();

  const { data: user } = useFetchData(
    ["user", userId],
    () => getUser(userId as string),
    "유저를 불러올 수 없습니다.",
  );

  const {
    data: posts,
    isError: isPostsError,
    refetch,
  } = useFetchData(
    ["posts", userId],
    () => getUserPosts(userId as string),
    "게시물을 불러올 수 없습니다.",
  );

  // 친구 요청이 추가되면 쿼리 다시 패치하도록 정보 구독
  useEffect(() => {
    let requestChannel: RealtimeChannel;

    const handleSubscribe = async () => {
      requestChannel = await subscribeFriendRequest((payload) => {
        if (payload.new.from === userId)
          queryClient.invalidateQueries({ queryKey: ["relation", userId] });
      });
    };

    handleSubscribe();

    return () => {
      supabase.removeChannel(requestChannel);
    };
  }, [userId, queryClient.invalidateQueries]);

  return (
    <>
      <HeaderWithUsername name={user?.username || ""} />
      <SafeAreaView edges={[]} className="flex-1 bg-white">
        <View className="w-full flex-1">
          <ProfileSection
            userId={userId}
            username={user?.username || ""}
            avatarUrl={user?.avatarUrl || undefined}
            description={user?.description || undefined}
            backgroundUrl={user?.backgroundUrl || undefined}
            onSettingsPress={() =>
              openModal(
                <UserOptionsModal reportedId={userId as string} />,
                "bottom",
              )
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
};

export default User;
