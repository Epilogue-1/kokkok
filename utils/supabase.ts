import { DEFAULT_AVATAR_URL } from "@/constants/images";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { decode } from "base64-arraybuffer";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import type * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";

import type { InfiniteResponse } from "@/hooks/useInfiniteLoad";
import {
  RELATION_TYPE,
  type RelationType,
  type RequestInfo,
  type StatusInfo,
} from "@/types/Friend.interface";
import type {
  NotificationResponse,
  NotificationType,
  PushMessage,
  PushSetting,
} from "@/types/Notification.interface";
import type { Notification } from "@/types/Notification.interface";
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
        "소셜 로그인으로 가입된 계정입니다. 소셜 로그인을 이용해주세요.",
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
  avatarUrl?: ImagePicker.ImagePickerAsset;
}) {
  const userId = await getUserIdFromStorage();

  try {
    let newAvatarUrl: string | undefined;

    if (profile.avatarUrl === null || profile.avatarUrl === undefined) {
      // 이미지 삭제 시 기본 이미지 URL 사용
      newAvatarUrl = DEFAULT_AVATAR_URL;
    } else if (profile.avatarUrl && !profile.avatarUrl.uri.startsWith("http")) {
      // 새로운 이미지이고 로컬 파일인 경우에만 업로드
      newAvatarUrl = await uploadImage(profile.avatarUrl);
    }

    const { avatarUrl, ...profileData } = profile;

    await supabase
      .from("user")
      .update({
        ...profileData,
        ...(newAvatarUrl && { avatarUrl: newAvatarUrl }),
      })
      .eq("id", userId);
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
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"];

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
export const getPosts = async ({ page = 0, limit = 10 }) => {
  try {
    const { count, error: countError } = await supabase
      .from("post")
      .select("*", { count: "exact", head: true });

    const { data, error } = await supabase.rpc("get_posts_with_details", {
      startindex: page * limit,
      endindex: (page + 1) * limit - 1,
    });

    if (error) throw new Error("게시글을 가져오는데 실패했습니다.");

    return {
      posts: data,
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
    const { data, error } = await supabase
      .from("postLike")
      .select("author:user (id, username, avatarUrl)")
      .eq("postId", postId)
      .order("createdAt", { ascending: true });

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
  images: ImagePicker.ImagePickerAsset[];
  prevImages: string[];
  contents: string;
}) {
  try {
    const userId = await getUserIdFromStorage();
    if (!userId) throw new Error("로그인한 유저 정보가 없습니다.");

    // 기존 게시글 조회
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

    // 변경사항 체크
    const contentsChanged = contents !== existingPost.contents;
    const hasNewImages = images.length > 0;

    // 변경사항이 없으면 기존 게시글 반환
    if (
      !contentsChanged &&
      !hasNewImages &&
      prevImages.length === existingPost.images.length
    ) {
      return existingPost;
    }

    // 새로운 이미지만 업로드
    let newImageUrls: string[] = [];
    if (hasNewImages) {
      const uploadedUrls = await Promise.all(
        images.map((image) => uploadImage(image)),
      );
      newImageUrls = uploadedUrls.filter(
        (url): url is string => url !== undefined,
      );
    }

    // 이전 이미지와 새로운 이미지 합치기
    const validImageUrls = [...prevImages, ...newImageUrls];

    // 게시글 수정
    const { data: updatedPost, error: updateError } = await supabase
      .from("post")
      .update({ contents, images: validImageUrls })
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
      .select("userId")
      .eq("id", postId)
      .single();

    if (postError) throw postError;
    if (!post) throw new Error("게시글을 찾을 수 없습니다.");

    if (userId !== post.userId) {
      throw new Error("게시글 작성자만 삭제할 수 있습니다.");
    }

    await supabase.from("post").delete().eq("id", postId);

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
export async function getComments(postId: number, page = 0, limit = 10) {
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
      comments: data,
      total: count ?? data.length,
      hasNext: count ? (page + 1) * limit < count : false,
      nextPage: page + 1,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "댓글 조회에 실패했습니다",
    );
  }
}

// 답글 조회
export async function getReplies(parentId: number, page = 0, limit = 10) {
  try {
    const start = page === 0 ? 0 : (page - 1) * limit + 1;
    const end = page === 0 ? 1 : start + limit;

    const { count } = await supabase
      .from("comment")
      .select("*", { count: "exact", head: true })
      .eq("parentsCommentId", parentId);

    if (!count) {
      return {
        replies: [],
        total: 0,
        hasNext: false,
        nextPage: 0,
      };
    }

    const { data, error } = await supabase.rpc("get_replies_with_likes", {
      parentid: parentId,
      startindex: start,
      endindex: end,
    });

    if (error) throw error;
    if (!data) throw new Error("답글을 가져올 수 없습니다.");

    const hasNext = page === 0 ? count > 1 : data.length === limit;

    return {
      replies: data,
      total: count ?? data.length,
      hasNext,
      nextPage: page + 1,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "답글 조회에 실패했습니다",
    );
  }
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
export async function getFriends(keyword = ""): Promise<UserProfile[]> {
  const userId = await getUserIdFromStorage();

  const { data, error } = await supabase
    .from("friendRequest")
    .select(
      "to: user!friendRequest_to_fkey (id, username, avatarUrl, description)",
    )
    .eq("from", userId)
    .ilike("to.username", `%${keyword}%`)
    .eq("isAccepted", true);

  if (error) throw error;
  if (!data) throw new Error("친구를 불러올 수 없습니다.");

  return data.filter(({ to }) => !!to).map(({ to }) => to as UserProfile);
}

// keyword 기반해 나와 친구 요청 없는 유저 검색
export async function getNonFriends(keyword: string, offset = 0, limit = 12) {
  const userId = await getUserIdFromStorage();

  const { data, error } = await supabase.rpc("get_non_friends", {
    user_id: userId,
    keyword,
    start_idx: offset,
    num: limit,
  });

  if (error) throw error;
  if (!data) throw new Error("검색한 유저를 불러올 수 없습니다.");

  const count = data?.[0]?.totalCount || 0;

  return {
    data,
    total: count || 0,
    hasMore: count ? offset + limit < count : false,
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

// 모든 친구의 운동 상태 조회
export async function getFriendsStatus(
  friendIds: string[],
): Promise<StatusInfo[]> {
  if (!friendIds.length) return [];

  const { data, error } = await supabase
    .from("workoutHistory")
    .select("userId, status")
    .in("userId", friendIds)
    .eq("date", formatDate(new Date()));

  if (error) throw error;
  if (!data) return [];

  return data;
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
export async function checkFriendRequest(requestId: string): Promise<boolean> {
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
//                 notification
//
// ============================================

export async function getNotifications(): Promise<NotificationResponse[]> {
  const userId = await getUserIdFromStorage();

  const { data, error } = await supabase
    .from("notification")
    .select(
      `
          id,
          from: user!notification_from_fkey (id, username, avatarUrl, description),
          type,
          data,
          createdAt
        `,
    )
    .eq("to", userId)
    .neq("type", "friend")
    .order("createdAt", { ascending: false })
    .limit(30);

  if (error) throw error;
  if (!data) throw new Error("알림을 불러올 수 없습니다.");

  return data.map((notification) => ({
    ...notification,
    from: notification.from as UserProfile,
  }));
}

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
  const userId = await getUserIdFromStorage();
  return await getUserPushSetting(userId);
}

// 푸시 알림 설정 추가
export async function createPushSetting({
  token,
  grantedNotifications,
}: {
  token: string | null;
  grantedNotifications: NotificationType[];
}) {
  const userId = await getUserIdFromStorage();
  const { error } = await supabase
    .from("pushToken")
    .upsert({ userId, token, grantedNotifications });

  if (error) {
    console.error("푸시 알림 정보 저장 실패:", error);
  }
}

// 푸시 알림 설정 업데이트
export async function updatePushSetting({
  token,
  grantedNotifications,
}: { token?: string | null; grantedNotifications?: NotificationType[] }) {
  const userId = await getUserIdFromStorage();

  const { error } = await supabase
    .from("pushToken")
    .update({
      ...(token === undefined ? {} : { token }),
      ...(grantedNotifications === undefined ? {} : { grantedNotifications }),
    })
    .eq("userId", userId);

  if (error) {
    console.error("푸시 알림 정보 저장 실패:", error);
    throw new Error("푸시 알림 정보 저장에 실패했습니다.");
  }
}

export async function resetPushSetting() {
  await updatePushSetting({ token: null, grantedNotifications: [] });
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
