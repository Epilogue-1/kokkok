import { useAuthSession } from "@/hooks/useAuthSession";
import useFetchData from "@/hooks/useFetchData";
import type {
  NotificationData,
  PushSetting,
} from "@/types/Notification.interface";
import { updatePushToken } from "@/utils/pushTokenManager";
import { deletePushSetting, getPushSetting } from "@/utils/supabase";
import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

interface Props {
  children: React.ReactNode;
}

export default function NotificationProvider({
  children,
}: Props) {
  const queryClient = useQueryClient();
  const navigationTimeoutRef = useRef<NodeJS.Timeout>();
  const lastNavigationRef = useRef<string>("");

  const { isLoggedIn } = useAuthSession(queryClient);
  const [isInit, setIsInit] = useState(true);
  const [pushPermission, setPushPermission] = useState("");

  // 기존 푸시 알림 정보 조회
  const { data: pushSetting } = useFetchData<PushSetting | null>(
    ["pushToken"],
    () => getPushSetting(),
    "푸시 알림 설정 정보 로드에 실패했습니다.",
    isLoggedIn,
  );

  // 안전한 네비게이션 함수
  const safeNavigate = useCallback((route: string, delay = 100) => {
    // 중복 네비게이션 방지
    if (lastNavigationRef.current === route) {
      return;
    }

    // 기존 타이머 클리어
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    lastNavigationRef.current = route;

    navigationTimeoutRef.current = setTimeout(() => {
      try {
        router.navigate(route);

        // 네비게이션 후 플래그 리셋 (3초 후)
        setTimeout(() => {
          lastNavigationRef.current = "";
        }, 3000);
      } catch (error) {
        console.error(`네비게이션 실패 (${route}):`, error);
        lastNavigationRef.current = "";
      }
    }, delay);
  }, []);

  // 세션 바뀔 때마다 isInit true로 바꿈
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setIsInit(true);
  }, [isLoggedIn]);

  // 로그인 한 첫회에만 푸시 토큰 업데이트
  useEffect(() => {
    if (!isLoggedIn || !isInit) return;

    // 푸시알람 관련 정보 업데이트 시 캐시된 데이터 삭제, 더이상 첫 업데이트 아님을 마킹
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["pushToken"] });
      setIsInit(false);
    };

    updatePushToken({
      existingToken: pushSetting?.token,
      handleUpdate,
    });
  }, [isLoggedIn, pushSetting?.token, isInit, queryClient]);

  // 푸시 알림 관련 포스트 페이지로 바로 이동
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        try {
          const { data } = response.notification.request.content as {
            data: NotificationData;
          };

          // 데이터가 없거나 빈 객체인 경우
          if (!data || !Object.keys(data).length) {
            safeNavigate("/home");
            return;
          }

          // 게시글 관련 알림 (postId가 있는 경우)
          if (data.postId) {
            // 댓글 알림인 경우 댓글창을 열도록 파라미터 추가
            if (data.commentInfo) {
              safeNavigate(`/post/${data.postId}?openComments=true`);
            } else {
              safeNavigate(`/post/${data.postId}`);
            }
            return;
          }

          // 친구 관련 알림
          if (typeof data.isAccepted === "boolean") {
            if (data.isAccepted) {
              safeNavigate("/friend");
            } else {
              safeNavigate("/friend/request");
            }
            return;
          }

          safeNavigate("/home");
        } catch (error) {
          console.error("알림 처리 중 오류 발생:", error);
          safeNavigate("/home");
        }
      },
    );

    return () => {
      subscription.remove();
      // 컴포넌트 언마운트 시 타이머 정리
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [safeNavigate]);

  // 권한 설정 변경 감지
  useEffect(() => {
    // 앱 푸시알림 설정 변경 시 관련 정보 리패치
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["pushToken"] });
    };

    // 권한 설정 정보 저장
    const handlePermissionChange = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === pushPermission || !isLoggedIn) return;

      setPushPermission(status);

      if (status === "granted") {
        await updatePushToken({ handleUpdate });
      } else {
        await deletePushSetting();
        handleUpdate();
      }
    };

    // 앱이 foreground 로 돌아왔을 때 권한변경 감지
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        handlePermissionChange();
      }
    });

    return () => subscription.remove();
  }, [pushPermission, isLoggedIn, queryClient]);

  return children;
}
