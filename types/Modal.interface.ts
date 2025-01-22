import type { ImageItem } from "@/components/modals/ListModals";
import type { FlatList } from "react-native-gesture-handler";
import type { RelationType } from "./Friend.interface";

/* -------------------------------------------------------------------------- */
/*                             Delete Modal Props                             */
/* -------------------------------------------------------------------------- */

// 게시물 삭제 모달
export interface DeletePostModalProps {
  type: "DELETE_POST";
  postId: number;
  isDetail?: boolean;
}

// 댓글 삭제 모달
export interface DeleteCommentModalProps {
  type: "DELETE_COMMENT";
  postId: number;
  commentId: number;
}

/* -------------------------------------------------------------------------- */
/*                              List Modal Props                              */
/* -------------------------------------------------------------------------- */

// 게시물 수정/삭제 선택 모달
export interface SelectPostEditDeleteModalProps {
  type: "SELECT_POST_EDIT_DELETE";
  postId: number;
}

// 댓글 삭제 선택 모달
export interface SelectCommentDeleteModalProps {
  type: "SELECT_COMMENT_DELETE";
  postId: number;
  commentId: number;
}

// 프로필 이미지 편집 선택 모달
export interface SelectProfileImageEditModalProps {
  type: "SELECT_PROFILE_IMAGE_EDIT";
  setProfileInput: React.Dispatch<
    React.SetStateAction<{
      avatarUrl: string;
      username: string;
      description: string;
    }>
  >;
}

// 프로필 편집 선택 모달
export interface SelectProfileEditModalProps {
  type: "SELECT_PROFILE_EDIT";
}

// 게시물 업로드 이미지 선택 모달
export interface SelectPostUploadImageModalProps {
  type: "SELECT_POST_UPLOAD_IMAGE";
  imageItems: ImageItem[];
  setImageItems: React.Dispatch<React.SetStateAction<ImageItem[]>>;
  flatListRef: React.RefObject<FlatList<ImageItem>>;
  isLoading: boolean;
}

// 친구 요청 선택 모달
export interface SelectFriendRequestModalProps {
  type: "SELECT_FRIEND_REQUEST";
  userId: string;
  relation: RelationType;
}

/* -------------------------------------------------------------------------- */
/*                           One Button Modal Props                           */
/* -------------------------------------------------------------------------- */

// 이메일 체크 모달
export interface EmailCheckModalProps {
  type: "EMAIL_CHECK";
}

// 비밀번호 재설정 완료 모달
export interface PasswordResetCompleteModalProps {
  type: "PASSWORD_RESET_COMPLETE";
}

// 게시물 업로드 실패 모달
export interface PostUploadFailModalProps {
  type: "POST_UPLOAD_FAIL";
}

// 비밀번호 재설정 이메일 확인 모달
export interface PasswordResetEmailCheckModalProps {
  type: "PASSWORD_RESET_EMAIL_CHECK";
}

/* -------------------------------------------------------------------------- */
/*                           Two Button Modal Props                           */
/* -------------------------------------------------------------------------- */

// 게시물 없음 모달
export interface PostNotFoundModalProps {
  type: "POST_NOT_FOUND";
}

// 계정 삭제 모달
export interface AccountDeleteModalProps {
  type: "ACCOUNT_DELETE";
}

// 로그아웃 모달
export interface SignOutModalProps {
  type: "SIGN_OUT";
}

/* -------------------------------------------------------------------------- */
/*                           Custom Modal Props                               */
/* -------------------------------------------------------------------------- */

/**
 * @description
 * 쉬는 날 설정 모달
 */
export interface RestDayModalProps {
  type: "REST_DAY";
}

/* -------------------------------------------------------------------------- */
/*                               Modal Types                                  */
/* -------------------------------------------------------------------------- */

export type ModalType =
  // Delete Modal
  | DeletePostModalProps
  | DeleteCommentModalProps
  // List Modal
  | SelectPostEditDeleteModalProps
  | SelectCommentDeleteModalProps
  | SelectProfileImageEditModalProps
  | SelectProfileEditModalProps
  | SelectPostUploadImageModalProps
  | SelectFriendRequestModalProps
  // One Button
  | EmailCheckModalProps
  | PasswordResetCompleteModalProps
  | PostUploadFailModalProps
  | PasswordResetEmailCheckModalProps
  // Two Button
  | PostNotFoundModalProps
  | AccountDeleteModalProps
  | SignOutModalProps
  // Custom
  | RestDayModalProps;

/* -------------------------------------------------------------------------- */
/*                            Modal State & Etc                               */
/* -------------------------------------------------------------------------- */

// 모달 위치
export type ModalPosition = "center" | "bottom";

export interface ModalState {
  isOpen: boolean;
  position: ModalPosition;
  modal: ModalType | null;
  previousPosition: ModalPosition | null;
}

export interface ListButton {
  text: string;
  onPress: () => void | Promise<void>;
  className?: string;
}

export type EmojiType = "SAD" | "HAPPY";
