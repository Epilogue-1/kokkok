import { type InternalModal, modalStackAtom } from "@/contexts/modal.atom";
import { useModal } from "@/hooks/useModal";
import { useAtom } from "jotai";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal } from "react-native";
import {
  Animated,
  Easing,
  type GestureResponderEvent,
  View,
} from "react-native";

interface ModalItemProps {
  index: number;
  modal: InternalModal;
  isTop: boolean;
  onClose: () => void;
}

export interface ModalItemRef {
  handleClose: () => void;
}

const ModalItem = React.memo(
  forwardRef<ModalItemRef, ModalItemProps>(
    ({ index, modal, isTop, onClose }, ref) => {
      const fadeAnim = useMemo(() => new Animated.Value(0), []);
      const slideAnim = useMemo(
        () => new Animated.Value(modal.position === "bottom" ? 1 : 0),
        [modal.position],
      );

      const [isClosing, setIsClosing] = useState(false);
      const isMountedRef = useRef(true);
      const animationRef = useRef<Animated.CompositeAnimation | null>(null);

      // 애니메이션 config 메모이제이션
      const openAnimationConfig = useMemo(() => {
        if (modal.position === "bottom") {
          return {
            fade: { toValue: 1, duration: 200 },
            slide: {
              toValue: 0,
              duration: 350,
              easing: Easing.out(Easing.ease),
            },
          };
        }
        return {
          fade: { toValue: 1, duration: 200, easing: Easing.out(Easing.ease) },
        };
      }, [modal.position]);

      const closeAnimationConfig = useMemo(() => {
        if (modal.position === "bottom") {
          return {
            fade: { toValue: 0, duration: 250 },
            slide: {
              toValue: 1,
              duration: 350,
              easing: Easing.out(Easing.ease),
            },
          };
        }
        return {
          fade: { toValue: 0, duration: 250, easing: Easing.out(Easing.ease) },
        };
      }, [modal.position]);

      useEffect(() => {
        // iOS 애니메이션 안정성을 위한 프레임 지연
        const timer = setTimeout(() => {
          if (!isMountedRef.current) return;

          if (modal.position === "bottom") {
            animationRef.current = Animated.parallel([
              Animated.timing(fadeAnim, {
                ...openAnimationConfig.fade,
                useNativeDriver: true,
              }),
              Animated.timing(slideAnim, {
                ...openAnimationConfig.slide!,
                useNativeDriver: true,
              }),
            ]);
          } else if (modal.position === "center") {
            animationRef.current = Animated.timing(fadeAnim, {
              ...openAnimationConfig.fade,
              useNativeDriver: true,
            });
          }

          animationRef.current?.start();
        }, 16);

        return () => {
          clearTimeout(timer);
          isMountedRef.current = false;
          if (animationRef.current) {
            animationRef.current.stop();
            animationRef.current = null;
          }
        };
      }, [modal.position, fadeAnim, slideAnim, openAnimationConfig]);

      const handleClose = useCallback(() => {
        if (isClosing || !isMountedRef.current) return;
        setIsClosing(true);

        // 애니메이션 중단 및 cleanup
        if (animationRef.current) {
          animationRef.current.stop();
        }

        if (modal.position === "bottom") {
          // 하단 모달: 배경 페이드, 모달 슬라이드 다운
          animationRef.current = Animated.parallel([
            Animated.timing(fadeAnim, {
              ...closeAnimationConfig.fade,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              ...closeAnimationConfig.slide!,
              useNativeDriver: true,
            }),
          ]);
        } else if (modal.position === "center") {
          animationRef.current = Animated.timing(fadeAnim, {
            ...closeAnimationConfig.fade,
            useNativeDriver: true,
          });
        }

        // 애니메이션 완료 후 즉시 모달 제거
        animationRef.current?.start(({ finished }) => {
          if (isMountedRef.current) {
            if (finished) {
              onClose();
            } else {
              const cleanupTimer = setTimeout(() => {
                onClose();
              }, 10);
              return () => clearTimeout(cleanupTimer);
            }
          }
        });
      }, [
        isClosing,
        modal.position,
        fadeAnim,
        slideAnim,
        onClose,
        closeAnimationConfig,
      ]);

      // 스타일 메모이제이션
      const backgroundStyle = useMemo(
        () => ({
          opacity: fadeAnim,
          backgroundColor: index === 0 ? "rgba(0, 0, 0, 0.5)" : "transparent",
        }),
        [fadeAnim, index],
      );

      const contentTransform = useMemo(() => {
        if (modal.position === "bottom") {
          return [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 500],
              }),
            },
          ];
        }
        return [];
      }, [modal.position, slideAnim]);

      const containerClassName = useMemo(
        () =>
          `size-full flex-1 ${modal.position === "center" ? "justify-center" : "justify-end"}`,
        [modal.position],
      );

      // 배경 터치 시 닫기 (최상단 모달만)
      const handleBackgroundTouch = useMemo(
        () => (isTop ? handleClose : undefined),
        [isTop, handleClose],
      );

      const handleContentTouch = useCallback(
        (e: GestureResponderEvent) => e.stopPropagation(),
        [],
      );

      useImperativeHandle(
        ref,
        () => ({
          handleClose,
        }),
        [handleClose],
      );

      return (
        <>
          <Animated.View
            className={containerClassName}
            style={backgroundStyle}
            onTouchStart={handleBackgroundTouch}
          >
            {/* 모달 콘텐츠 */}
            <Animated.View
              onTouchStart={handleContentTouch}
              style={{ transform: contentTransform }}
            >
              {modal.content}
            </Animated.View>
          </Animated.View>
        </>
      );
    },
  ),
);

// ModalContainer: 모달 스택 렌더링 및 최적화
const ModalContainer = React.memo(() => {
  const [modalStack] = useAtom(modalStackAtom);
  const { closeModal } = useModal();
  const topModalRef = useRef<ModalItemRef>(null);

  // closeModal 메모이제이션
  const memoizedCloseModal = useCallback(() => {
    closeModal();
  }, [closeModal]);

  // 모달이 없으면 렌더링하지 않음
  if (modalStack.length === 0) return null;

  return (
    <View className="absolute inset-0" pointerEvents="box-none">
      <Modal
        transparent
        animationType="none"
        statusBarTranslucent
        hardwareAccelerated
        visible={true}
      >
        {/* 모달 스택 렌더링 */}
        {modalStack.map((modal, index) => {
          const isTop = index === modalStack.length - 1;
          return (
            <ModalItem
              key={modal.id}
              index={index}
              modal={modal}
              isTop={isTop}
              onClose={memoizedCloseModal}
              ref={isTop ? topModalRef : null}
            />
          );
        })}
      </Modal>
    </View>
  );
});

export default ModalContainer;
