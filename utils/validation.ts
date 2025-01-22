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
    return { message: "간편 로그인으로 가입된 계정입니다.", field: "email" };
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

export const validateCurrentPassword = async (
  email: string,
  currentPassword: string,
): Promise<SignUpValidationError | null> => {
  if (!currentPassword) {
    return {
      message: "현재 비밀번호를 입력해주세요.",
      field: "password",
    };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (signInError) {
    return {
      message: "현재 비밀번호가 올바르지 않습니다.",
      field: "password",
    };
  }

  return null;
};

export const validatePasswordChangeFields = (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): SignUpValidationError | null => {
  if (!currentPassword) {
    return {
      message: "현재 비밀번호를 입력해주세요.",
      field: "password",
    };
  }

  if (!newPassword) {
    return {
      message: "새 비밀번호를 입력해주세요.",
      field: "password",
    };
  }

  if (!confirmPassword) {
    return {
      message: "비밀번호 확인을 입력해주세요.",
      field: "passwordConfirm",
    };
  }

  return null;
};

export const validateChangePasswordForm = async (
  email: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<SignUpValidationError | null> => {
  // 모든 필드가 채워졌는지 검증
  const fieldsError = validatePasswordChangeFields(
    currentPassword,
    newPassword,
    confirmPassword,
  );
  if (fieldsError) return fieldsError;

  // 새 비밀번호 검증
  const newPasswordError = validatePassword(newPassword);
  if (newPasswordError) return newPasswordError;

  // 비밀번호 확인 검증
  const confirmPasswordError = validatePasswordConfirm(
    newPassword,
    confirmPassword,
  );
  if (confirmPasswordError) return confirmPasswordError;

  // 현재 비밀번호 검증
  const currentPasswordError = await validateCurrentPassword(
    email,
    currentPassword,
  );
  if (currentPasswordError) return currentPasswordError;

  return null;
};

export const validatePasswordResetEmail = async (
  email: string,
): Promise<SignUpValidationError | null> => {
  // 이메일 기본 유효성 검사
  const emailError = validateEmail(email);
  if (emailError) return emailError;

  // 이메일이 존재하는지 확인
  const { data: userData } = await supabase
    .from("user")
    .select("email")
    .eq("email", email)
    .single();

  if (!userData?.email) {
    return {
      message: "등록되지 않은 이메일입니다.",
      field: "email",
    };
  }

  return null;
};

export const validateResetPasswordFields = (
  newPassword: string,
  confirmPassword: string,
): SignUpValidationError | null => {
  if (!newPassword) {
    return {
      message: "새 비밀번호를 입력해주세요.",
      field: "password",
    };
  }

  if (!confirmPassword) {
    return {
      message: "비밀번호 확인을 입력해주세요.",
      field: "passwordConfirm",
    };
  }

  return null;
};

export const validateResetPasswordForm = (
  newPassword: string,
  confirmPassword: string,
): SignUpValidationError | null => {
  // 모든 필드가 채워졌는지 검증
  const fieldsError = validateResetPasswordFields(newPassword, confirmPassword);
  if (fieldsError) return fieldsError;

  // 새 비밀번호 검증
  const newPasswordError = validatePassword(newPassword);
  if (newPasswordError) return newPasswordError;

  // 비밀번호 확인 검증
  const confirmPasswordError = validatePasswordConfirm(
    newPassword,
    confirmPassword,
  );
  if (confirmPasswordError) return confirmPasswordError;

  return null;
};

export const validateSignInFields = (
  email: string,
  password: string,
): SignUpValidationError | null => {
  if (!email) {
    return {
      message: "이메일을 입력해주세요.",
      field: "email",
    };
  }

  if (!password) {
    return {
      message: "비밀번호를 입력해주세요.",
      field: "password",
    };
  }

  return null;
};

export const validateSignInForm = (
  email: string,
  password: string,
): SignUpValidationError | null => {
  // 모든 필드가 채워졌는지 검증
  const fieldsError = validateSignInFields(email, password);
  if (fieldsError) return fieldsError;

  // 이메일 형식 검증
  const emailError = validateEmail(email);
  if (emailError) return emailError;

  return null;
};
