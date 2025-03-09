import type { NotificationData } from "./Notification.interface";
import type { StatusType } from "./User.interface";

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
          ratio: number;
          userId: string;
        };
        Insert: {
          contents?: string | null;
          createdAt?: string;
          id?: number;
          images: string[];
          likes?: number;
          ratio: number;
          userId?: string;
        };
        Update: {
          contents?: string | null;
          createdAt?: string;
          id?: number;
          images?: string[];
          likes?: number;
          ratio?: number;
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
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
      user: {
        Row: {
          avatarUrl: string | null;
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
        Args: {
          postid: number;
          startindex: number;
          endindex: number;
        };
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
        Args: {
          keyword: string;
          start_idx: number;
          num: number;
        };
        Returns: {
          id: string;
          username: string;
          avatarUrl: string;
          description: string | null;
          status: StatusType;
          totalCount: number;
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
      get_post_with_details: {
        Args: {
          postId: number;
        };
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
        };
      };
      get_posts_with_details: {
        Args: {
          startindex: number;
          endindex: number;
        };
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
      get_replies_with_likes: {
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
        | "friend";
      workoutstatus: "done" | "rest";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
