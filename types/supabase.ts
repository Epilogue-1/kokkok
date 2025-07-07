import type {
  NotificationData,
  NotificationType,
} from "./Notification.interface";
import type { StatusType, UserProfile } from "./User.interface";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      blockUser: {
        Row: {
          blockedId: string;
          blockerId: string;
          createdAt: string;
          id: number;
        };
        Insert: {
          blockedId: string;
          blockerId: string;
          createdAt?: string;
          id?: number;
        };
        Update: {
          blockedId?: string;
          blockerId?: string;
          createdAt?: string;
          id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "blockUser_blockedId_fkey";
            columns: ["blockedId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blockUser_blockerId_fkey";
            columns: ["blockerId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      comment: {
        Row: {
          contents: string;
          createdAt: string;
          id: number;
          likes: number | null;
          parentsCommentId: number | null;
          postId: number;
          replyCommentId: number | null;
          userId: string;
        };
        Insert: {
          contents: string;
          createdAt?: string;
          id?: number;
          likes?: number | null;
          parentsCommentId?: number | null;
          postId: number;
          replyCommentId?: number | null;
          userId?: string;
        };
        Update: {
          contents?: string;
          createdAt?: string;
          id?: number;
          likes?: number | null;
          parentsCommentId?: number | null;
          postId?: number;
          replyCommentId?: number | null;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comment_parentsCommentId_fkey";
            columns: ["parentsCommentId"];
            isOneToOne: false;
            referencedRelation: "comment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_postId_fkey";
            columns: ["postId"];
            isOneToOne: false;
            referencedRelation: "post";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_replyCommentId_fkey";
            columns: ["replyCommentId"];
            isOneToOne: false;
            referencedRelation: "comment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      commentLike: {
        Row: {
          commentId: number | null;
          createdAt: string;
          id: number;
          userId: string | null;
        };
        Insert: {
          commentId?: number | null;
          createdAt?: string;
          id?: number;
          userId?: string | null;
        };
        Update: {
          commentId?: number | null;
          createdAt?: string;
          id?: number;
          userId?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "commentLike_commentId_fkey";
            columns: ["commentId"];
            isOneToOne: false;
            referencedRelation: "comment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commentLike_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      favorite: {
        Row: {
          createdAt: string;
          favoriteUserId: string;
          id: number;
          userId: string;
        };
        Insert: {
          id?: number;
          createdAt?: string;
          userId: string;
          favoriteUserId: string;
        };
        Update: {
          id?: number;
          createdAt?: string;
          userId?: string;
          favoriteUserId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorite_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorite_favoriteUserId_fkey";
            columns: ["favoriteUserId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      friendRequest: {
        Row: {
          createdAt: string;
          from: string;
          id: number;
          isAccepted: boolean | null;
          to: string;
        };
        Insert: {
          createdAt?: string;
          from: string;
          id?: number;
          isAccepted?: boolean | null;
          to: string;
        };
        Update: {
          createdAt?: string;
          from?: string;
          id?: number;
          isAccepted?: boolean | null;
          to?: string;
        };
        Relationships: [
          {
            foreignKeyName: "friendRequest_from_fkey";
            columns: ["from"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friendRequest_to_fkey";
            columns: ["to"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      notification: {
        Row: {
          createdAt: string;
          data: NotificationData | null;
          from: string;
          id: number;
          to: string;
          type: Database["public"]["Enums"]["notificationtype"];
        };
        Insert: {
          createdAt?: string;
          data?: NotificationData | null;
          from: string;
          id?: number;
          to: string;
          type: Database["public"]["Enums"]["notificationtype"];
        };
        Update: {
          createdAt?: string;
          data?: NotificationData | null;
          from?: string;
          id?: number;
          to?: string;
          type?: Database["public"]["Enums"]["notificationtype"];
        };
        Relationships: [
          {
            foreignKeyName: "notification_from_fkey";
            columns: ["from"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_to_fkey";
            columns: ["to"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      post: {
        Row: {
          contents: string | null;
          createdAt: string;
          id: number;
          images: string[];
          likes: number;
          privacy: Database["public"]["Enums"]["privacyType"];
          ratio: number | null;
          userId: string;
        };
        Insert: {
          contents?: string | null;
          createdAt?: string;
          id?: number;
          images: string[];
          likes?: number;
          privacy?: Database["public"]["Enums"]["privacyType"];
          ratio?: number | null;
          userId?: string;
        };
        Update: {
          contents?: string | null;
          createdAt?: string;
          id?: number;
          images?: string[];
          likes?: number;
          privacy?: Database["public"]["Enums"]["privacyType"];
          ratio?: number | null;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      postLike: {
        Row: {
          createdAt: string;
          id: number;
          postId: number | null;
          userId: string | null;
        };
        Insert: {
          createdAt?: string;
          id?: number;
          postId?: number | null;
          userId?: string | null;
        };
        Update: {
          createdAt?: string;
          id?: number;
          postId?: number | null;
          userId?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "postLike_postId_fkey";
            columns: ["postId"];
            isOneToOne: false;
            referencedRelation: "post";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "postLike_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      pushToken: {
        Row: {
          createdAt: string;
          grantedNotifications: Database["public"]["Enums"]["notificationtype"][];
          id: number;
          token: string;
          userId: string;
        };
        Insert: {
          createdAt?: string;
          grantedNotifications: Database["public"]["Enums"]["notificationtype"][];
          id?: number;
          token: string;
          userId: string;
        };
        Update: {
          createdAt?: string;
          grantedNotifications?: Database["public"]["Enums"]["notificationtype"][];
          id?: number;
          token?: string;
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pushToken_userId_fkey";
            columns: ["userId"];
            isOneToOne: true;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      report: {
        Row: {
          commentId: number | null;
          createdAt: string;
          id: string;
          postId: number | null;
          reportContent: string | null;
          reportedId: string;
          reporterId: string;
          reportType: Database["public"]["Enums"]["reportType"];
        };
        Insert: {
          commentId?: number | null;
          createdAt?: string;
          id?: string;
          postId?: number | null;
          reportContent?: string | null;
          reportedId: string;
          reporterId: string;
          reportType: Database["public"]["Enums"]["reportType"];
        };
        Update: {
          commentId?: number | null;
          createdAt?: string;
          id?: string;
          postId?: number | null;
          reportContent?: string | null;
          reportedId?: string;
          reporterId?: string;
          reportType?: Database["public"]["Enums"]["reportType"];
        };
        Relationships: [
          {
            foreignKeyName: "reprot_commentId_fkey";
            columns: ["commentId"];
            isOneToOne: false;
            referencedRelation: "comment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reprot_postId_fkey";
            columns: ["postId"];
            isOneToOne: false;
            referencedRelation: "post";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reprot_reportedId_fkey";
            columns: ["reportedId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reprot_reporterId_fkey";
            columns: ["reporterId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      user: {
        Row: {
          avatarUrl: string | null;
          backgroundUrl: string | null;
          createdAt: string | null;
          description: string | null;
          email: string;
          id: string;
          isOAuth: boolean | null;
          notificationCheckedAt: string | null;
          updatedAt: string | null;
          username: string;
        };
        Insert: {
          avatarUrl?: string | null;
          backgroundUrl?: string | null;
          createdAt?: string | null;
          description?: string | null;
          email: string;
          id: string;
          isOAuth?: boolean | null;
          notificationCheckedAt?: string | null;
          updatedAt?: string | null;
          username: string;
        };
        Update: {
          avatarUrl?: string | null;
          backgroundUrl?: string | null;
          createdAt?: string | null;
          description?: string | null;
          email?: string;
          id?: string;
          isOAuth?: boolean | null;
          notificationCheckedAt?: string | null;
          updatedAt?: string | null;
          username?: string;
        };
        Relationships: [];
      };
      workoutHistory: {
        Row: {
          createdAt: string;
          date: string;
          id: number;
          status: Database["public"]["Enums"]["workoutstatus"];
          userId: string;
        };
        Insert: {
          createdAt?: string;
          date: string;
          id?: number;
          status: Database["public"]["Enums"]["workoutstatus"];
          userId: string;
        };
        Update: {
          createdAt?: string;
          date?: string;
          id?: number;
          status?: Database["public"]["Enums"]["workoutstatus"];
          userId?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workoutHistory_userId_fkey";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_friend_request: {
        Args: {
          request_id: number | null;
          from_user_id: string;
          to_user_id: string;
        };
        Returns: undefined;
      };
      create_notification: {
        Args: { p_to: string; p_type: string; p_data: Json };
        Returns: Json;
      };
      decrement_comment_likes: {
        Args: {
          p_comment_id: number;
        };
        Returns: undefined;
      };
      delete_user_data: {
        Args: {
          user_id: string;
        };
        Returns: undefined;
      };
      get_comments: {
        Args: { postid: number; startindex: number; endindex: number };
        Returns: {
          id: number;
          contents: string;
          userId: string;
          createdAt: string;
          userData: {
            id: string;
            username: string;
            avatarUrl: string | null;
          };
          likes: number;
          isLiked: boolean;
          likedAvatars: string[];
          parentsCommentId: number;
          totalReplies: number;
        }[];
      };
      get_friend_sort_by_status: {
        Args: { keyword: string; start_idx: number; num: number };
        Returns: {
          id: string;
          username: string;
          avatarUrl: string;
          description: string | null;
          status: StatusType;
          totalCount: number;
          favorite: boolean;
        }[];
      };
      get_friend_status: {
        Args: {
          friend_id: string;
        };
        Returns: {
          asking: (boolean | null)[];
          asked: (boolean | null)[];
        };
      };
      get_non_friends: {
        Args: {
          user_id: string;
          keyword: string;
          start_idx: number;
          num: number;
        };
        Returns: {
          id: string;
          username: string;
          avatarUrl: string;
          description: string | null;
          totalCount: number;
        }[];
      };
      get_notifications: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: number;
          from_user: UserProfile;
          type: NotificationType;
          data: NotificationData;
          createdAt: string;
        }[];
      };
      get_post_likes: {
        Args: { postid: number };
        Returns: {
          author: {
            id: string;
            username: string;
            avatarUrl: string | null;
          };
          createdAt: string;
        }[];
      };
      get_post_with_details: {
        Args: {
          postId: number;
        };
        Returns: {
          id: number;
          images: string[];
          ratio: number;
          contents: string;
          privacy: Database["public"]["Enums"]["privacyType"];
          createdAt: string;
          userData: {
            id: string;
            username: string;
            avatarUrl: string | null;
          };
          commentData: {
            id: number;
            contents: string;
            createdAt: string;
            userId: string;
            author: {
              id: string;
              username: string;
              avatarUrl: string | null;
            };
          };
          totalComments: number;
          likedAvatars: string[];
          isLikedByUser: boolean;
        };
      };
      get_posts: {
        Args: { startindex: number; endindex: number };
        Returns: {
          id: number;
          images: string[];
          ratio: number;
          contents: string;
          createdAt: string;
          userData: {
            id: string;
            username: string;
            avatarUrl: string | null;
          };
          commentData: {
            id: number;
            contents: string;
            createdAt: string;
            userId: string;
            author: {
              id: string;
              username: string;
              avatarUrl: string | null;
            };
          };
          totalComments: number;
          likedAvatars: string[];
          isLikedByUser: boolean;
        }[];
      };
      get_posts_privacy: {
        Args: { startIndex: number; endIndex: number; privacySetting?: string };
        Returns: {
          id: number;
          images: string[];
          ratio: number;
          contents: string;
          privacy: Database["public"]["Enums"]["privacyType"];
          createdAt: string;
          userData: {
            id: string;
            username: string;
            avatarUrl: string | null;
          };
          commentData: {
            id: number;
            contents: string;
            createdAt: string;
            userId: string;
            author: {
              id: string;
              username: string;
              avatarUrl: string | null;
            };
          };
          totalComments: number;
          likedAvatars: string[];
          isLikedByUser: boolean;
        }[];
      };
      get_replies: {
        Args: {
          parentid: number;
          startindex: number;
          endindex: number;
        };
        Returns: {
          id: number;
          contents: string;
          userId: string;
          createdAt: string;
          parentsCommentId: number;
          replyCommentId: number;
          replyTo: {
            id: string;
            username: string;
            avatarUrl: string | null;
          };
          userData: {
            id: string;
            username: string;
            avatarUrl: string | null;
          };
          likes: number;
          isLiked: boolean;
          likedAvatars: string[];
        }[];
      };
      get_status: {
        Args: {
          p_id: string;
        };
        Returns: {
          status: Database["public"]["Enums"]["workoutstatus"];
        }[];
      };
      get_user_page_posts: {
        Args: { targetUserId: string };
        Returns: {
          id: number;
          images: string[];
          privacy: Database["public"]["Enums"]["privacyType"];
        }[];
      };
      increment_comment_likes: {
        Args: {
          p_comment_id: number;
        };
        Returns: undefined;
      };
      unfriend: {
        Args: {
          to_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      notificationtype:
        | "poke"
        | "comment"
        | "like"
        | "commentLike"
        | "mention"
        | "friend"
        | "favorite";
      privacyType: "all" | "friend";
      reportType:
        | "Inappropriate"
        | "Conflict"
        | "Violence"
        | "Ads"
        | "Spam"
        | "Other";
      workoutstatus: "done" | "rest";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      notificationtype: [
        "poke",
        "comment",
        "like",
        "commentLike",
        "mention",
        "friend",
      ],
      privacyType: ["all", "friend"],
      reportType: [
        "Inappropriate",
        "Conflict",
        "Violence",
        "Ads",
        "Spam",
        "Other",
      ],
      workoutstatus: ["done", "rest"],
    },
  },
} as const;
