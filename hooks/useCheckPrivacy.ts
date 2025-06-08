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

const uploadListeners = new Set<() => void>();

export const addUploadPrivacyChangeListener = (listener: () => void) => {
  uploadListeners.add(listener);
  return () => {
    uploadListeners.delete(listener);
  };
};

export const notifyUploadPrivacyChange = () => {
  for (const listener of uploadListeners) {
    listener();
  }
};

export const savePrivacy = async (privacy: PrivacySetting) => {
  try {
    await AsyncStorage.setItem("PostPrivacy", privacy);
    notifyPrivacyChange();
  } catch (error) {
    console.error("프라이버시 설정 저장에 실패했습니다:", error);
  }
};

export const saveUploadPrivacy = async (privacy: PrivacySetting) => {
  try {
    await AsyncStorage.setItem("UploadPrivacy", privacy);
    notifyUploadPrivacyChange();
  } catch (error) {
    console.error("업로드 프라이버시 설정 저장에 실패했습니다:", error);
  }
};

export default function useCheckPrivacy() {
  const [privacy, setPrivacy] = useState<PrivacySetting>("all");
  const [uploadPrivacy, setUploadPrivacy] = useState<PrivacySetting>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadLoading, setIsUploadLoading] = useState(true);

  // 일반 프라이버시 설정을 로드하는 함수
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

  // 업로드용 프라이버시 설정을 로드하는 함수
  const loadUploadPrivacySetting = useCallback(async () => {
    try {
      setIsUploadLoading(true);
      const value = await AsyncStorage.getItem("UploadPrivacy");
      if (value === "all" || value === "friend") {
        setUploadPrivacy(value as PrivacySetting);
      } else {
        setUploadPrivacy("all"); // 기본값 설정
      }
    } catch (error) {
      console.error("업로드 프라이버시 설정을 불러오는데 실패했습니다:", error);
      setUploadPrivacy("all"); // 기본값 설정
    } finally {
      setIsUploadLoading(false);
    }
  }, []);

  // 일반 프라이버시 설정 로드 및 이벤트 구독
  useEffect(() => {
    loadPrivacySetting();

    // 프라이버시 변경 이벤트 구독
    const removeListener = addPrivacyChangeListener(loadPrivacySetting);

    // 클린업 함수
    return removeListener;
  }, [loadPrivacySetting]);

  // 업로드 프라이버시 설정 로드 및 이벤트 구독
  useEffect(() => {
    loadUploadPrivacySetting();

    // 업로드 프라이버시 변경 이벤트 구독
    const removeListener = addUploadPrivacyChangeListener(
      loadUploadPrivacySetting,
    );

    // 클린업 함수
    return removeListener;
  }, [loadUploadPrivacySetting]);

  return { privacy, uploadPrivacy, isLoading, isUploadLoading };
}
