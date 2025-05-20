import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export type PrivacySetting = "all" | "friend";

const listeners = new Set<() => void>();

export const addPrivacyChangeListener = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const notifyPrivacyChange = () => {
  for (const listener of listeners) {
    listener();
  }
};

// 프라이버시 설정을 저장하고 리스너에게 알려주는 함수
export const savePrivacy = async (privacy: PrivacySetting) => {
  try {
    await AsyncStorage.setItem("PostPrivacy", privacy);
    notifyPrivacyChange();
  } catch (error) {
    console.error("프라이버시 설정 저장에 실패했습니다:", error);
  }
};

export default function useCheckPrivacy() {
  const [privacy, setPrivacy] = useState<PrivacySetting>("all");
  const [isLoading, setIsLoading] = useState(true);

  // 프라이버시 설정을 로드하는 함수
  const loadPrivacySetting = useCallback(async () => {
    try {
      setIsLoading(true);
      const value = await AsyncStorage.getItem("PostPrivacy");
      if (value === "all" || value === "friend") {
        setPrivacy(value as PrivacySetting);
      } else {
        setPrivacy("all"); // 기본값 설정
      }
    } catch (error) {
      console.error("프라이버시 설정을 불러오는데 실패했습니다:", error);
      setPrivacy("all"); // 기본값 설정
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트가 마운트될 때와 프라이버시 변경 시 설정 로드
  useEffect(() => {
    loadPrivacySetting();

    // 프라이버시 변경 이벤트 구독
    const removeListener = addPrivacyChangeListener(loadPrivacySetting);

    // 클린업 함수
    return removeListener;
  }, [loadPrivacySetting]);

  return { privacy, isLoading };
}
