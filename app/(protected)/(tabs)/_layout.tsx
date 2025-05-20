import type {
  NavigationState,
  ParamListBase,
  RouteProp,
  TabNavigationState,
} from "@react-navigation/native";
import { Tabs } from "expo-router";
import {
  Animated,
  DeviceEventEmitter,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  HeaderWithBack,
  HeaderWithNotification,
  HeaderWithPrivacy,
} from "@/components/Header";
import useSubscribeNotification from "@/hooks/useSubscribeNotification";
import colors from "@constants/colors";
import icons from "@constants/icons";
import { useEffect, useRef } from "react";

/* constants */

const TAB_NAME = {
  HOME: "홈",
  FRIEND: "친구",
  HISTORY: "기록",
  MY_PAGE: "마이",
} as const;

type TabType = keyof typeof TAB_NAME;

const TAB_PRESS_EVENT = {
  HOME: "HOME_TAB_PRESSED",
  FRIEND: "FRIEND_TAB_PRESSED",
  HISTORY: "HISTORY_TAB_PRESSED",
  MY_PAGE: "MY_PAGE_TAB_PRESSED",
} as const;

const SCROLL_EVENTS = {
  HOME: "SCROLL_HOME_TO_TOP",
  FRIEND: "SCROLL_FRIEND_TO_TOP",
  HISTORY: "SCROLL_HISTORY_TO_TOP",
  MY_PAGE: "SCROLL_MY_PAGE_TO_TOP",
} as const;

const FRIEND_TAB_SCROLL_EVENTS = {
  INDEX: "SCROLL_FRIEND_TO_TOP",
  REQUEST: "SCROLL_REQUEST_TO_TOP",
} as const;

const ICON_TYPE = {
  line: {
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
  },
  filled: {
    HOME: (color: string) => (
      <icons.HomeFilledIcon width={24} height={24} color={color} />
    ),
    FRIEND: (color: string) => (
      <icons.FriendFilledIcon width={24} height={24} color={color} />
    ),
    HISTORY: (color: string) => (
      <icons.CalendarFilledIcon width={24} height={24} color={color} />
    ),
    MY_PAGE: (color: string) => (
      <icons.ProfileFilledIcon width={24} height={24} color={color} />
    ),
  },
};

/* components */

const TabIcon = ({
  color,
  name,
  focused,
}: {
  color: string;
  name: TabType;
  focused: boolean;
}) => {
  const fadeAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    const triggerAnimation = () => {
      Animated.timing(fadeAnim, {
        toValue: focused ? 1 : 0,
        duration: 150,
        useNativeDriver: true,
      }).start();

      if (focused) {
        scaleAnim.setValue(0);
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 10,
          bounciness: 20,
        }).start();
      }
    };

    triggerAnimation();

    const listener = DeviceEventEmitter.addListener(
      TAB_PRESS_EVENT[name],
      triggerAnimation,
    );
    return () => listener.remove();
  }, [focused, fadeAnim, scaleAnim, name]);

  return (
    <View className="w-full items-center justify-center gap-0">
      <View style={{ width: 24, height: 24 }}>
        <Animated.View
          style={{
            position: "absolute",
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
            transform: [
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.8],
                }),
              },
            ],
          }}
        >
          {ICON_TYPE.line[name](color)}
        </Animated.View>
        <Animated.View
          style={{
            position: "absolute",
            opacity: fadeAnim,
            transform: [
              {
                scale: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.3, 1],
                }),
              },
            ],
          }}
        >
          {ICON_TYPE.filled[name](color)}
        </Animated.View>
      </View>
      <Text
        className="caption-1"
        numberOfLines={1}
        style={{
          color,
          minWidth: 50,
          minHeight: 20,
          textAlign: "center",
        }}
      >
        {TAB_NAME[name]}
      </Text>
    </View>
  );
};

const createTabPressHandler = (
  name: TabType,
  navigation: {
    getState: () => NavigationState | TabNavigationState<ParamListBase>;
  },
  route: RouteProp<ParamListBase, string>,
) => {
  if (name === "FRIEND") {
    return () => {
      DeviceEventEmitter.emit(TAB_PRESS_EVENT[name]);

      const rootState = navigation.getState();
      if (rootState.routes[rootState.index].name !== route.name) return;

      const nestedState = rootState.routes[rootState.index].state as {
        index: number;
        routeNames: string[];
      };

      if (!nestedState?.routeNames) {
        DeviceEventEmitter.emit(SCROLL_EVENTS[name]);
        return;
      }

      const topTabName = nestedState.routeNames[nestedState.index];
      const eventName =
        topTabName === "index"
          ? FRIEND_TAB_SCROLL_EVENTS.INDEX
          : topTabName === "request"
            ? FRIEND_TAB_SCROLL_EVENTS.REQUEST
            : null;

      if (eventName) {
        DeviceEventEmitter.emit(eventName);
      }
    };
  }

  return () => {
    DeviceEventEmitter.emit(TAB_PRESS_EVENT[name]);

    const state = navigation.getState();
    if (state.routes[state.index].name === route.name && SCROLL_EVENTS[name]) {
      DeviceEventEmitter.emit(SCROLL_EVENTS[name]);
    }
  };
};

export default function TabsLayout() {
  useSubscribeNotification();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarButton: (props) => {
            return (
              <TouchableOpacity
                onPress={props.onPress}
                activeOpacity={1}
                className={`h-[80px] items-center justify-center pt-[4px] ${
                  Platform.OS === "android" ? "pb-[10px]" : "pb-[20px]"
                }`}
              >
                {props.children}
              </TouchableOpacity>
            );
          },
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.gray[60],
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: colors.white,
            height: 80,
            flexDirection: "row",
            ...(Platform.OS === "android" && {
              justifyContent: "center",
              alignItems: "center",
            }),
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            header: () => <HeaderWithPrivacy />,
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon color={color} name="HOME" focused={focused} />
            ),
          }}
          listeners={({ navigation, route }) => ({
            tabPress: createTabPressHandler("HOME", navigation, route),
          })}
        />
        <Tabs.Screen
          name="friend"
          options={{
            header: () => <HeaderWithNotification name="FRIEND" />,
            title: "Friend",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon color={color} name="FRIEND" focused={focused} />
            ),
          }}
          listeners={({ navigation, route }) => ({
            tabPress: createTabPressHandler("FRIEND", navigation, route),
          })}
        />
        <Tabs.Screen
          name="upload"
          options={{
            header: () => <HeaderWithBack name="UPLOAD" />,
            title: "Upload",
            tabBarStyle: { display: "none" },
            tabBarIcon: () => (
              <View className="size-[48px] items-center justify-center rounded-full bg-primary p-[12px] ">
                <icons.PlusIcon width={24} height={24} color={colors.white} />
              </View>
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              navigation.setParams({ postId: undefined });
            },
            blur: () => {
              navigation.setParams({ postId: undefined });
            },
          })}
        />
        <Tabs.Screen
          name="history"
          options={{
            header: () => <HeaderWithNotification name="HISTORY" />,
            title: "History",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon color={color} name="HISTORY" focused={focused} />
            ),
          }}
          listeners={({ navigation, route }) => ({
            tabPress: createTabPressHandler("HISTORY", navigation, route),
          })}
        />
        <Tabs.Screen
          name="mypage"
          options={{
            header: () => <HeaderWithNotification name="MY_PAGE" />,
            title: "MyPage",
            tabBarIcon: ({ color, focused }) => (
              <TabIcon color={color} name="MY_PAGE" focused={focused} />
            ),
          }}
          listeners={({ navigation, route }) => ({
            tabPress: createTabPressHandler("MY_PAGE", navigation, route),
          })}
        />
      </Tabs>
    </>
  );
}
