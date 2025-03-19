import CustomSwitch from "@/components/CustomSwitch";
import LoadingScreen from "@/components/LoadingScreen";
import { showToast } from "@/components/ToastConfig";
import { DeleteAccountModal } from "@/components/modals/DoubleButtonModal/DeleteAccountModal";
import { LogoutModal } from "@/components/modals/DoubleButtonModal/LogoutModal";
import colors from "@/constants/colors";
import Icons from "@/constants/icons";
import useFetchData from "@/hooks/useFetchData";
import { useModal } from "@/hooks/useModal";
import {
  NOTIFICATION_TYPE,
  type NotificationType,
  type PushSetting,
} from "@/types/Notification.interface";
import { isTokenValid, updatePushToken } from "@/utils/pushTokenManager";
import {
  getCurrentUser,
  getPushSetting,
  updatePushSetting,
} from "@/utils/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Alert,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const NOTIFICATION_TYPE_GROUPS: { [key: string]: NotificationType[] } = {
  like: ["like", "commentLike"],
  comment: ["comment"],
  mention: ["mention"],
  poke: ["poke"],
  friend: ["friend"],
} as const;

export default function Setting() {
  const router = useRouter();
  const { openModal } = useModal();

  // 푸시알림 설정 정보 조회
  const { data: pushSetting, isPending: isTokenPending } =
    useFetchData<PushSetting | null>(
      ["pushToken"],
      () => getPushSetting(),
      "푸시 알림 설정 정보 로드에 실패했습니다.",
    );

  // 간편 로그인 사용자 판단을 위한 유저 정보 조회
  const { data: currentUser } = useFetchData(
    ["currentUser"],
    getCurrentUser,
    "현재 사용자를 불러올 수 없습니다.",
  );

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-white">
      <View className="gap-2 bg-gray-5 pb-2">
        {/* 알림 설정 */}
        {isTokenPending ? (
          <View className="h-[324px] items-center justify-center">
            <LoadingScreen />
          </View>
        ) : (
          <NotificationSetting setting={pushSetting} />
        )}

        {/* 계정 설정 */}
        <View className="bg-white px-6 py-[22px]">
          <Text className="heading-2 text-gray-80">계정 설정</Text>
          <View className="mt-5 gap-5 px-2">
            {!currentUser?.isOAuth && (
              <TouchableOpacity
                className="flex-row items-center justify-between"
                onPress={() => router.push("/change-password")}
              >
                <Text className="font-pmedium text-gray-80 text-xl">
                  비밀번호 변경
                </Text>
                <Icons.ChevronRightIcon color={colors.gray[70]} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="flex-row items-center justify-between"
              onPress={() => openModal(<LogoutModal />)}
            >
              <Text className="font-pmedium text-gray-80 text-xl">
                로그아웃
              </Text>
              <Icons.ChevronRightIcon color={colors.gray[70]} />
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center justify-between"
              onPress={() => openModal(<DeleteAccountModal />)}
            >
              <Text className="font-pmedium text-gray-80 text-xl">
                계정 탈퇴
              </Text>
              <Icons.ChevronRightIcon color={colors.gray[70]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 문의하기 */}
        <View className="bg-white px-6 py-[22px]">
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                "https://docs.google.com/forms/d/e/1FAIpQLSdjdkcRV8CfAyxMutiH8xxFbzNg7wQc4bVRlNo4InST4H5Mng/viewform?usp=header",
              )
            }
          >
            <Text className="heading-2 text-gray-80">문의하기</Text>
          </TouchableOpacity>
        </View>

        {/* 깃허브 놀러가기 */}
        <View className="bg-white px-6 py-[22px]">
          <TouchableOpacity
            onPress={() =>
              Linking.openURL("https://github.com/Epilogue-1/kokkok")
            }
          >
            <Text className="heading-2 text-gray-80">
              우리 앱 깃허브 놀러가기
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function NotificationSetting({ setting }: { setting?: PushSetting | null }) {
  const queryClient = useQueryClient();

  const granted = setting?.grantedNotifications || [];
  const allSwitch = useSharedValue(!!granted.length);
  const SWITCH_CONFIG = {
    like: {
      title: "좋아요 알림",
      value: useSharedValue(granted.includes("like")),
    },
    comment: {
      title: "댓글 알림",
      value: useSharedValue(granted.includes("comment")),
    },
    mention: {
      title: "멘션 알림",
      value: useSharedValue(granted.includes("mention")),
    },
    poke: {
      title: "콕찌르기 알림",
      value: useSharedValue(granted.includes("poke")),
    },
    friend: {
      title: "친구요청 알림",
      value: useSharedValue(granted.includes("friend")),
    },
  } as const;
  type SwitchType = keyof typeof SWITCH_CONFIG;

  const openSetting = async () => {
    if (Platform.OS === "ios") {
      await Linking.openURL("app-settings:");
    } else {
      await Linking.openSettings();
    }
  };

  // 기존 토큰이 유효하지 않으면 권한 설정 이동 모달 띄우기
  const checkPermission = async () => {
    if (isTokenValid(setting?.token)) return true;

    // 권한 요청
    const granted = await updatePushToken({
      existingToken: setting?.token,
      handleUpdate: () => {
        queryClient.invalidateQueries({ queryKey: ["pushToken"] });
      },
    });
    if (!granted) {
      Alert.alert(
        "알림 권한 필요",
        "푸시알림을 받기 위해 알림 접근 권한이 필요합니다.\n설정에서 권한을 허용해주세요.",
        [
          { text: "취소", style: "cancel" },
          { text: "설정으로 이동", onPress: openSetting },
        ],
      );
    }
    return granted;
  };

  // grantedNotification의 변경사항을 서버에 반영
  const updateGrantedNotifications = async (newGranted: NotificationType[]) => {
    try {
      await updatePushSetting({
        grantedNotifications: newGranted,
      });
      queryClient.invalidateQueries({ queryKey: ["pushToken"] });
    } catch {
      showToast("fail", "알림 설정 업데이트에 실패했습니다.");
    }
  };

  // 최상단 스위치 클릭 핸들러
  const handleAllSwitchPress = async () => {
    if (!(await checkPermission())) return;

    const prevAllSwitch = allSwitch.value;
    // 스위치 업데이트
    for (const { value } of Object.values(SWITCH_CONFIG)) {
      value.value = !prevAllSwitch;
    }
    allSwitch.value = !prevAllSwitch;

    // DB에 변경사항 반영
    const newGranted = prevAllSwitch
      ? []
      : [...Object.values(NOTIFICATION_TYPE)];
    updateGrantedNotifications(newGranted);
  };

  // 개별 스위치 클릭 핸들러
  const handleSwitchPress = async (type: SwitchType) => {
    if (!(await checkPermission())) return;

    const prevValue = SWITCH_CONFIG[type].value.value;
    // 스위치 업데이트
    if (!prevValue) {
      allSwitch.value = true;
    } else if (
      Object.entries(SWITCH_CONFIG).every(
        ([key, { value }]) => key === type || !value.value,
      )
    ) {
      allSwitch.value = false;
    }
    SWITCH_CONFIG[type].value.value = !SWITCH_CONFIG[type].value.value;

    // DB에 변경사항 반영
    const typesToUpdate = NOTIFICATION_TYPE_GROUPS[type];
    const newGranted = prevValue
      ? granted.filter((t) => !typesToUpdate.includes(t))
      : [...granted, ...typesToUpdate];
    updateGrantedNotifications(newGranted);
  };

  return (
    <View className="gap-5 bg-white px-6 py-[22px]">
      <View className="flex-row items-center justify-between ">
        <Text className="heading-2 text-gray-80">알림 설정</Text>
        <CustomSwitch value={allSwitch} onPress={handleAllSwitchPress} />
      </View>
      {/* 개별 스위치 리스트 */}
      <View className="gap-5 pl-2">
        {Object.keys(SWITCH_CONFIG).map((type) => (
          <View key={type} className="flex-row items-center justify-between">
            <Text className="font-pmedium text-gray-80 text-xl">
              {SWITCH_CONFIG[type as SwitchType].title}
            </Text>
            <CustomSwitch
              value={SWITCH_CONFIG[type as SwitchType].value}
              onPress={() => handleSwitchPress(type as SwitchType)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
