import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import icons from "@/constants/icons";
import images from "@/constants/images";
import useCheckNewNotification from "@/hooks/useCheckNewNotification";

const HEADER_TITLE = {
  LOGIN: "로그인",
  RESET_PASSWORD: "비밀번호 재설정",
  CHANGE_PASSWORD: "비밀번호 변경",
  SIGNUP: "회원가입",
  EDIT_PROFILE: "프로필 수정",
  SETTING: "계정 설정",
  UPLOAD: "인증하기",
  NOTIFICATION: "알림",
  HOME: "KokKok",
  MY_PAGE: "마이페이지",
  HISTORY: "기록",
  FRIEND: "친구",
  SEARCH_FRIEND: "친구 찾기",
  POST_DETAIL: "게시물",
} as const;
type HeaderType = keyof typeof HEADER_TITLE;

interface HeaderProps {
  name: HeaderType;
}

export function Header({ name }: HeaderProps) {
  return (
    <SafeAreaView edges={["top"]} className="border-gray-10 border-b bg-white">
      <View className="h-14 items-center justify-center">
        <Text className="heading-2">{HEADER_TITLE[name]}</Text>
      </View>
    </SafeAreaView>
  );
}

export function HeaderWithBack({ name }: HeaderProps) {
  return (
    <SafeAreaView edges={["top"]} className="border-gray-10 border-b bg-white">
      <View className="h-14 items-center justify-center px-4">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="뒤로가기"
          className="absolute left-4"
        >
          <icons.ChevronLeftIcon width={24} height={24} color="#727272" />
        </TouchableOpacity>
        <Text className="heading-2">{HEADER_TITLE[name]}</Text>
      </View>
    </SafeAreaView>
  );
}

export function HeaderWithNotification({ name }: HeaderProps) {
  const hasNewNotification = useCheckNewNotification();

  function AdditionalButton() {
    if (name === "MY_PAGE")
      return (
        <TouchableOpacity
          onPress={() => router.push("/setting")}
          accessibilityLabel="설정"
        >
          <icons.SettingIcon width={24} height={24} />
        </TouchableOpacity>
      );

    if (name === "FRIEND")
      return (
        <TouchableOpacity
          onPress={() => router.push("/user/search")}
          accessibilityLabel="친구 찾기"
        >
          <icons.AddIcon width={24} height={24} color={colors.gray[100]} />
        </TouchableOpacity>
      );

    return <></>;
  }

  return (
    <SafeAreaView edges={["top"]} className="border-gray-10 border-b bg-white">
      <View className="h-14 flex-row items-center justify-between px-4">
        {/* 홈의 경우 로고 이미지 사용 */}
        {name === "HOME" ? (
          <Image
            source={images.AuthLogo}
            style={{ width: 70, height: 16 }}
            accessibilityLabel="KokKok 로고"
          />
        ) : (
          <Text className="heading-2">{HEADER_TITLE[name]}</Text>
        )}

        <View className="flex-row gap-4">
          {/* 마이페이지, 친구페이지의 버튼 추가 */}
          <AdditionalButton />

          {/* 새 알람 여부에 따른 아이콘 렌더링 */}
          <TouchableOpacity onPress={() => router.push("/notification")}>
            {hasNewNotification ? (
              <icons.BellWithDotIcon width={24} height={24} />
            ) : (
              <icons.BellIcon width={24} height={24} color={colors.gray[100]} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export function HeaderWithUsername({
  name,
  type = "MY_PAGE",
}: { name: string; type?: "MY_PAGE" | "POST_PAGE" }) {
  const isMyPage = type === "MY_PAGE";

  return (
    <SafeAreaView
      edges={isMyPage ? ["top"] : []}
      className="border-gray-10 border-b bg-white"
    >
      <View className="h-14 flex-row items-center gap-6 px-4">
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="뒤로가기"
          className=""
        >
          <icons.ChevronLeftIcon width={24} height={24} color="#727272" />
        </TouchableOpacity>
        <View className="w-[285px] flex-row items-center">
          <Text
            className="title-2 flex-shrink"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {name}
          </Text>
          <Text className="title-2 flex-shrink-0">
            {isMyPage ? "님의 페이지" : "님의 게시글"}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
