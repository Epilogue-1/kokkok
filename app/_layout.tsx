import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";

import "../global.css";
import { useFonts } from "expo-font";
import { HeaderWithBack } from "@/components/Header";
import { supabase } from "@/utils/supabase";
import { useOnlineManager } from "@/hooks/useOnlineManager";
import { useAppState } from "@/hooks/useAppState";
import { ToastConfig } from "@/components/ToastConfig";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 0 } },
});

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);

  const [loaded, error] = useFonts({
    "Pretendard-Black": require("../assets/fonts/Pretendard-Black.otf"),
    "Pretendard-Bold": require("../assets/fonts/Pretendard-Bold.otf"),
    "Pretendard-ExtraBold": require("../assets/fonts/Pretendard-ExtraBold.otf"),
    "Pretendard-ExtraLight": require("../assets/fonts/Pretendard-ExtraLight.otf"),
    "Pretendard-Light": require("../assets/fonts/Pretendard-Light.otf"),
    "Pretendard-Medium": require("../assets/fonts/Pretendard-Medium.otf"),
    "Pretendard-Regular": require("../assets/fonts/Pretendard-Regular.otf"),
    "Pretendard-SemiBold": require("../assets/fonts/Pretendard-SemiBold.otf"),
    "Pretendard-Thin": require("../assets/fonts/Pretendard-Thin.otf"),
  });

  useOnlineManager();
  useAppState();
  // shift+m 누르고 Open @dev-plugins/react-query 선택
  useReactQueryDevTools(queryClient);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // TODO - 세션 체크
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (!loaded && !error) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="notification"
          options={{ header: () => <HeaderWithBack name="NOTIFICATION" /> }}
        />
        <Stack.Screen
          name="setting"
          options={{ header: () => <HeaderWithBack name="SETTING" /> }}
        />
        <Stack.Screen
          name="profile"
          options={{
            header: () => <HeaderWithBack name="EDIT_PROFILE" />,
          }}
        />
        <Stack.Screen name="user/[userId]" options={{ headerShown: false }} />
      </Stack>
      <Toast config={ToastConfig} />
    </QueryClientProvider>
  );
}
