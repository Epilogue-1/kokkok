import type { MotionModalContentRef } from "@/components/modals/MotionModalContent";
import { atom } from "jotai";
import type React from "react";

export type ModalPosition = "bottom" | "center";
export type ModalType = "default" | "motion";

interface AnimationConfig {
  opacity: number;
  translateY: number;
}

export interface ModalAnimationConfig {
  open: AnimationConfig;
  close: AnimationConfig;
}

export interface MotionModalConfig {
  maxHeight: number;
  initialHeight: number;
  closeThreshold?: number;
  preventAutoClose?: boolean; // 다른 모달을 열 때 자동으로 닫히지 않도록 하는 옵션
}

export interface InternalModal {
  id: string;
  content: React.ReactNode;
  position: ModalPosition;
  type: ModalType;
  animationConfig?: ModalAnimationConfig;
  motionConfig?: MotionModalConfig;
  motionModalRef?: React.RefObject<MotionModalContentRef>; // MotionModalContent의 ref 저장
}

export const modalStackAtom = atom<InternalModal[]>([]);
