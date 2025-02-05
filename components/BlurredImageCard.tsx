import { Image, View } from "react-native";

export default function BlurredImageCard({
  uri,
  blurRadius = 10,
}: {
  uri: string;
  blurRadius?: number;
}) {
  return (
    <>
      <Image
        accessibilityRole="image"
        accessibilityLabel="blur-background-image"
        source={{ uri: uri }}
        className="absolute inset-0 size-full"
        style={{
          resizeMode: "cover",
        }}
        blurRadius={blurRadius}
        fadeDuration={0}
        progressiveRenderingEnabled={true}
      />
      <View className="absolute inset-0 bg-black/80" />
      <Image
        accessibilityRole="image"
        accessibilityLabel="carousel-image"
        source={{ uri: uri }}
        className="size-full"
        style={{
          resizeMode: "contain",
        }}
      />
    </>
  );
}
