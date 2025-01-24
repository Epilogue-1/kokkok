import { HeaderWithUsername } from "@/components/Header";
import PostGrid from "@/components/PostGrid";
import ProfileSection from "@/components/ProfileSection";
import colors from "@/constants/colors";
import icons from "@/constants/icons";
import useFetchData from "@/hooks/useFetchData";
import { useModal } from "@/hooks/useModal";
import type { RelationType } from "@/types/Friend.interface";
import {
  getRelationship,
  getUser,
  getUserPosts,
  subscribeFriendRequest,
  supabase,
} from "@/utils/supabase";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SvgProps } from "react-native-svg";

const Tab = createMaterialTopTabNavigator();

const SCREEN_OPTIONS = {
  tabBarStyle: {
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "transparent",
    borderBottomColor: colors.gray[20],
    borderBottomWidth: 1,
  },
  tabBarIndicatorStyle: {
    backgroundColor: colors.primary,
  },
} as const;

const TabBarLabel = ({ icon: Icon }: { icon: React.FC<SvgProps> }) => (
  <Icon width={24} height={24} color={colors.gray[90]} />
);

function PostsTab({ userId }: { userId: string }) {
  const {
    data: posts,
    isError: isPostsError,
    refetch,
  } = useFetchData(
    ["posts", userId],
    () => getUserPosts(userId),
    "게시물을 불러올 수 없습니다.",
  );

  return (
    <PostGrid
      refetch={refetch}
      posts={
        posts
          ? posts.map((post) => ({ ...post, id: post.id.toString() }))
          : null
      }
      isError={isPostsError}
    />
  );
}

function EmptyTab() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-gray-50">준비 중입니다</Text>
    </View>
  );
}

const User = () => {
  const { openModal } = useModal();
  const { userId } = useLocalSearchParams();
  const queryClient = useQueryClient();

  const { data: user } = useFetchData(
    ["user", userId],
    () => getUser(userId as string),
    "유저를 불러올 수 없습니다.",
  );

  const { data: relation, isPending: isRelationPending } = useFetchData(
    ["relation", userId],
    () => getRelationship(userId as string),
    "친구 정보를 불러올 수 없습니다.",
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
            username={user?.username || ""}
            avatarUrl={user?.avatarUrl || undefined}
            description={user?.description || undefined}
            onSettingsPress={() =>
              openModal(
                {
                  type: "SELECT_FRIEND_REQUEST",
                  userId: userId as string,
                  relation: relation as RelationType,
                },
                "bottom",
              )
            }
          />
          <Tab.Navigator screenOptions={SCREEN_OPTIONS}>
            <Tab.Screen
              name="posts"
              options={{
                tabBarLabel: ({ focused }) => (
                  <TabBarLabel icon={icons.TableListIcon} />
                ),
                tabBarAccessibilityLabel: "게시물 그리드 보기",
              }}
            >
              {() => <PostsTab userId={userId as string} />}
            </Tab.Screen>
            <Tab.Screen
              name="empty"
              component={EmptyTab}
              options={{
                tabBarLabel: ({ focused }) => (
                  <TabBarLabel icon={icons.WindowListIcon} />
                ),
                tabBarAccessibilityLabel: "게시물 리스트 보기",
                lazy: true,
              }}
            />
          </Tab.Navigator>
        </View>
      </SafeAreaView>
    </>
  );
};

export default User;
