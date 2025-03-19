import { type InternalModal, modalStackAtom } from "@/contexts/modal.atom";
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
import {
  Animated,
  BackHandler,
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

const ModalItem = forwardRef<ModalItemRef, ModalItemProps>(
  ({ index, modal, isTop, onClose }, ref) => {
    // position이 "bottom"이면 slide 애니메이션, "center"이면 fade 애니메이션 적용
    const fadeAnim = useRef(
      new Animated.Value(modal.position === "center" ? 0 : 1),
    ).current;
    const slideAnim = useRef(
      new Animated.Value(modal.position === "bottom" ? 0 : 1),
    ).current;

    // 닫힘 애니메이션 진행 중 여부
    const [isClosing, setIsClosing] = useState(false);

    // 나타나는 애니메이션
    useEffect(() => {
      if (modal.position === "bottom") {
        Animated.timing(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          duration: 500,
          easing: Easing.bezier(0.5, 1, 0.3, 1),
        }).start();
      } else if (modal.position === "center") {
        Animated.timing(fadeAnim, {
          toValue: 1,
          useNativeDriver: true,
          duration: 300,
          easing: Easing.bezier(0.5, 1, 0.3, 1),
        }).start();
      }
    }, [modal.position, fadeAnim, slideAnim]);

    // 닫힐 때 reverse 애니메이션 후 onClose 호출
    const handleClose = useCallback(() => {
      if (isClosing) return;
      setIsClosing(true);

      if (modal.position === "bottom") {
        Animated.timing(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          duration: 400,
        }).start(() => onClose());
      } else if (modal.position === "center") {
        Animated.timing(fadeAnim, {
          toValue: 0,
          useNativeDriver: true,
          duration: 300,
          easing: Easing.bezier(0.5, 1, 0.3, 1),
        }).start(() => onClose());
      } else {
        onClose();
      }
    }, [isClosing, modal.position, fadeAnim, slideAnim, onClose]);

    // 외부에서 handleClose() 호출할 수 있도록 ref에 노출
    useImperativeHandle(ref, () => ({
      handleClose,
    }));

    return (
      <View className="absolute inset-0">
        <View
          className={`size-full flex-1 ${
            index === 0 ? "bg-black/50" : ""
          } ${modal.position === "center" ? "justify-center" : "justify-end"}`}
          // 최상단 모달만 터치 시 닫힘 (exit 애니메이션 실행)
          onTouchStart={isTop ? handleClose : undefined}
        >
          <Animated.View
            onTouchStart={(e: GestureResponderEvent) => e.stopPropagation()}
            style={{
              opacity: fadeAnim,
              transform:
                modal.position === "bottom"
                  ? [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [500, 0],
                        }),
                      },
                    ]
                  : [],
            }}
          >
            {modal.content}
          </Animated.View>
        </View>
      </View>
    );
  },
);

export default function ModalContainer(): JSX.Element | null {
  const [modalStack] = useAtom(modalStackAtom);
  const { closeModal } = useModal();
  // 최상단 모달에 대한 ref 생성
  const topModalRef = useRef<ModalItemRef>(null);

  // 하드웨어 뒤로가기 버튼 처리: 모달이 열려있으면 최상단 모달의 exit 애니메이션 실행
  useEffect(() => {
    const onBackPress = (): boolean => {
      if (modalStack.length > 0) {
        if (topModalRef.current) {
          topModalRef.current.handleClose();
        } else {
          // 혹시 ref가 없을 경우 fallback으로 바로 닫기
          closeModal();
        }
        return true; // 이벤트 소모
      }
      return false; // 기본 동작 수행
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => backHandler.remove();
  }, [modalStack, closeModal]);

  if (modalStack.length === 0) return null;

  return (
    <View className="absolute inset-0">
      {modalStack.map((modal, index) => {
        const isTop = index === modalStack.length - 1;
        return (
          <ModalItem
            key={modal.id}
            index={index}
            modal={modal}
            isTop={isTop}
            onClose={closeModal}
            // 최상단 모달에 ref 전달
            ref={isTop ? topModalRef : null}
          />
        );
      })}
    </View>
  );
}
