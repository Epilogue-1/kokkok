import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  Animated,
  Keyboard,
  PanResponder,
  Platform,
  Pressable,
  View,
  useAnimatedValue,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MotionModalContentProps {
  maxHeight: number;
  initialHeight: number;
  closeThreshold?: number;
  onClose: () => void;
  children: React.ReactNode;
}

export interface MotionModalContentRef {
  handleClose: () => void;
}

const MotionModalContent = forwardRef<
  MotionModalContentRef,
  MotionModalContentProps
>(
  (
    { maxHeight, initialHeight, closeThreshold = 0.3, onClose, children },
    ref,
  ) => {
    // 분리된 애니메이션 값 사용 - 네이티브 드라이버 충돌 방지
    const slideAnim = useAnimatedValue(0);
    const heightAnim = useAnimatedValue(initialHeight);
    const heightRef = useRef(initialHeight);
    const maxHeightRef = useRef(maxHeight);

    const clampHeight = useCallback(
      (height: number) => Math.min(maxHeightRef.current, Math.max(0, height)),
      [],
    );

    const handleClose = useCallback(() => {
      Animated.timing(heightAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false, // height는 레이아웃 속성이므로 false
      }).start(() => {
        onClose();
        setTimeout(() => {
          heightRef.current = initialHeight;
        }, 100);
      });
    }, [heightAnim, onClose, initialHeight]);

    // ref를 통해 외부에서 handleClose에 접근할 수 있도록 함
    useImperativeHandle(
      ref,
      () => ({
        handleClose,
      }),
      [handleClose],
    );

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onPanResponderMove: (_, gestureState) => {
            const newHeight = clampHeight(heightRef.current - gestureState.dy);
            heightAnim.setValue(newHeight);
          },
          onPanResponderRelease: (_, gestureState) => {
            const finalHeight = heightRef.current - gestureState.dy;
            const closeHeight = maxHeightRef.current * closeThreshold;

            if (finalHeight < closeHeight) {
              handleClose();
            } else if (finalHeight > maxHeightRef.current) {
              heightRef.current = maxHeightRef.current;
              Animated.spring(heightAnim, {
                toValue: maxHeightRef.current,
                useNativeDriver: false, // height는 레이아웃 속성이므로 false
                tension: 300,
                friction: 25,
              }).start();
            } else {
              const clampedHeight = clampHeight(finalHeight);
              heightRef.current = clampedHeight;
              Animated.spring(heightAnim, {
                toValue: clampedHeight,
                useNativeDriver: false, // height는 레이아웃 속성이므로 false
                tension: 300,
                friction: 25,
              }).start();
            }
          },
        }),
      [closeThreshold, clampHeight, handleClose, heightAnim],
    );

    // 키보드 이벤트 처리
    useEffect(() => {
      const handleKeyboardShow = (e: {
        endCoordinates: { height: number };
      }) => {
        const keyboardHeight = e.endCoordinates.height;
        const newHeight = maxHeight - keyboardHeight;
        maxHeightRef.current = newHeight;
        heightRef.current = clampHeight(newHeight);
        Animated.timing(heightAnim, {
          toValue: heightRef.current,
          duration: 300,
          useNativeDriver: false, // height는 레이아웃 속성이므로 false
        }).start();
      };

      const handleKeyboardHide = () => {
        maxHeightRef.current = maxHeight;
        heightRef.current = clampHeight(maxHeightRef.current);
        Animated.timing(heightAnim, {
          toValue: heightRef.current,
          duration: 300,
          useNativeDriver: false, // height는 레이아웃 속성이므로 false
        }).start();
      };

      const showEvent =
        Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
      const hideEvent =
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

      const keyboardShowListener = Keyboard.addListener(
        showEvent,
        handleKeyboardShow,
      );
      const keyboardHideListener = Keyboard.addListener(
        hideEvent,
        handleKeyboardHide,
      );

      return () => {
        keyboardShowListener.remove();
        keyboardHideListener.remove();
      };
    }, [clampHeight, maxHeight, heightAnim]);

    // 초기 애니메이션
    useEffect(() => {
      // slideAnim만 네이티브 드라이버로 애니메이션 (transform 전용)
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true, // transform은 네이티브 드라이버 지원
      }).start();

      // heightAnim은 초기값 그대로 시작 (이미 initialHeight로 설정됨)
      heightRef.current = initialHeight;
    }, [initialHeight, slideAnim]);

    return (
      <Animated.View
        style={{
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [maxHeightRef.current, 0],
                extrapolate: "clamp",
              }),
            },
          ],
        }}
      >
        <Animated.View
          style={{
            height: heightAnim,
          }}
        >
          <SafeAreaView
            edges={["top"]}
            className="h-full flex-1 rounded-t-[20px] border border-[#fcfcfc] bg-gray-5"
          >
            <View
              className="w-full items-center pt-[8px] pb-[22px]"
              {...panResponder.panHandlers}
            >
              <View className="h-1 w-10 rounded-[2px] bg-[#d9d9d9]" />
            </View>
            <Pressable
              className="flex-1"
              onPress={() => {}} // 빈 함수로 터치 이벤트 소비 (모달 닫기 방지)
            >
              {children}
            </Pressable>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    );
  },
);

MotionModalContent.displayName = "MotionModalContent";

export default MotionModalContent;
