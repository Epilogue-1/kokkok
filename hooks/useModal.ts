import MotionModalContent, {
  type MotionModalContentRef,
} from "@/components/modals/MotionModalContent";
import {
  type InternalModal,
  type ModalAnimationConfig,
  type ModalPosition,
  type ModalType,
  type MotionModalConfig,
  modalStackAtom,
} from "@/contexts/modal.atom";
import { useAtom } from "jotai";
import React from "react";

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `modal_${idCounter}`;
}

export interface ModalConfig {
  content: React.ReactNode;
  position: ModalPosition;
  animationConfig?: ModalAnimationConfig;
}

/**
 * 모달 다이얼로그를 관리하기 위한 커스텀 훅
 *
 * @returns {object} 모달 메서드와 상태를 포함하는 객체
 * @property {InternalModal[]} modalStack - 현재 열려있는 모달들의 스택
 * @property {(content: React.ReactNode, position: ModalPosition, options?: {replace?: boolean, type?: ModalType, animationConfig?: ModalAnimationConfig, motionConfig?: MotionModalConfig}) => void} openModal - 새 모달을 열거나 최상위 모달을 교체
 * @property {(children: React.ReactNode, config: MotionModalConfig, options?: {replace?: boolean, animationConfig?: ModalAnimationConfig}) => void} openMotionModal - Motion 모달을 열기
 * @property {() => void} closeModal - 최상위 모달을 닫음
 * @property {() => void} closeAllModals - 모든 모달을 닫음
 *
 * @example
 * const { modalStack, openModal, openMotionModal, closeModal, closeAllModals } = useModal();
 *
 * 새 모달 열기
 * openModal(<MyContent />, "center");
 *
 * Motion 모달 열기
 * openMotionModal(<MyContent />, { maxHeight: 500, initialHeight: 300 });
 *
 * 애니메이션 설정과 함께 모달 열기
 * openModal(<MyContent />, "bottom", {
 *   animationConfig: {
 *     open: { opacity: 500, translateY: 500 },
 *     close: { opacity: 200, translateY: 200 }
 *   }
 * });
 *
 * 최상위 모달 교체하기
 * openModal(<NewContent />, "bottom", { replace: true });
 *
 * 최상위 모달 닫기
 * closeModal();
 *
 * 모든 모달 닫기
 * closeAllModals();
 */
export function useModal() {
  const [modalStack, setModalStack] = useAtom(modalStackAtom);

  /**
   * 새로운 모달 다이얼로그를 엽니다
   * @param content 모달 컨텐츠 컴포넌트
   * @param position 모달 위치 ("center" | "bottom")
   * @param options 추가 옵션 ({ replace: boolean = true, type: ModalType = "default", animationConfig?: ModalAnimationConfig })
   */
  const openModal = (
    content: React.ReactNode,
    position: ModalPosition = "center",
    options: {
      replace?: boolean;
      type?: ModalType;
      animationConfig?: ModalAnimationConfig;
      motionConfig?: MotionModalConfig;
    } = { replace: true, type: "default" },
  ) => {
    const newModal: InternalModal = {
      content,
      position,
      id: generateId(),
      type: options.type ?? "default",
      animationConfig: options.animationConfig,
      motionConfig: options.motionConfig,
    };

    // 모션 모달이 열려있고 새로 여는 모달이 모션이 아닌 경우
    const hasMotionModal = modalStack.some((modal) => modal.type === "motion");
    const nonMotionModals = modalStack.filter(
      (modal) => modal.type !== "motion",
    );

    if (hasMotionModal && options.type !== "motion") {
      if (nonMotionModals.length > 0) {
        // 모션모달 + 일반모달이 있고 새로운 일반모달을 열면 최상위 일반모달 교체
        // 기존 replace 로직으로 계속 진행
      } else {
        // 모션모달만 있고 새로운 일반모달을 열면 스택에 추가
        setModalStack((prev) => [...prev, newModal]);
        return;
      }
    }

    if (options.replace && modalStack.length > 0) {
      setModalStack((prev) => {
        const newStack = [...prev];
        newStack[newStack.length - 1] = newModal;
        return newStack;
      });
    } else {
      setModalStack((prev) => [...prev, newModal]);
    }
  };

  /**
   * Motion 모달을 엽니다 (드래그 가능한 바텀 시트)
   * @param children 모달 컨텐츠
   * @param config Motion 모달 설정
   * @param options 추가 옵션
   */
  const openMotionModal = (
    children: React.ReactNode,
    config: MotionModalConfig,
    options: {
      replace?: boolean;
      animationConfig?: ModalAnimationConfig;
    } = { replace: false }, // 기본값을 false로 변경
  ) => {
    const motionModalRef = React.createRef<MotionModalContentRef>();

    const motionContent = React.createElement(MotionModalContent, {
      ...config,
      onClose: closeModal,
      children,
      ref: motionModalRef,
    });

    const newModal: InternalModal = {
      content: motionContent,
      position: "bottom",
      id: generateId(),
      type: "motion",
      animationConfig: options.animationConfig,
      motionConfig: config,
      motionModalRef,
    };

    if (options.replace && modalStack.length > 0) {
      setModalStack((prev) => {
        const newStack = [...prev];
        newStack[newStack.length - 1] = newModal;
        return newStack;
      });
    } else {
      setModalStack((prev) => [...prev, newModal]);
    }
  };

  const closeModal = () => {
    setModalStack((prev) => prev.slice(0, -1));
  };

  const closeAllModals = () => {
    setModalStack([]);
  };

  return { modalStack, openModal, openMotionModal, closeModal, closeAllModals };
}
