import { useCallback, useMemo } from "react";
import { Dimensions, PixelRatio } from "react-native";

// 최대 줄 수 설정
const MAX_LINES = 2;

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

  // 줄바꿈을 고려한 텍스트 잘라내기 함수
  const truncateTextByLines = useCallback(
    (text: string): string => {
      if (!text) return text;

      // 줄바꿈으로 텍스트를 분할
      const lines = text.split("\n");

      // 잘라야 하는지 확인
      const needsTruncation =
        lines.length > MAX_LINES || text.length > calculateMaxChars;

      if (!needsTruncation) {
        return text;
      }

      // 우선 문자 수로 자르기 (가장 기본적인 제한)
      let result = text;

      // 문자 수가 초과하면 먼저 문자 수로 자르기
      if (text.length > calculateMaxChars) {
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
          result = cleanEndOfText(slicedText);
        } else {
          // 문장 종결 부호가 없거나 너무 앞쪽에 있으면 단어 단위로 자르기
          const lastSpaceIndex = truncated.lastIndexOf(" ");
          if (lastSpaceIndex > 0) {
            const slicedText = truncated.slice(0, lastSpaceIndex);
            result = cleanEndOfText(slicedText);
          } else {
            // 공백도 없으면 그냥 잘라서 반환
            result = cleanEndOfText(truncated);
          }
        }
      }

      // 그 다음 줄 수 체크 (문자 수로 자른 결과에 대해)
      const resultLines = result.split("\n");
      if (resultLines.length > MAX_LINES) {
        // 최대 줄 수만큼만 가져오기
        const truncatedLines = resultLines.slice(0, MAX_LINES);
        result = cleanEndOfText(truncatedLines.join("\n"));
      }

      return `${result}...`;
    },
    [calculateMaxChars, cleanEndOfText],
  );

  // 텍스트가 잘려야 하는지 확인하는 함수
  const shouldTruncate = useCallback(
    (text: string): boolean => {
      if (!text) return false;

      const lines = text.split("\n");
      return lines.length > MAX_LINES || text.length > calculateMaxChars;
    },
    [calculateMaxChars],
  );

  const truncateText = useMemo(
    () => truncateTextByLines,
    [truncateTextByLines],
  );

  return {
    truncateText,
    calculateMaxChars,
    shouldTruncate,
    maxLines: MAX_LINES,
  };
};
