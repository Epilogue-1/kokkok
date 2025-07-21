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
  ({ modal, isTop, onClose }, ref) => {
    const animationConfig = modal.animationConfig || DEFAULT_ANIMATION_CONFIG;
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(modal.position === "bottom" ? 500 : 0);

    const [isClosing, setIsClosing] = useState(false);
    const [isAnimating, setIsAnimating] = useState(true);

    useEffect(() => {
      setIsAnimating(true);
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
    }, [modal.position, opacity, translateY, animationConfig]);

    const handleClose = useCallback(() => {
      if (isClosing) return;
      setIsClosing(true);

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
      <View
        className={`flex-1 ${
          modal.position === "center" ? "justify-center" : "justify-end"
        }`}
        pointerEvents="box-none"
      >
        <Animated.View
          style={animatedStyle}
          pointerEvents={isAnimating ? "none" : "auto"}
        >
          {modal.content}
        </Animated.View>
      </View>
    );
  },
);

export default function ModalContainer() {
  const [modalStack] = useAtom(modalStackAtom);
  const { closeModal } = useModal();
  const topModalRef = useRef<ModalItemRef>(null);

  const handleBackgroundPress = useCallback(() => {
    if (topModalRef.current) {
      topModalRef.current.handleClose();
    } else {
      closeModal();
    }
  }, [closeModal]);

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
        <Pressable
          className="size-full flex-1 bg-black/50"
          onPress={handleBackgroundPress}
        >
          <SafeAreaView className="size-full flex-1" edges={["top", "bottom"]}>
            {modalStack.map((modal, index) => {
              const isTop = index === modalStack.length - 1;
              return (
                <ModalItem
                  key={modal.id}
                  modal={modal}
                  isTop={isTop}
                  onClose={closeModal}
                  ref={isTop ? topModalRef : null}
                />
              );
            })}
          </SafeAreaView>
        </Pressable>
      </Modal>
    </View>
  );
}
