import {
  type InternalModal,
  type ModalAnimationConfig,
  type ModalPosition,
  type ModalType,
  modalStackAtom,
} from "@/contexts/modal.atom";
import { useAtom } from "jotai";

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
 * @property {(content: React.ReactNode, position: ModalPosition, options?: {replace?: boolean, type?: ModalType, animationConfig?: ModalAnimationConfig}) => void} openModal - 새 모달을 열거나 최상위 모달을 교체
 * @property {() => void} closeModal - 최상위 모달을 닫음
 * @property {() => void} closeAllModals - 모든 모달을 닫음
 *
 * @example
 * const { modalStack, openModal, closeModal, closeAllModals } = useModal();
 *
 * 새 모달 열기
 * openModal(<MyContent />, "center");
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
    } = { replace: true, type: "default" },
  ) => {
    const newModal: InternalModal = {
      content,
      position,
      id: generateId(),
      type: options.type ?? "default",
      animationConfig: options.animationConfig,
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

  return { modalStack, openModal, closeModal, closeAllModals };
}
