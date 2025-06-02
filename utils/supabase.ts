import { DEFAULT_AVATAR_URL } from "@/constants/images";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type RealtimePostgresInsertPayload,
  createClient,
} from "@supabase/supabase-js";
import { decode } from "base64-arraybuffer";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import type * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";

import type { InfiniteResponse } from "@/hooks/useInfiniteLoad";
import {
  RELATION_TYPE,
  type RelationType,
  type RequestInfo,
} from "@/types/Friend.interface";
import {
  NOTIFICATION_TYPE,
  type NotificationResponse,
  type NotificationType,
  type PushMessage,
  type PushSetting,
} from "@/types/Notification.interface";
import type {
  Notification,
  NotificationData,
} from "@/types/Notification.interface";
import type { Comment, Post, Reply } from "@/types/Post.interface";
import type { User, UserProfile } from "@/types/User.interface";
import type { Database } from "@/types/supabase";
import { formMessage } from "./formMessage";
import { formatDate } from "./formatDate";

class AuthError extends Error {}

const expoPushToken = Constants.expoConfig?.extra?.EXPO_PUSH_TOKEN;
const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("환경 변수 로드가 잘못되었습니다.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// 로그인한 유저 정보 불러오기
async function getUserIdFromStorage() {
  const userId = await SecureStore.getItemAsync("userId");
  if (!userId) throw new AuthError("로그인한 유저 정보가 없습니다.");

  return userId;
}

// ============================================
//
//                    auth
//
// ============================================

// 회원가입
export async function signUp({
  id,
  email,
  password,
  username,
  description,
}: {
  id: string;
  email: string;
  password: string;
  username: string;
  description?: string;
}) {
  try {
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) throw updateError;

    const { data: profileData, error: profileError } = await supabase
      .from("user")
      .insert([
        {
          id,
          email,
          username,
          avatarUrl: DEFAULT_AVATAR_URL,
          description: description || null,
          isOAuth: false,
        },
      ])
      .select()
      .single();

    if (profileError) throw profileError.message;
    return profileData;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "회원가입에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// 로그인
export async function signIn({
  email,
  password,
}: { email: string; password: string }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.session) throw new Error("로그인에 실패했습니다");

    return data.session;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "로그인에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// OTP 인증 전송
export async function sendUpOTP(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) throw error;
  return data;
}

// OTP 인증 확인
export async function verifySignUpOTP(email: string, token: string) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) throw error;
    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "OTP 인증에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// Step 1: 비밀번호 재설정 이메일 전송
export async function resetPassword(email: string) {
  try {
    // isOAuth 확인
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("isOAuth")
      .eq("email", email)
      .single();

    if (userError) throw userError;

    // OAuth 사용자인 경우 비밀번호 재설정 불가
    if (userData?.isOAuth) {
      throw new Error(
        "간편 로그인으로 가입된 계정입니다. 간편 로그인을 이용해주세요.",
      );
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;

    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "비밀번호 재설정에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// Step 2: OTP 검증만 수행
export async function verifyResetToken(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });

  if (error) throw error;
  return data;
}

// Step 3: 비밀번호 변경
export async function updateNewPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

// ============================================
//
//                    user
//
// ============================================

// 유저 정보 조회
export async function getUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from("user")
      .select()
      .eq("id", userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error("유저를 불러올 수 없습니다.");

    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "유저 정보 조회에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// 로그인한 유저 정보 조회
export async function getCurrentUser(): Promise<User> {
  const userId = await getUserIdFromStorage();
  return (await getUser(userId)) as User;
}

// 프로필 업데이트
export async function updateMyProfile(profile: {
  username: string;
  description: string;
  avatarUrl?: ImagePicker.ImagePickerAsset | null;
  backgroundUrl?: ImagePicker.ImagePickerAsset | string | null;
}) {
  const userId = await getUserIdFromStorage();

  try {
    let newAvatarUrl: string | undefined;
    let newBackgroundUrl: string | null | undefined;

    // Avatar URL 처리
    if (profile.avatarUrl === null) {
      // 이미지 삭제 시 기본 이미지 URL 사용
      newAvatarUrl = DEFAULT_AVATAR_URL;
    } else if (
      profile.avatarUrl &&
      typeof profile.avatarUrl === "object" &&
      "uri" in profile.avatarUrl &&
      !profile.avatarUrl.uri.startsWith("http")
    ) {
      // 새로운 이미지이고 로컬 파일인 경우에만 업로드
      newAvatarUrl = await uploadImage(
        profile.avatarUrl as ImagePicker.ImagePickerAsset,
      );
    }

    // Background URL 처리
    if (profile.backgroundUrl === null) {
      // 이미지 삭제 요청
      newBackgroundUrl = null;
    } else if (
      profile.backgroundUrl &&
      typeof profile.backgroundUrl === "object" &&
      "uri" in profile.backgroundUrl &&
      !profile.backgroundUrl.uri.startsWith("http")
    ) {
      // 새로운 이미지이고 로컬 파일인 경우 업로드
      newBackgroundUrl = await uploadImage(
        profile.backgroundUrl as ImagePicker.ImagePickerAsset,
      );
    } else if (typeof profile.backgroundUrl === "string") {
      // 기존 URL 사용
      newBackgroundUrl = profile.backgroundUrl;
    }

    const { avatarUrl, backgroundUrl, ...profileData } = profile;

    const updateData: {
      username: string;
      description: string;
      avatarUrl?: string;
      backgroundUrl?: string | null;
    } = {
      ...profileData,
    };

    if (newAvatarUrl !== undefined) {
      updateData.avatarUrl = newAvatarUrl;
    }

    if (newBackgroundUrl !== undefined) {
      updateData.backgroundUrl = newBackgroundUrl;
    }

    await supabase.from("user").update(updateData).eq("id", userId);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "프로필 업데이트에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// 마지막 알림 시간 업데이트
export async function updateNotificationCheck() {
  const userId = await getUserIdFromStorage();

  const { error } = await supabase
    .from("user")
    .update({ notificationCheckedAt: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw error;
}

// 유저 데이터베이스 삭제 (Edge function)
export async function deleteUser() {
  const userId = await getUserIdFromStorage();

  try {
    const { error: dbError } = await supabase.rpc("delete_user_data", {
      user_id: userId,
    });

    if (dbError) {
      throw dbError;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return await response.json();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "유저 삭제에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// ============================================
//
//                    image
//
// ============================================

// 이미지 업로드
export async function uploadImage(file: ImagePicker.ImagePickerAsset) {
  if (!file) throw new Error("파일이 제공되지 않았습니다.");

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (file.fileSize && file.fileSize > MAX_FILE_SIZE) {
    throw new Error("파일 크기는 5MB를 초과할 수 없습니다.");
  }

  if (file.mimeType && !ALLOWED_TYPES.includes(file.mimeType)) {
    throw new Error("지원되지 않는 파일 형식입니다.");
  }

  try {
    const filePath = `${new Date().getTime()}_${file.fileName || "untitled"}`;

    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: "base64",
    });
    const contentType = file.mimeType || "image/jpeg";
    await supabase.storage.from("images").upload(filePath, decode(base64), {
      contentType,
    });

    const result = await supabase.storage.from("images").getPublicUrl(filePath);
    return result.data.publicUrl;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? `uploadImage: ${error.message}`
        : "파일 업로드에 실패했습니다.";
    throw new Error(errorMessage);
  }
}

// ============================================
//
//                    post
//
// ============================================

// 게시글 조회
export const getPosts = async ({
  page = 0,
  limit = 10,
}): Promise<InfiniteResponse<Post>> => {
  try {
    const { count, error: countError } = await supabase
      .from("post")
      .select("*", { count: "exact", head: true });

    const { data, error } = await supabase.rpc("get_posts", {
      startindex: page * limit,
      endindex: (page + 1) * limit - 1,
    });

    if (error) throw new Error("게시글을 가져오는데 실패했습니다.");

    return {
      data,
      total: count ?? data.length,
      hasNext: count ? (page + 1) * limit < count : false,
      nextPage: page + 1,
    };
  } catch (error) {
    console.error("Error in getPosts:", error);
    throw new Error("게시글을 가져오는데 실패했습니다.");
  }
};

// 유저 게시물 조회
export async function getUserPosts(userId: string) {
  try {
    const { data: posts, error: postsError } = await supabase
      .from("post")
      .select(`
        id,
        images
      `)
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (postsError) throw postsError;

    return posts;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "프로필 조회에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// 내 게시물 조회
export async function getMyPosts() {
  const userId = await getUserIdFromStorage();
  return await getUserPosts(userId);
}

// 게시글 상세 조회
export async function getPost(postId: number) {
  try {
    const { data, error } = await supabase.rpc("get_post_with_details", {
      postId,
    });

    if (error) throw new Error("게시글을 가져오는데 실패했습니다.");

    return data;
  } catch (error) {
    console.error("Error in getPost:", error);
    throw new Error("게시글을 가져오는데 실패했습니다.");
  }
}

// 게시글 좋아요 조회
export async function getPostLikes(postId: number) {
  try {
    const { data, error } = await supabase.rpc("get_post_likes", {
      postid: postId,
    });

    if (error) throw error;
    if (!data) throw new Error("게시글 좋아요를 불러올 수 없습니다.");

    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "게시글 좋아요 조회에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// 게시글 좋아요 토글
export async function toggleLikePost(postId: number) {
  try {
    const userId = await getUserIdFromStorage();
    if (!userId) throw new Error("로그인한 유저 정보가 없습니다.");

    // postLike 테이블에서 좋아요 여부 확인
    const { data: likeData, error: likeError } = await supabase
      .from("postLike")
      .select("id")
      .eq("postId", postId)
      .eq("userId", userId)
      .single();

    if (likeError && likeError.code !== "PGRST116") {
      throw likeError;
    }

    if (likeData) {
      // 좋아요 취소
      await supabase.from("postLike").delete().eq("id", likeData.id);
    } else {
      // 좋아요
      await supabase.from("postLike").insert({ postId, userId });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "좋아요 토글에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// 게시물 생성
export async function createPost({
  contents,
  images,
}: { contents?: string; images: ImagePicker.ImagePickerAsset[] }) {
  try {
    const userId = await getUserIdFromStorage();

    if (!userId) throw new Error("로그인한 유저 정보가 없습니다.");

    // 내용이 빈 문자열이면 undefined로 설정
    const postContents = contents === "" ? undefined : contents;

    // 이미지 업로드 및 URL 수집
    const imageUrls = await Promise.all(
      images.map((image) => uploadImage(image)),
    );

    // undefined가 아닌 URL만 필터링
    const validImageUrls = imageUrls.filter(
      (url): url is string => url !== undefined,
    );

    // 게시물 생성
    const { data: newPost, error: postError } = await supabase
      .from("post")
      .insert([
        {
          userId: userId,
          images: validImageUrls,
          contents: postContents || "",
        },
      ])
      .select("*, user: userId (id, username, avatarUrl)")
      .single();

    if (postError) throw postError;
    if (!newPost) throw new Error("게시물을 생성중 문제가 발생했습니다.");

    return newPost;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? `createPost: ${error.message}`
        : "게시물 생성에 실패했습니다.";
    throw new Error(errorMessage);
  }
}

// 게시글 수정
export async function updatePost({
  postId,
  images,
  prevImages,
  contents,
}: {
  postId: number;
  images: { imagePickerAsset: ImagePicker.ImagePickerAsset; index: number }[];
  prevImages: { uri: string; index: number }[];
  contents: string;
}) {
  try {
    const userId = await getUserIdFromStorage();
    if (!userId) throw new Error("로그인한 유저 정보가 없습니다.");

    // 기존 게시글 조회 및 권한 체크
    const { data: existingPost, error: postError } = await supabase
      .from("post")
      .select("userId, contents, images")
      .eq("id", postId)
      .single();

    if (postError) throw postError;
    if (!existingPost) throw new Error("게시글을 찾을 수 없습니다.");

    // 작성자 권한 체크
    if (userId !== existingPost.userId) {
      throw new Error("게시글 작성자만 수정할 수 있습니다.");
    }

    // 새로운 이미지 업로드
    const uploadPromises = images.map(async ({ imagePickerAsset, index }) => {
      const url = await uploadImage(imagePickerAsset);
      return { uri: url, index };
    });
    const uploadedImages = await Promise.all(uploadPromises);

    // 이전 이미지와 새로운 이미지를 index 기준으로 정렬하여 병합
    const allImagesUrl = [...prevImages, ...uploadedImages]
      .sort((a, b) => a.index - b.index)
      .map((item) => item.uri);

    // 게시글 수정
    const { data: updatedPost, error: updateError } = await supabase
      .from("post")
      .update({ contents, images: allImagesUrl })
      .eq("id", postId)
      .select("*, user: userId (id, username, avatarUrl)")
      .single();

    if (updateError) throw updateError;
    if (!updatedPost) throw new Error("게시글 수정에 실패했습니다.");

    return updatedPost;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "게시글 수정에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// 게시글 삭제
export async function deletePost(postId: number) {
  try {
    const userId = await getUserIdFromStorage();
    if (!userId) throw new Error("로그인한 유저 정보가 없습니다.");

    // 게시글 작성자인지 확인
    const { data: post, error: postError } = await supabase
      .from("post")
      .select("userId, images")
      .eq("id", postId)
      .single();

    if (postError) throw postError;
    if (!post) throw new Error("게시글을 찾을 수 없습니다.");

    if (userId !== post.userId) {
      throw new Error("게시글 작성자만 삭제할 수 있습니다.");
    }

    // 이미지 삭제
    if (post.images && post.images.length > 0) {
      // URL에서 파일 경로 추출
      const filePaths = post.images.map((imageUrl: string) => {
        const url = new URL(imageUrl);
        return url.pathname.split("/").pop(); // 파일명 추출
      });

      // 스토리지에서 이미지 삭제
      const { error: storageError } = await supabase.storage
        .from("images")
        .remove(filePaths.filter((path): path is string => path !== undefined));

      if (storageError) {
        console.error("이미지 삭제 중 오류 발생:", storageError);
      }
    }

    // 게시글 삭제
    await supabase.from("post").delete().eq("id", postId);

    // 관련 알림 삭제
    await supabase
      .from("notification")
      .delete()
      .contains("data", { postId })
      .in("type", ["commentLike", "like"]);

    return { message: "게시글이 삭제되었습니다." };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "게시글 삭제에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// ============================================
//
//                    Comment
//
// ============================================

// 댓글 조회
export function getComments(postId: number) {
  return async ({
    page = 0,
    limit = 10,
  }): Promise<InfiniteResponse<Comment>> => {
    try {
      const start = page * limit;
      const end = start + limit - 1;

      const { count } = await supabase
        .from("comment")
        .select("*", { count: "exact", head: true })
        .eq("postId", postId)
        .is("parentsCommentId", null);

      const { data, error } = await supabase.rpc("get_comments", {
        postid: postId,
        startindex: start,
        endindex: end,
      });

      if (error) throw error;
      if (!data) throw new Error("댓글을 가져올 수 없습니다.");

      return {
        data,
        total: count ?? data.length,
        hasNext: count ? (page + 1) * limit < count : false,
        nextPage: page + 1,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "댓글 조회에 실패했습니다",
      );
    }
  };
}

// 답글 조회
export function getReplies(parentId: number) {
  return async ({ page = 0, limit = 10 }): Promise<InfiniteResponse<Reply>> => {
    try {
      const start = page === 0 ? 0 : (page - 1) * limit + 1;
      const end = page === 0 ? 0 : start + limit - 1;

      const { count } = await supabase
        .from("comment")
        .select("*", { count: "exact", head: true })
        .eq("parentsCommentId", parentId);

      if (!count) {
        return {
          data: [],
          total: 0,
          hasNext: false,
          nextPage: 0,
        };
      }

      const { data, error } = await supabase.rpc("get_replies", {
        parentid: parentId,
        startindex: start,
        endindex: end,
      });

      if (error) throw error;
      if (!data) throw new Error("답글을 가져올 수 없습니다.");

      const hasNext = page === 0 ? count > 1 : data.length === limit;

      return {
        data,
        total: count ?? data.length,
        hasNext,
        nextPage: page + 1,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "답글 조회에 실패했습니다",
      );
    }
  };
}

// 댓글 좋아요 조회
export async function getCommentLikes(commentId: number) {
  try {
    const { data, error } = await supabase
      .from("commentLike")
      .select("author:user (id, username, avatarUrl)")
      .eq("commentId", commentId)
      .order("createdAt", { ascending: true });

    if (error) throw error;
    if (!data) throw new Error("댓글 좋아요를 불러올 수 없습니다.");

    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "댓글 좋아요 조회에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// 댓글 좋아요 토글
export async function toggleLikeComment(commentId: number) {
  try {
    const userId = await getUserIdFromStorage();
    if (!userId) throw new Error("로그인한 유저 정보가 없습니다.");

    // commentLike 테이블에서 좋아요 여부 확인
    const { data: likeData, error: likeError } = await supabase
      .from("commentLike")
      .select("id")
      .eq("commentId", commentId)
      .eq("userId", userId)
      .single();

    if (likeError && likeError.code !== "PGRST116") {
      throw likeError;
    }

    if (likeData) {
      // 좋아요 취소 및 likes 감소
      const { error: deleteError } = await supabase.rpc(
        "decrement_comment_likes",
        {
          p_comment_id: commentId,
        },
      );
      if (deleteError) throw deleteError;

      const { error: unlikeError } = await supabase
        .from("commentLike")
        .delete()
        .eq("id", likeData.id);
      if (unlikeError) throw unlikeError;
    } else {
      // 좋아요 추가 및 likes 증가
      const { error: insertError } = await supabase.rpc(
        "increment_comment_likes",
        {
          p_comment_id: commentId,
        },
      );
      if (insertError) throw insertError;

      const { error: likeInsertError } = await supabase
        .from("commentLike")
        .insert({ commentId, userId });
      if (likeInsertError) throw likeInsertError;
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "댓글 좋아요 토글에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// 댓글 작성
export async function createComment({
  postId,
  contents,
  parentId,
  replyCommentId,
}: {
  postId: number;
  contents: string;
  parentId?: number;
  replyCommentId?: number;
}) {
  try {
    const userId = await getUserIdFromStorage();
    if (!userId) throw new Error("로그인한 유저 정보가 없습니다.");

    const { data: newComment, error: commentError } = await supabase
      .from("comment")
      .insert({
        postId,
        userId,
        contents,
        parentsCommentId: parentId || null,
        replyCommentId: replyCommentId || null,
      })
      .select(
        `
          id, 
          contents, 
          userId, 
          createdAt, 
          user (id, username, avatarUrl)
        `,
      )
      .single();

    if (commentError) throw commentError;
    if (!newComment) throw new Error("댓글을 생성하는데 실패했습니다.");

    return newComment;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "댓글 생성에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// 댓글 삭제
export async function deleteComment(commentId: number) {
  try {
    const userId = await getUserIdFromStorage();
    if (!userId) throw new Error("로그인한 유저 정보가 없습니다.");

    // 댓글 작성자인지 확인
    const { data: comment, error: commentError } = await supabase
      .from("comment")
      .select("userId")
      .eq("id", commentId)
      .single();

    if (commentError) throw commentError;
    if (!comment) throw new Error("댓글을 찾을 수 없습니다.");

    if (userId !== comment.userId) {
      throw new Error("댓글 작성자만 삭제할 수 있습니다.");
    }

    await supabase.from("comment").delete().eq("id", commentId);

    await supabase
      .from("notification")
      .delete()
      .contains("data", { commentInfo: { id: commentId } })
      .in("type", ["commentLike"]);

    return { message: "댓글이 삭제되었습니다." };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "댓글 삭제에 실패했습니다";
    throw new Error(errorMessage);
  }
}

// ============================================
//
//                    friend
//
// ============================================

// 친구 조회
export function getFriends(keyword = "") {
  return async ({
    page = 0,
    limit = 12,
  }): Promise<InfiniteResponse<UserProfile>> => {
    const { data, error } = await supabase.rpc("get_friend_sort_by_status", {
      keyword,
      start_idx: page * limit,
      num: limit,
    });

    if (error) throw error;
    if (!data) throw new Error("친구를 불러올 수 없습니다.");

    const count = data?.[0]?.totalCount || 0;

    return {
      data,
      total: count ?? data.length,
      hasNext: count ? (page + 1) * limit < count : false,
      nextPage: page + 1,
    };
  };
}

// keyword 기반해 나와 친구 요청 없는 유저 검색
export function getNonFriends(keyword: string) {
  return async ({ page = 0, limit = 12 }) => {
    const userId = await getUserIdFromStorage();

    const { data, error } = await supabase.rpc("get_non_friends", {
      user_id: userId,
      keyword,
      start_idx: page * limit,
      num: limit,
    });

    if (error) throw error;
    if (!data) throw new Error("검색한 유저를 불러올 수 없습니다.");

    const count = data?.[0]?.totalCount || 0;

    return {
      data,
      total: count ?? data.length,
      hasNext: count ? (page + 1) * limit < count : false,
      nextPage: page + 1,
    };
  };
}

// 친구와의 관계 조회 (친구 요청 상태)
export async function getRelationship(friendId: string): Promise<RelationType> {
  const { data, error } = await supabase.rpc("get_friend_status", {
    friend_id: friendId,
  });

  if (error) throw error;
  if (!data) throw new Error("친구 관계를 불러올 수 없습니다.");

  // 서로 친구 요청 없으면 NONE
  if (!data.asked && !data.asking) return RELATION_TYPE.NONE;
  // 내가 보낸 요청만 있고, 아직 수락 전이면 ASKING
  if (!data.asked && data.asking[0] === null) return RELATION_TYPE.ASKING;
  // 내가 받은 요청만 있고, 아직 수락 전이면 ASKED
  if (data.asked[0] === null && !data.asking) return RELATION_TYPE.ASKED;
  // 서로 친구요청 수락 상태면 FRIEND
  if (data.asked[0] && data.asking[0]) return RELATION_TYPE.FRIEND;

  // 나머지는 DB가 잘못된 상황
  console.error(`친구 DB 확인 필요합니다!
    ${JSON.stringify(data)}
    내 요청: ${data.asking}
    상대방 요청: ${data.asked}`);
  throw new Error("친구 관계 확인에 오류가 발생했습니다");
}

// 친구요청 조회
export async function getFriendRequests({
  page = 0,
  limit = 12,
}): Promise<InfiniteResponse<RequestInfo>> {
  const userId = await getUserIdFromStorage();

  const { data, error, count } = await supabase
    .from("friendRequest")
    .select(
      `
          id,
          from: user!friendRequest_from_fkey (id, username, avatarUrl, description),
          to: user!friendRequest_to_fkey (id, username, avatarUrl, description)
        `,
      { count: "exact" },
    )
    .eq("to", userId)
    .is("isAccepted", null)
    .order("createdAt", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (error) throw error;
  if (!data) throw new Error("친구 요청을 불러올 수 없습니다.");

  return {
    data: data.map((request) => ({
      requestId: request.id,
      toUser: request.to as UserProfile,
      fromUser: request.from as UserProfile,
    })),
    total: count ?? data.length,
    hasNext: count ? (page + 1) * limit < count : false,
    nextPage: page + 1,
  };
}

// 친구요청 있는지 조회
export async function checkFriendRequest(requestId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from("friendRequest")
    .select("id")
    .eq("id", requestId);

  if (error) throw error;
  if (!data) throw new Error("친구 요청을 불러올 수 없습니다.");

  return !!data.length;
}

// 친구요청 있는지 상대방 아이디로 조회
export async function checkFriendRequestWithUserId(
  from: string,
): Promise<boolean> {
  const userId = await getUserIdFromStorage();

  const { data, error } = await supabase
    .from("friendRequest")
    .select("id")
    .eq("from", from)
    .eq("to", userId);

  if (error) throw error;
  if (!data) throw new Error("친구 요청을 불러올 수 없습니다.");

  return !!data.length;
}

// 친구요청 생성
export async function createFriendRequest(to: string) {
  const userId = await getUserIdFromStorage();

  // 차단한 사용자인지 확인
  const isBlocked = await checkBlockedUser(to);
  if (isBlocked) {
    throw new Error("차단한 사용자에게는 친구 요청을 보낼 수 없습니다.");
  }

  const { error } = await supabase
    .from("friendRequest")
    .insert({ from: userId, to, isAccepted: null });

  if (error) throw error;
}

// 친구요청 수락
export async function acceptFriendRequest(
  fromUserId: string,
  requestId: number | null = null,
) {
  const userId = await getUserIdFromStorage();

  const { error } = await supabase.rpc("accept_friend_request", {
    from_user_id: fromUserId,
    request_id: requestId,
    to_user_id: userId,
  });

  if (error) throw error;
}

// 친구 요청 삭제
export async function deleteFriendRequest(requestId: number) {
  const { error } = await supabase
    .from("friendRequest")
    .delete()
    .eq("id", requestId);

  if (error) throw error;
}

// 유저 아이디로 친구 요청 삭제
export async function deleteFriendRequestWithUserId(from: string, to: string) {
  const { error } = await supabase
    .from("friendRequest")
    .delete()
    .eq("from", from)
    .eq("to", to);

  if (error) throw error;
}

// 친구 요청 거절
export async function unfriend(to: string) {
  const { error } = await supabase.rpc("unfriend", {
    to_id: to,
  });

  if (error) throw error;
}

// 친구의 운동 정보가 바뀌는지 정보 구독
export function subscribeFriendsStatus(
  friendIds: string[],
  onSubscribe: () => void,
) {
  const today = formatDate(new Date());

  return supabase
    .channel("workoutHistory")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "workoutHistory",
        filter: `userId=in.(${friendIds.join(",")})`,
      },
      (payload) => {
        // DELETE는 상세내용 감지가 안되어서 실시간 업데이트 X
        // 필요성도 INSERT에 비해 크지 않을 것으로 생각됨
        if (payload.new.date === today) onSubscribe();
      },
    )
    .subscribe();
}

// 본인과 관련된 친구요청 정보 구독
export async function subscribeFriendRequest(
  onSubscribe: (
    payload: RealtimePostgresInsertPayload<{
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      [key: string]: any;
    }>,
  ) => void,
) {
  const userId = await getUserIdFromStorage();

  return supabase
    .channel("friendRequest")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "friendRequest",
        filter: `to=eq.${userId}`,
      },
      (payload) => onSubscribe(payload),
    )
    .subscribe();
}

// ============================================
//
//                    history
//
// ============================================

// 운동 기록 조희
export async function getHistories(
  year: number,
  month: number,
): Promise<History[]> {
  const userId = await getUserIdFromStorage();

  const startDateString = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0); // month+1의 0번째 날짜는 해당 월의 마지막 날
  const endDateString = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(
    endDate.getDate(),
  ).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("workoutHistory")
    .select("date, status")
    .eq("userId", userId)
    .gte("date", startDateString)
    .lte("date", endDateString)
    .order("date", { ascending: true });

  if (error) throw error;

  return data as History[];
}

// 쉬는 날 조회
export async function getRestDays(): Promise<Pick<History, "date">[]> {
  const userId = await getUserIdFromStorage();

  const currentDate = new Date();
  const startOfMonth = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("workoutHistory")
    .select("date")
    .eq("userId", userId)
    .eq("status", "rest")
    .gte("date", startOfMonth)
    .order("date", { ascending: true });

  if (error) throw error;

  return data as Pick<History, "date">[];
}

// 쉬는 날 추가
export async function addRestDay(
  dates: Pick<History, "date">[],
): Promise<void> {
  const userId = await getUserIdFromStorage();

  const records = dates.map(({ date }) => ({
    userId: userId,
    date,
    status: "rest" as const,
  }));

  const { data, error } = await supabase
    .from("workoutHistory")
    .upsert(records, {
      onConflict: "userId,date",
      ignoreDuplicates: false,
    });

  if (error) {
    throw error;
  }
}

// 쉬는 날 제거
export async function deleteRestDay(
  dates: Pick<History, "date">[],
): Promise<void> {
  const userId = await getUserIdFromStorage();

  const days = dates.map((item) => item.date);

  const { data, error } = await supabase
    .from("workoutHistory")
    .delete()
    .eq("userId", userId)
    .eq("status", "rest")
    .in("date", days);

  if (error) {
    throw error;
  }
}

// 운동 기록 추가
export async function addWorkoutHistory({ date }: { date: string }) {
  const userId = await getUserIdFromStorage();

  const { data: todayHistory, error: selectError } = await supabase
    .from("workoutHistory")
    .select("date")
    .eq("userId", userId)
    .eq("date", date)
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    throw selectError;
  }

  if (todayHistory) {
    return todayHistory;
  }

  const { data, error: insertError } = await supabase
    .from("workoutHistory")
    .insert([
      {
        userId,
        date,
        status: "done",
      },
    ]);

  if (insertError) {
    throw insertError;
  }

  return { message: "운동 기록이 추가되었습니다." };
}

// ============================================
//
//                   favorite
//
// ============================================

// 사용자가 즐겨찾기한 유저 목록 조회
export async function getFavoriteUsers(): Promise<
  { favoriteUserId: string }[]
> {
  const userId = await getUserIdFromStorage();
  const { data, error } = await supabase
    .from("favorite")
    .select("favoriteUserId")
    .eq("userId", userId);

  if (error) {
    throw error;
  }

  const favofites = data ?? [];
  return favofites;
}

// TODO: 사용자를 즐겨찾기한 유저 목록 조회
// export async function getUsersWhoFavoritedMe(): Promise<string[]> {
//   const userId = await getUserIdFromStorage();
// }

// 즐겨찾기 토글
export async function toggleFavorite(favoriteUserId: string): Promise<void> {
  try {
    const userId = await getUserIdFromStorage();

    // 즐겨찾기 여부 조회
    const { data: favoriteData, error: favoriteError } = await supabase
      .from("favorite")
      .select("id")
      .eq("userId", userId)
      .eq("favoriteUserId", favoriteUserId)
      .single();

    if (favoriteError && favoriteError.code !== "PGRST116") {
      throw favoriteError;
    }

    if (favoriteData) {
      // 즐겨찾기 해제
      await supabase.from("favorite").delete().eq("id", favoriteData.id);
    } else {
      // 즐겨찾기 설정
      await supabase.from("favorite").insert({ userId, favoriteUserId });
    }
  } catch (error) {
    throw new Error("즐겨찾기 토글 요청이 실패했습니다: toggleFavorite");
  }
}

// ============================================
//
//                 notification
//
// ============================================

// 알림 30개 불러오기
export async function getNotifications(): Promise<NotificationResponse[]> {
  const { data, error } = await supabase.rpc("get_notifications");

  if (error) throw error;
  if (!data) throw new Error("알림을 불러올 수 없습니다.");

  return data.map((notification) => ({
    ...notification,
    from: notification.from_user as UserProfile,
    data: notification.data as NotificationData,
  }));
}

// 마지막으로 온 알림 시간 확인하기
export async function getLatestNotification(): Promise<string> {
  const userId = await getUserIdFromStorage();

  const { data, error } = await supabase
    .from("notification")
    .select("createdAt")
    .eq("to", userId)
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  if (!data) throw new Error("최근 알림을 불러올 수 없습니다.");

  return data.createdAt;
}

// 가장 최근 특정 친구를 찌른 기록 조회
export async function getLatestStabForFriend(
  friendId: string,
): Promise<string> {
  const userId = await getUserIdFromStorage();

  const { data, error } = await supabase
    .from("notification")
    .select("createdAt")
    .eq("from", userId)
    .eq("to", friendId)
    .eq("type", "poke")
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  if (!data) throw new Error("콕 찌르기 정보를 가져올 수 없습니다.");

  return data.createdAt;
}

// 알림 생성
export async function createNotification(notification: Notification) {
  const user = await getCurrentUser();

  // 좋아요/댓글좋아요 타입인 경우에만 1시간 제한 체크
  // 최근 1시간 이내 동일한 유저에게 보낸 알림이 있는지 확인
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  // 쿼리 조건 설정
  const query = supabase
    .from("notification")
    .select("createdAt, data")
    .eq("from", user.id)
    .eq("to", notification.to)
    .eq("type", notification.type)
    .gte("createdAt", oneHourAgo.toISOString());

  // like 타입이면 postId로 필터링, commentLike 타입이면 commentInfo.id로 필터링
  if (notification.type === "like" && notification.data?.postId) {
    const { data: recentLikes, error } = await query
      .contains("data", { postId: notification.data.postId })
      .limit(1);

    if (error) {
      if (error.code !== "PGRST116") {
        throw error;
      }
    } else if (recentLikes && recentLikes.length > 0) {
      // 같은 게시물에 이미 좋아요 알림을 보냈다면 추가 알림 중단
      return;
    }
  } else if (
    notification.type === "commentLike" &&
    notification.data?.commentInfo?.id
  ) {
    const { data: recentCommentLikes, error } = await query
      .contains("data", {
        commentInfo: { id: notification.data.commentInfo.id },
      })
      .limit(1);

    if (error) {
      if (error.code !== "PGRST116") {
        throw error;
      }
    } else if (recentCommentLikes && recentCommentLikes.length > 0) {
      // 같은 댓글에 이미 좋아요 알림을 보냈다면 추가 알림 중단
      return;
    }
  }

  const { error } = await supabase
    .from("notification")
    .insert({ ...notification, from: user.id });
  if (error) throw error;

  // 푸시 알림 생성
  try {
    const data = await getUserPushSetting(notification.to);
    // 푸시 알림 수신 동의하지 않은 경우
    if (!data || !data.token) return;
    if (!data.grantedNotifications.includes(notification.type)) return;

    const message = formMessage({
      type: notification.type,
      username: user.username,
      comment: notification.data?.commentInfo?.content,
      isAccepted: notification.data?.isAccepted,
    });
    const pushMessage = {
      to: data.token,
      sound: "default",
      title: message.title,
      body: message.content,
      data: notification.data,
    };
    await sendPushNotification(pushMessage);
  } catch (error) {
    console.error("푸시 알림 생성에 실패했습니다.", error);
  }
}

// 푸시 알림 보내기
async function sendPushNotification(message: PushMessage) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${expoPushToken}`,
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `푸시 알림 전송 실패: ${error.message || response.statusText}`,
    );
  }
}

// 나에게 오는 알림 구독
export async function subscribeNotification(onSubscribe: () => void) {
  const userId = await getUserIdFromStorage();

  return supabase
    .channel("notification")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notification",
        filter: `to=eq.${userId}`,
      },
      () => onSubscribe(),
    )
    .subscribe();
}

// ============================================
//
//                 push token
//
// ============================================

// 유저의 푸시 알림 설정 불러오기
export async function getUserPushSetting(
  userId: string,
): Promise<PushSetting | null> {
  const { data, error } = await supabase
    .from("pushToken")
    .select("*")
    .eq("userId", userId)
    .limit(1);

  if (error) throw error;
  if (!data) throw new Error("푸시 알림 설정 정보를 가져올 수 없습니다.");
  return data.length ? data[0] : null;
}

// 내 푸시 알림 설정 가져오기
export async function getPushSetting() {
  try {
    const userId = await getUserIdFromStorage();
    if (!userId) return null;

    return await getUserPushSetting(userId);
  } catch (error) {
    console.error(error);
    return null;
  }
}

// 푸시 알림 설정 추가 (새로 권한설정 on -> 모든 권한 포함)
export async function createPushSetting({ token }: { token: string }) {
  const userId = await getUserIdFromStorage();

  const { error } = await supabase.from("pushToken").insert({
    userId,
    token,
    grantedNotifications: Object.values(NOTIFICATION_TYPE),
  });

  if (error) {
    console.error("푸시 알림 정보 생성 실패:", error);
  }
}

// 푸시 알림 설정 업데이트
export async function updatePushSetting({
  token,
  grantedNotifications,
}: { token?: string; grantedNotifications?: NotificationType[] }) {
  if (!token && !grantedNotifications)
    throw new Error("업데이트하려는 인자를 입력해주세요");

  const userId = await getUserIdFromStorage();

  // 토큰만 업데이트 하려고 할 때
  if (token && !grantedNotifications) {
    const existingSetting = await getPushSetting();
    // 기존에 저장된 것 없으면 새로 추가
    if (!existingSetting) {
      await createPushSetting({ token });
      return;
    }
  }

  const { error } = await supabase
    .from("pushToken")
    .update({
      ...(token === undefined ? {} : { token }),
      ...(grantedNotifications === undefined ? {} : { grantedNotifications }),
    })
    .eq("userId", userId);

  if (error) {
    console.error("푸시 알림 정보 저장 실패:", error);
  }
}

// 푸시 알림 설정 삭제
export async function deletePushSetting() {
  const userId = await getUserIdFromStorage();

  const { error } = await supabase
    .from("pushToken")
    .delete()
    .eq("userId", userId);

  if (error) {
    console.error("푸시 알림 정보 삭제 실패:", error);
  }
}

// ============================================
//
//                    report
//
// ============================================

// 사용자 신고
export async function reportUser({
  postId,
  commentId,
  reportedId,
  reportType,
  reportContent,
}: {
  postId?: number;
  commentId?: number;
  reportedId: string;
  reportType: Database["public"]["Enums"]["reportType"];
  reportContent: string;
}) {
  const myId = await getUserIdFromStorage();

  // 이미 신고한 기록이 있는지 확인
  let query = supabase
    .from("report")
    .select()
    .eq("reporterId", myId)
    .eq("reportedId", reportedId);

  if (postId) {
    query = query.eq("postId", postId);
  } else {
    query = query.is("postId", null);
  }

  if (commentId) {
    query = query.eq("commentId", commentId);
  } else {
    query = query.is("commentId", null);
  }

  const { data: existingReport } = await query.single();

  if (existingReport) return;

  const { error } = await supabase.from("report").insert({
    postId,
    commentId,
    reporterId: myId,
    reportedId,
    reportType,
    reportContent,
  });

  if (error) {
    console.error("신고 정보 저장 실패:", error);
  }
}

// ============================================
//
//                 user block
//
// ============================================

// 사용자 차단
export async function blockUser(blockedId: string) {
  const myId = await getUserIdFromStorage();

  // 이미 차단했는지 확인
  const { data: existingBlock } = await supabase
    .from("blockUser")
    .select()
    .eq("blockerId", myId)
    .eq("blockedId", blockedId)
    .single();

  if (existingBlock) {
    throw new Error("이미 차단한 사용자입니다.");
  }

  // 친구 관계인지 확인
  const relationship = await getRelationship(blockedId);

  // 친구 관계 혹은 친구 요청 상태인 경우 친구 관계 해제
  if (
    relationship === RELATION_TYPE.FRIEND ||
    relationship === RELATION_TYPE.ASKING ||
    relationship === RELATION_TYPE.ASKED
  ) {
    await unfriend(blockedId);
  }

  // 사용자 차단
  const { error } = await supabase.from("blockUser").insert({
    blockerId: myId,
    blockedId,
  });

  if (error) {
    console.error("사용자 차단 실패:", error);
    throw new Error("사용자 차단에 실패했습니다.");
  }
}

// 차단한 사용자 조회
export async function checkBlockedUser(blockedId: string) {
  const myId = await getUserIdFromStorage();

  const { data, error } = await supabase
    .from("blockUser")
    .select("id")
    .eq("blockerId", myId)
    .eq("blockedId", blockedId);

  if (error) {
    console.error("차단한 사용자 조회 실패:", error);
  }

  return !!data && data.length > 0;
}

// ============================================
//
//                    type
//
// ============================================

// 운동 기록 타입 정의
type HistoryDate = `${number}-${number}-${number}`;
interface History {
  date: HistoryDate;
  status: "done" | "rest";
}
