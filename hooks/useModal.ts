import type { ModalType } from "@/types/Modal.interface";
import { setModalStateAtom } from "@/utils/modal.atom";
import { useAtom } from "jotai";

export function useModal() {
  const [, setModalState] = useAtom(setModalStateAtom);

  const openModal = (
    modal: ModalType,
    position: "center" | "bottom" = "center",
  ) => {
    setModalState({
      isOpen: true,
      modal,
      position,
    });
  };
  const closeModal = () => {
    setModalState({
      isOpen: false,
      modal: null,
      position: undefined,
    });
  };

  return { openModal, closeModal };
}
