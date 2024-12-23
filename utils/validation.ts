import { supabase } from "./supabase";

export interface SignUpValidationError {
  message: string;
  field: "email" | "username" | "password" | "passwordConfirm" | "otpcode";
}

export const validateEmail = (email: string): SignUpValidationError | null => {
  if (!email) {
    return { message: "이메일을 입력해주세요.", field: "email" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { message: "올바른 이메일 형식이 아닙니다.", field: "email" };
  }

  return null;
};

export const validateUsername = (
  username: string,
): SignUpValidationError | null => {
  if (!username) {
    return { message: "닉네임을 입력해주세요.", field: "username" };
  }

  if (username.length < 3) {
    return { message: "닉네임은 3자 이상이어야 합니다.", field: "username" };
  }

  return null;
};

export const validatePassword = (
  password: string,
): SignUpValidationError | null => {
  if (!password) {
    return { message: "비밀번호를 입력해주세요.", field: "password" };
  }

  if (password.length < 8) {
    return { message: "비밀번호는 8자 이상이어야 합니다.", field: "password" };
  }

  return null;
};

export const validatePasswordConfirm = (
  password: string,
  passwordConfirm: string,
): SignUpValidationError | null => {
  if (!passwordConfirm) {
    return {
      message: "비밀번호 확인을 입력해주세요.",
      field: "passwordConfirm",
    };
  }

  if (password !== passwordConfirm) {
    return {
      message: "비밀번호가 일치하지 않습니다.",
      field: "passwordConfirm",
    };
  }

  return null;
};

export const validateSignUpForm = (
  email: string,
  username: string,
  password: string,
  passwordConfirm: string,
): SignUpValidationError | null => {
  const emailError = validateEmail(email);
  if (emailError) return emailError;

  const usernameError = validateUsername(username);
  if (usernameError) return usernameError;

  const passwordError = validatePassword(password);
  if (passwordError) return passwordError;

  const passwordConfirmError = validatePasswordConfirm(
    password,
    passwordConfirm,
  );
  if (passwordConfirmError) return passwordConfirmError;

  return null;
};

export const validateEmailWithSupabase = async (
  email: string,
): Promise<SignUpValidationError | null> => {
  const emailError = validateEmail(email);
  if (emailError) return emailError;

  const { data: userData, error: userError } = await supabase
    .from("user")
    .select("isOAuth, email")
    .eq("email", email)
    .single();

  if (userData?.isOAuth) {
    return { message: "소셜 로그인으로 가입된 계정입니다.", field: "email" };
  }

  if (userData?.email) {
    return { message: "이미 가입된 이메일입니다.", field: "email" };
  }

  return null;
};

export const validateSignUpFormWithSupabase = async (
  email: string,
  username: string,
  password: string,
  passwordConfirm: string,
): Promise<SignUpValidationError | null> => {
  // 기본 유효성 검사
  const basicValidationError = validateSignUpForm(
    email,
    username,
    password,
    passwordConfirm,
  );
  if (basicValidationError) return basicValidationError;

  // Supabase 이메일 검증
  const supabaseValidationError = await validateEmailWithSupabase(email);
  if (supabaseValidationError) return supabaseValidationError;

  return null;
};

export const validateOTPCode = (
  otpcode: string,
): SignUpValidationError | null => {
  if (!otpcode) {
    return { message: "인증코드를 입력해주세요.", field: "otpcode" };
  }

  return null;
};

export const validateStep2Form = (
  username: string,
  otpcode: string,
): SignUpValidationError | null => {
  const usernameError = validateUsername(username);
  if (usernameError) return usernameError;

  const otpError = validateOTPCode(otpcode);
  if (otpError) return otpError;

  return null;
};
