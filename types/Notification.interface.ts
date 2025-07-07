import type { UserProfile } from "./User.interface";

export const NOTIFICATION_TYPE = {
  POKE: "poke",
  COMMENT: "comment",
  COMMENT_LIKE: "commentLike",
  LIKE: "like",
  MENTION: "mention",
  FRIEND: "friend",
  FAVORITE: "favorite",
} as const;
export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export interface NotificationData {
  postId?: number;
  commentInfo?: {
    id: number;
    content?: string;
  };
  isAccepted?: boolean;
}

export interface Notification {
  to: string;
  type: NotificationType;
  data?: NotificationData;
}

export interface NotificationResponse {
  id: number;
  from: UserProfile;
  type: NotificationType;
  data: NotificationData | null;
  createdAt: string;
}

export interface PushSetting {
  userId: string;
  token: string; // 실제 토큰 or "logout"
  grantedNotifications: NotificationType[];
}

export interface PushMessage {
  to: string;
  sound: string;
  title: string;
  body: string;
}
