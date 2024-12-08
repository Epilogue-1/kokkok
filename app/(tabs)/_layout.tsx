import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, Text, View } from "react-native";

import { HeaderWithBack, HeaderWithNotification } from "@/components/Header";
import useSubscribeNotification from "@/hooks/useSubscribeNotification";
import colors from "@constants/colors";
import icons from "@constants/icons";

/* constants */

const TAP_ICONS = {
  HOME: (color: string) => (
    <icons.HomeIcon width={24} height={24} color={color} />
  ),
  FRIEND: (color: string) => (
    <icons.FriendIcon width={24} height={24} color={color} />
  ),
  HISTORY: (color: string) => (
    <icons.CalendarIcon width={24} height={24} color={color} />
  ),
  MY_PAGE: (color: string) => (
    <icons.ProfileIcon width={24} height={24} color={color} />
  ),
} as const;
type TapType = keyof typeof TAP_ICONS;

const TAP_NAME = {
  HOME: "홈",
  FRIEND: "친구",
  HISTORY: "기록",
  MY_PAGE: "마이",
};

/* components */

const TabIcon = ({
  color,
  name,
}: {
  color: string;
  name: TapType;
}) => (
  <View className="w-fit items-center justify-center gap-0">
    {TAP_ICONS[name](color)}
    <Text className="caption-1" style={{ color }}>
      {TAP_NAME[name]}
    </Text>
  </View>
);

export default function TabsLayout() {
  useSubscribeNotification();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.gray[90],
          tabBarInactiveTintColor: colors.gray[55],
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderTopColor: colors.gray[20],
            height: 80,
            flexDirection: "row",
            ...(Platform.OS === "android" && {
              paddingBottom: 24,
              justifyContent: "center",
              alignItems: "center",
            }),
            ...(Platform.OS === "ios" && { paddingTop: 8 }),
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            header: () => <HeaderWithNotification name="HOME" />,
            title: "Home",
            tabBarIcon: ({ color }) => <TabIcon color={color} name="HOME" />,
          }}
        />
        <Tabs.Screen
          name="friend"
          options={{
            header: () => <HeaderWithNotification name="FRIEND" />,
            title: "Friend",
            tabBarIcon: ({ color }) => <TabIcon color={color} name="FRIEND" />,
          }}
        />
        <Tabs.Screen
          name="upload"
          options={{
            header: () => <HeaderWithBack name="UPLOAD" />,
            title: "Upload",
            tabBarStyle: { display: "none" },
            tabBarIcon: () => (
              <View className="size-12 items-center justify-center rounded-full bg-primary p-3">
                <icons.PlusIcon width={24} height={24} color={colors.white} />
              </View>
            ),
            href: "/upload",
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            header: () => <HeaderWithNotification name="HISTORY" />,
            title: "History",
            tabBarIcon: ({ color }) => <TabIcon color={color} name="HISTORY" />,
          }}
        />
        <Tabs.Screen
          name="mypage"
          options={{
            header: () => <HeaderWithNotification name="MY_PAGE" />,
            title: "MyPage",
            tabBarIcon: ({ color }) => <TabIcon color={color} name="MY_PAGE" />,
          }}
        />
      </Tabs>

      <StatusBar style="auto" />
    </>
  );
}
