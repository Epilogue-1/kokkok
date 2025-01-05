import { Tabs } from "expo-router";
import { DeviceEventEmitter, Platform, Text, View } from "react-native";

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
          listeners={({ navigation, route }) => ({
            tabPress: () => {
              const state = navigation.getState();
              if (state.routes[state.index].name === route.name) {
                DeviceEventEmitter.emit("SCROLL_HOME_TO_TOP");
              }
            },
          })}
        />
        <Tabs.Screen
          name="friend"
          options={{
            header: () => <HeaderWithNotification name="FRIEND" />,
            title: "Friend",
            tabBarIcon: ({ color }) => <TabIcon color={color} name="FRIEND" />,
          }}
          listeners={({ navigation, route }) => ({
            tabPress: () => {
              const rootState = navigation.getState();
              if (rootState.routes[rootState.index].name === route.name) {
                const nestedState = rootState.routes[rootState.index].state as {
                  index: number;
                  routeNames: string[];
                };
                if (nestedState) {
                  const topTabIndex = nestedState.index;
                  const topTabName = nestedState.routeNames[topTabIndex];
                  if (topTabName === "index") {
                    DeviceEventEmitter.emit("SCROLL_FRIEND_TO_TOP");
                  } else if (topTabName === "request") {
                    DeviceEventEmitter.emit("SCROLL_REQUEST_TO_TOP");
                  }
                } else {
                  DeviceEventEmitter.emit("SCROLL_FRIEND_TO_TOP");
                }
              }
            },
          })}
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
          listeners={({ navigation, route }) => ({
            tabPress: () => {
              const state = navigation.getState();
              if (state.routes[state.index].name === route.name) {
                DeviceEventEmitter.emit("SCROLL_MY_PAGE_TO_TOP");
              }
            },
          })}
        />
      </Tabs>
    </>
  );
}
