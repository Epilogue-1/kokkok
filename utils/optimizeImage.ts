import * as ImageManipulator from "expo-image-manipulator";

const optimizeImage = async (
  uri: string,
  maxDimension = 520,
): Promise<string> => {
  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.WEBP,
    });
    return manipulatedImage.uri;
  } catch (error) {
    console.error("Error optimizing image:", error);
    throw error;
  }
};

export default optimizeImage;
