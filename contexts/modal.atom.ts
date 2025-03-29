import { atom } from "jotai";

export type ModalPosition = "bottom" | "center";

export interface InternalModal {
  id: string;
  content: React.ReactNode;
  position: ModalPosition;
}

export const modalStackAtom = atom<InternalModal[]>([]);
