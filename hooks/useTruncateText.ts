import { useCallback, useMemo } from "react";
import { Dimensions, PixelRatio } from "react-native";

export const useTruncateText = () => {
  const screenWidth = Dimensions.get("window").width;

  const calculateMaxChars = useMemo(() => {
    const fontScale = PixelRatio.getFontScale();
    const baseCharsPerLine = Math.floor(screenWidth / (15 * fontScale));
    return baseCharsPerLine * 2;
  }, [screenWidth]);

  // 텍스트 끝의 문장 부호와 공백을 제거하는 함수
  const cleanEndOfText = useCallback((text: string): string => {
    return text.replace(/[.,!?:;'")\]}]* *$/, "").trim();
  }, []);

  const truncateText = useMemo(
    () => (text: string) => {
      // 텍스트가 없거나 최대 길이보다 짧으면 그대로 반환
      if (!text || text.length <= calculateMaxChars) return text;

      // 최대 길이까지 자른 텍스트
      const truncated = text.slice(0, calculateMaxChars);

      // 자른 텍스트에서 문장 종결 부호(., !, ?) 위치 찾기
      const lastPeriod = truncated.lastIndexOf(".");
      const lastExclamation = truncated.lastIndexOf("!");
      const lastQuestion = truncated.lastIndexOf("?");

      // 가장 마지막에 있는 문장 종결 부호 위치 찾기
      const lastPunctuationIndex = Math.max(
        lastPeriod,
        lastExclamation,
        lastQuestion,
      );

      // 문장 종결 부호가 있고 너무 앞쪽에 있지 않으면 그 위치에서 자르기
      if (lastPunctuationIndex > calculateMaxChars / 3) {
        const slicedText = truncated.slice(0, lastPunctuationIndex + 1);
        return `${cleanEndOfText(slicedText)}...`;
      }

      // 문장 종결 부호가 없거나 너무 앞쪽에 있으면 단어 단위로 자르기
      const lastSpaceIndex = truncated.lastIndexOf(" ");
      if (lastSpaceIndex > 0) {
        const slicedText = truncated.slice(0, lastSpaceIndex);
        return `${cleanEndOfText(slicedText)}...`;
      }

      // 공백도 없으면 그냥 잘라서 반환
      return `${cleanEndOfText(truncated)}...`;
    },
    [calculateMaxChars, cleanEndOfText],
  );

  return { truncateText, calculateMaxChars };
};
