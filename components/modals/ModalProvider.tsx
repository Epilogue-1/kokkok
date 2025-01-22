import { modalStateAtom } from "@/contexts/modal.atom";
import { useModal } from "@/hooks/useModal";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { Animated, Easing, Modal, View } from "react-native";

import { DeleteCommentModal, DeletePostModal } from "./DeleteModals";
import {
  SelectCommentDeleteModal,
  SelectFriendRequestModal,
  SelectPostEditDeleteModal,
  SelectPostUploadImageModal,
  SelectProfileEditModal,
  SelectProfileImageEditModal,
} from "./ListModals";
import {
  EmailCheckModal,
  PasswordResetCompleteModal,
  PasswordResetEmailCheckModal,
  PostUploadFailModal,
} from "./OneButtonModals";
import RestDayModal from "./RestDayModal";
import {
  AccountDeleteModal,
  PostNotFoundModal,
  SignOutModal,
} from "./TwoButtonModals";

export default function ModalContainer() {
  const [modalState] = useAtom(modalStateAtom);
  const { closeModal } = useModal();
  const { isOpen, modal, position, previousPosition } = modalState;

  // 모달 애니메이션
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isOpen) return;

    // 첫 모달 오픈 시, bottom 위치라면 slideAnim 작동
    if (!previousPosition && position === "bottom") {
      slideAnim.setValue(0);
      Animated.timing(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        duration: 500,
        easing: Easing.bezier(0.5, 1, 0.3, 1),
      }).start();
      return;
    }

    if (!previousPosition && position === "center") {
      slideAnim.setValue(1);
    }

    // modal이 bottom -> center로 바뀔 때: fadeAnim 작동
    if (position === "center" && previousPosition === "bottom") {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
        duration: 300,
        easing: Easing.bezier(0.5, 1, 0.3, 1),
      }).start();
    }
  }, [isOpen, position, previousPosition, fadeAnim, slideAnim]);

  if (!modal) return null;

  const renderModalContent = () => {
    switch (modal.type) {
      /* -------------------------------- Delete Modals -------------------------------- */
      case "DELETE_POST":
        return (
          <DeletePostModal postId={modal.postId} isDetail={modal.isDetail} />
        );
      case "DELETE_COMMENT":
        return (
          <DeleteCommentModal
            postId={modal.postId}
            commentId={modal.commentId}
          />
        );

      /* --------------------------------- List Modals ---------------------------------- */
      case "SELECT_POST_EDIT_DELETE":
        return (
          <SelectPostEditDeleteModal
            position={position}
            postId={modal.postId}
          />
        );
      case "SELECT_COMMENT_DELETE":
        return (
          <SelectCommentDeleteModal
            position={position}
            postId={modal.postId}
            commentId={modal.commentId}
          />
        );
      case "SELECT_PROFILE_IMAGE_EDIT":
        return (
          <SelectProfileImageEditModal
            setProfileInput={modal.setProfileInput}
          />
        );
      case "SELECT_PROFILE_EDIT":
        return <SelectProfileEditModal />;
      case "SELECT_POST_UPLOAD_IMAGE":
        return (
          <SelectPostUploadImageModal
            imageItems={modal.imageItems}
            setImageItems={modal.setImageItems}
            flatListRef={modal.flatListRef}
            isLoading={modal.isLoading}
          />
        );
      case "SELECT_FRIEND_REQUEST":
        return (
          <SelectFriendRequestModal
            userId={modal.userId}
            relation={modal.relation}
          />
        );

      /* ------------------------------- One Button Modals ------------------------------- */
      case "EMAIL_CHECK":
        return <EmailCheckModal />;
      case "PASSWORD_RESET_COMPLETE":
        return <PasswordResetCompleteModal />;
      case "POST_UPLOAD_FAIL":
        return <PostUploadFailModal />;
      case "PASSWORD_RESET_EMAIL_CHECK":
        return <PasswordResetEmailCheckModal />;

      /* ------------------------------- Two Button Modals ------------------------------- */
      case "POST_NOT_FOUND":
        return <PostNotFoundModal />;
      case "ACCOUNT_DELETE":
        return <AccountDeleteModal />;
      case "SIGN_OUT":
        return <SignOutModal />;

      /* -------------------------------- Custom Modals -------------------------------- */
      case "REST_DAY":
        return <RestDayModal />;

      default:
        return null;
    }
  };

  return (
    <>
      {isOpen && (
        <View className="-translate-y-1/2 -translate-x-1/2 absolute top-1/2 left-1/2 flex-1">
          <Modal
            transparent
            visible={isOpen}
            animationType="fade"
            onRequestClose={closeModal}
          >
            <View
              className={`size-full flex-1 bg-black/50 ${
                position === "center" ? "justify-center" : "justify-end"
              }`}
              onTouchStart={closeModal}
            >
              <Animated.View
                onTouchStart={(e) => e.stopPropagation()}
                style={{
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [500, 0],
                      }),
                    },
                  ],
                }}
              >
                {renderModalContent()}
              </Animated.View>
            </View>
          </Modal>
        </View>
      )}
    </>
  );
}
