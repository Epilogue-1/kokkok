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
import { Modal } from "react-native";
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
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(
      new Animated.Value(modal.position === "bottom" ? 1 : 0),
    ).current;

    const [isClosing, setIsClosing] = useState(false);
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
      if (modal.position === "bottom") {
        animationRef.current = Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            useNativeDriver: true,
            duration: 300,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            duration: 500,
            easing: Easing.bezier(0.5, 1, 0.3, 1),
          }),
        ]);
      } else if (modal.position === "center") {
        animationRef.current = Animated.timing(fadeAnim, {
          toValue: 1,
          useNativeDriver: true,
          duration: 300,
          easing: Easing.bezier(0.5, 1, 0.3, 1),
        });
      }

      animationRef.current?.start();

      return () => {
        animationRef.current?.stop();
      };
    }, [modal.position, fadeAnim, slideAnim]);

    const handleClose = useCallback(() => {
      if (isClosing) return;
      setIsClosing(true);

      if (modal.position === "bottom") {
        animationRef.current = Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            useNativeDriver: true,
            duration: 300,
          }),
          Animated.timing(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            duration: 300,
          }),
        ]);
      } else if (modal.position === "center") {
        animationRef.current = Animated.timing(fadeAnim, {
          toValue: 0,
          useNativeDriver: true,
          duration: 300,
          easing: Easing.bezier(0.5, 1, 0.3, 1),
        });
      }

      animationRef.current?.start(({ finished }) => {
        if (finished) onClose();
      });
    }, [isClosing, modal.position, fadeAnim, slideAnim, onClose]);

    useImperativeHandle(ref, () => ({
      handleClose,
    }));

    return (
      <Modal transparent animationType={"none"} className="absolute inset-0">
        <View
          className={`size-full flex-1 ${
            index === 0 ? "bg-black/50" : ""
          } ${modal.position === "center" ? "justify-center" : "justify-end"}`}
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
                          outputRange: [0, 500],
                        }),
                      },
                    ]
                  : [],
            }}
          >
            {modal.content}
          </Animated.View>
        </View>
      </Modal>
    );
  },
);

export default function ModalContainer() {
  const [modalStack] = useAtom(modalStackAtom);
  const { closeModal } = useModal();
  const topModalRef = useRef<ModalItemRef>(null);

  useEffect(() => {
    const onBackPress = (): boolean => {
      if (modalStack.length > 0) {
        if (topModalRef.current) {
          topModalRef.current.handleClose();
        } else {
          closeModal();
        }
        return true;
      }
      return false;
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
            ref={isTop ? topModalRef : null}
          />
        );
      })}
    </View>
  );
}
