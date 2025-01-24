import LoadingScreen from "@/components/LoadingScreen";
import PostGrid from "@/components/PostGrid";
import ProfileSection from "@/components/ProfileSection";
import colors from "@/constants/colors";
import icons from "@/constants/icons";
import useFetchData from "@/hooks/useFetchData";
import { useModal } from "@/hooks/useModal";
import { getCurrentUser, getMyPosts } from "@/utils/supabase";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
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

function PostsTab() {
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

  if (isPostsLoading) {
    return <LoadingScreen />;
  }

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

export default function MyPage() {
  const { openModal } = useModal();
  const { data: currentUser, isLoading: isUserLoading } = useFetchData(
    ["currentUser"],
    getCurrentUser,
    "현재 사용자를 불러올 수 없습니다.",
  );

  if (isUserLoading) {
    return <LoadingScreen />;
  }

  return (
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
        <Tab.Navigator screenOptions={SCREEN_OPTIONS}>
          <Tab.Screen
            name="posts"
            component={PostsTab}
            options={{
              tabBarLabel: ({ focused }) => (
                <TabBarLabel icon={icons.TableListIcon} />
              ),
              tabBarAccessibilityLabel: "게시물 그리드 보기",
            }}
          />
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
  );
}
