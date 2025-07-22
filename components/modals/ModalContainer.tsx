import { type InternalModal, modalStackAtom } from "@/contexts/modal.atom";
import type { ModalAnimationConfig } from "@/contexts/modal.atom";
import { useModal } from "@/hooks/useModal";
import { useAtom } from "jotai";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Modal, Pressable } from "react-native";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface AnimationConfig {
  opacity: number;
  translateY: number;
}

interface ModalItemProps {
  modal: InternalModal;
  isTop: boolean;
  onClose: () => void;
  hasMotionModalBelow: boolean;
}

export interface ModalItemRef {
  handleClose: () => void;
}

const DEFAULT_ANIMATION_CONFIG: ModalAnimationConfig = {
  open: {
    opacity: 250,
    translateY: 300,
  },
  close: {
    opacity: 200,
    translateY: 200,
  },
};

const ModalItem = forwardRef<ModalItemRef, ModalItemProps>(
  ({ modal, isTop, onClose, hasMotionModalBelow }, ref) => {
    const animationConfig = modal.animationConfig || DEFAULT_ANIMATION_CONFIG;
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(modal.position === "bottom" ? 500 : 0);

    const [isClosing, setIsClosing] = useState(false);
    const [isAnimating, setIsAnimating] = useState(true);

    useEffect(() => {
      setIsAnimating(true);

      // motion 타입의 경우 자체 애니메이션을 사용하므로 즉시 표시
      if (modal.type === "motion") {
        opacity.value = 1;
        translateY.value = 0;
        setIsAnimating(false);
        return;
      }

      if (modal.position === "bottom") {
        opacity.value = withTiming(1, {
          duration: animationConfig.open.opacity,
          easing: Easing.out(Easing.cubic),
        });
        translateY.value = withTiming(
          0,
          {
            duration: animationConfig.open.translateY,
            easing: Easing.out(Easing.cubic),
          },
          () => {
            runOnJS(setIsAnimating)(false);
          },
        );
      } else if (modal.position === "center") {
        opacity.value = withTiming(
          1,
          {
            duration: animationConfig.open.opacity,
            easing: Easing.out(Easing.cubic),
          },
          () => {
            runOnJS(setIsAnimating)(false);
          },
        );
      }
    }, [modal.position, modal.type, opacity, translateY, animationConfig]);

    const handleClose = useCallback(() => {
      if (isClosing) return;
      setIsClosing(true);

      // motion 타입의 경우 MotionModalContent의 ref를 통해 내부 handleClose 호출
      if (modal.type === "motion") {
        if (modal.motionModalRef?.current?.handleClose) {
          // MotionModalContent의 자체 애니메이션과 함께 닫기
          modal.motionModalRef.current.handleClose();
        } else {
          // ref가 없거나 아직 설정되지 않은 경우 기본 처리
          onClose();
        }
        return;
      }

      if (modal.position === "bottom") {
        opacity.value = withTiming(0, {
          duration: animationConfig.close.opacity,
          easing: Easing.in(Easing.cubic),
        });
        translateY.value = withTiming(
          500,
          {
            duration: animationConfig.close.translateY,
            easing: Easing.in(Easing.cubic),
          },
          () => {
            runOnJS(onClose)();
          },
        );
      } else if (modal.position === "center") {
        opacity.value = withTiming(
          0,
          {
            duration: animationConfig.close.opacity,
            easing: Easing.in(Easing.cubic),
          },
          () => {
            runOnJS(onClose)();
          },
        );
      }
    }, [
      isClosing,
      modal.position,
      modal.type,
      modal.motionModalRef,
      opacity,
      translateY,
      onClose,
      animationConfig.close,
    ]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
        transform:
          modal.position === "bottom" ? [{ translateY: translateY.value }] : [],
      };
    });

    useImperativeHandle(ref, () => ({
      handleClose,
    }));

    return (
      <Pressable
        className={`flex-1 ${
          modal.position === "center" ? "justify-center" : "justify-end"
        }`}
        style={{ backgroundColor: "transparent" }}
        onPress={() => {
          // 이 모달이 최상위 모달인 경우에만 애니메이션과 함께 닫기
          if (isTop) {
            handleClose();
          }
        }}
      >
        {/* 모션모달 위의 일반모달에 추가 배경 */}
        {hasMotionModalBelow && modal.type !== "motion" && (
          <View className="absolute inset-0 bg-black/30" />
        )}

        <Animated.View
          style={animatedStyle}
          pointerEvents={isAnimating ? "none" : "auto"}
          onStartShouldSetResponder={() => true}
        >
          {modal.content}
        </Animated.View>
      </Pressable>
    );
  },
);

export default function ModalContainer() {
  const [modalStack] = useAtom(modalStackAtom);
  const { closeModal, closeModalById } = useModal();
  const topModalRef = useRef<ModalItemRef>(null);

  const handleRequestClose = useCallback(() => {
    if (topModalRef.current) {
      topModalRef.current.handleClose();
    } else {
      closeModal();
    }
  }, [closeModal]);

  if (modalStack.length === 0) return null;

  return (
    <View className="absolute inset-0 size-full flex-1">
      <Modal
        transparent
        animationType="none"
        className="absolute inset-0 size-full flex-1"
        onRequestClose={handleRequestClose}
      >
        <View className="size-full flex-1 bg-black/50">
          <SafeAreaView className="size-full flex-1" edges={["top", "bottom"]}>
            {modalStack.map((modal, index) => {
              const isTop = index === modalStack.length - 1;
              const hasMotionModalBelow = modalStack
                .slice(0, index)
                .some((m) => m.type === "motion");

              return (
                <View
                  key={modal.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1000 + index,
                  }}
                  pointerEvents={isTop ? "auto" : "none"}
                >
                  <ModalItem
                    modal={modal}
                    isTop={isTop}
                    hasMotionModalBelow={hasMotionModalBelow}
                    onClose={() => closeModalById(modal.id)} // 각 모달이 자신의 ID로 닫히도록 수정
                    ref={isTop ? topModalRef : null}
                  />
                </View>
              );
            })}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
