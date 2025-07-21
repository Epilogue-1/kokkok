import { atom } from "jotai";

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

export interface InternalModal {
  id: string;
  content: React.ReactNode;
  position: ModalPosition;
  type: ModalType;
  animationConfig?: ModalAnimationConfig;
}

export const modalStackAtom = atom<InternalModal[]>([]);
