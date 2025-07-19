module.exports = {
  expo: {
    name: "kokkok",
    slug: "kokkok",
    scheme: "kokkok",
    version: "1.3.1",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      backgroundColor: "#885FF1",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.epilogue.kokkok",
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          "프로필 사진 업로드와 게시물 작성 시 사진 첨부를 위해 앨범 접근 권한이 필요합니다.",
        NSCameraUsageDescription:
          "프로필 사진 촬영과 게시물에 새로운 사진을 추가하기 위해 카메라 접근 권한이 필요합니다.",
        UIViewControllerBasedStatusBarAppearance: true,
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
      },
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      package: "com.epilogue.kokkok",
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      [
        "expo-font",
        {
          fonts: ["./assets/fonts/Pretendard-Regular.otf"],
        },
      ],
      [
        "@sentry/react-native/expo",
        {
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          url: "https://sentry.io/",
        },
      ],
    ],
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "85f67272-5b0c-4bdc-9b49-4d03903e47ba",
      },
      EXPO_PUSH_TOKEN: process.env.EXPO_PUSH_TOKEN,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SENTRY_DSN: process.env.SENTRY_DSN,
    },
    owner: "epilogue-1",
  },
};
