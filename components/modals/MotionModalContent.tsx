import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { Animated, Keyboard, PanResponder, Platform, View } from "react-native";
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
    const slideAnim = useRef(new Animated.Value(0));
    const heightAnim = useRef(new Animated.Value(0));
    const heightRef = useRef(initialHeight);
    const maxHeightRef = useRef(maxHeight);

    const clampHeight = useCallback(
      (height: number) => Math.min(maxHeightRef.current, Math.max(0, height)),
      [],
    );

    const handleClose = useCallback(() => {
      Animated.timing(heightAnim.current, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        onClose();
        setTimeout(() => {
          heightRef.current = initialHeight;
        }, 100);
      });
    }, [onClose, initialHeight]);

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
            heightAnim.current.setValue(newHeight);
          },
          onPanResponderRelease: (_, gestureState) => {
            const finalHeight = heightRef.current - gestureState.dy;
            const closeHeight = maxHeightRef.current * closeThreshold;

            if (finalHeight < closeHeight) {
              handleClose();
            } else if (finalHeight > maxHeightRef.current) {
              heightRef.current = maxHeightRef.current;
              Animated.spring(heightAnim.current, {
                toValue: maxHeightRef.current,
                useNativeDriver: false,
              }).start();
            } else {
              const clampedHeight = clampHeight(finalHeight);
              heightRef.current = clampedHeight;
              Animated.spring(heightAnim.current, {
                toValue: clampedHeight,
                useNativeDriver: false,
              }).start();
            }
          },
        }),
      [closeThreshold, clampHeight, handleClose],
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
        Animated.timing(heightAnim.current, {
          toValue: heightRef.current,
          duration: 300,
          useNativeDriver: false,
        }).start();
      };

      const handleKeyboardHide = () => {
        maxHeightRef.current = maxHeight;
        heightRef.current = clampHeight(maxHeightRef.current);
        Animated.timing(heightAnim.current, {
          toValue: heightRef.current,
          duration: 300,
          useNativeDriver: false,
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
    }, [clampHeight, maxHeight]);

    // 초기 애니메이션
    useEffect(() => {
      // 초기값 설정
      slideAnim.current.setValue(0);
      heightAnim.current.setValue(0);

      // 첫 번째로 슬라이드 애니메이션 실행
      Animated.spring(slideAnim.current, {
        toValue: 1,
        useNativeDriver: false,
        stiffness: 300,
        damping: 25,
        mass: 0.8,
      }).start();

      // 동시에 높이 애니메이션도 실행
      Animated.spring(heightAnim.current, {
        toValue: initialHeight,
        useNativeDriver: false,
        stiffness: 300,
        damping: 25,
        mass: 0.8,
      }).start(() => {
        heightRef.current = initialHeight;
      });
    }, [initialHeight]);

    return (
      <Animated.View
        style={{
          transform: [
            {
              translateY: slideAnim.current.interpolate({
                inputRange: [0, 1],
                outputRange: [maxHeightRef.current, 0],
                extrapolate: "clamp",
              }),
            },
          ],
          height: heightAnim.current,
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
          {children}
        </SafeAreaView>
      </Animated.View>
    );
  },
);

MotionModalContent.displayName = "MotionModalContent";

export default MotionModalContent;
