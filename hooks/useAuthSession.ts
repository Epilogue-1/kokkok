import { supabase } from "@/utils/supabase";
import type { Session } from "@supabase/supabase-js";
import type { QueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

async function updateUserInfo(session: Session | null) {
  try {
    if (session)
      await Promise.all([
        SecureStore.setItemAsync("userId", session.user.id),
        SecureStore.setItemAsync("createdAt", session.user.created_at),
      ]);
    else
      await Promise.all([
        SecureStore.deleteItemAsync("userId"),
        SecureStore.deleteItemAsync("createdAt"),
      ]);
  } catch (error) {
    console.error("유저 정보를 스토리지에 저장하는 중 에러 발생", error);
    throw error;
  }
}

export function useAuthSession(queryClient: QueryClient) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        setIsLoggedIn(!!session);
        await updateUserInfo(session);
        setIsLoading(false);
      })
      .catch(async (error) => {
        console.error("세션 조회 및 저장 중 오류 발생:", error);
        setIsLoggedIn(false);
        await updateUserInfo(null);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setIsLoggedIn(!!session);
        await updateUserInfo(session);
        queryClient.clear();
      } catch (error) {
        console.error("인증 상태 업데이트 중 오류 발생:", session, error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return { isLoggedIn, isLoading };
}
