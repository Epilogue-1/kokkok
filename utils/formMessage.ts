import {
  NOTIFICATION_TYPE,
  type NotificationType,
} from "@/types/Notification.interface";

export const shortenMessage = (message: string, maxLength: number) => {
  // 이모지는 두 바이트 이상일 수 있기 때문에 Array.from 사용해서 이모지 처리
  const commentArray = Array.from(message);
  return `${commentArray.length > maxLength ? commentArray.slice(0, maxLength).join("").concat("...") : message}`;
};

type NotificationConfig = Record<
  NotificationType,
  { title: string; content: string }
>;
interface FormMessageProps {
  type: NotificationType;
  username?: string;
  comment?: string;
  isAccepted?: boolean;
}

export function formMessage({
  type,
  username,
  comment,
  isAccepted,
}: FormMessageProps) {
  const NOTIFICATION_CONFIG: NotificationConfig = {
    [NOTIFICATION_TYPE.POKE]: {
      title: "👈 콕!",
      content: `${username}님이 콕 찌르셨어요.`,
    },
    [NOTIFICATION_TYPE.COMMENT]: {
      title: `${username}님의 댓글`,
      content: `"${comment}"`,
    },
    [NOTIFICATION_TYPE.MENTION]: {
      title: `${username}님의 멘션`,
      content: `"${comment}"`,
    },
    [NOTIFICATION_TYPE.COMMENT_LIKE]: {
      title: `${username}님이`,
      content: "댓글에 좋아요를 눌렀어요❤️",
    },
    [NOTIFICATION_TYPE.LIKE]: {
      title: `${username}님이`,
      content: "게시글에 좋아요를 눌렀어요❤️",
    },
    [NOTIFICATION_TYPE.FRIEND]: {
      title: `${username}님이`,
      content: isAccepted
        ? "친구 요청을 수락하셨어요😊"
        : "친구 요청을 보냈어요",
    },
    [NOTIFICATION_TYPE.FAVORITE]: {
      title: `${username}님이`,
      content: "오늘 운동을 완료했어요💪",
    },
  };

  return NOTIFICATION_CONFIG[type];
}
