export type AppErrorType =
  | "network"
  | "auth"
  | "permission"
  | "not_found"
  | "validation"
  | "server"
  | "unknown";

export interface AppError {
  type: AppErrorType;
  message: string;
  original?: unknown;
}

const ERROR_MESSAGES: Record<AppErrorType, string> = {
  network: "ネットワークに接続できません。接続を確認してください。",
  auth: "ログインセッションが切れました。再度ログインしてください。",
  permission: "この操作を行う権限がありません。",
  not_found: "データが見つかりませんでした。",
  validation: "入力内容に誤りがあります。",
  server: "サーバーエラーが発生しました。しばらくしてから再度お試しください。",
  unknown: "予期しないエラーが発生しました。しばらくしてから再度お試しください。",
};

/**
 * Supabase のエラーレスポンスを判定し、AppError に変換する
 */
export function handleSupabaseError(error: {
  message?: string;
  code?: string;
  status?: number;
  details?: string;
}): AppError {
  const msg = error.message ?? "";
  const code = error.code ?? "";
  const status = error.status ?? 0;

  // ネットワークエラー
  if (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("network") ||
    code === "NETWORK_ERROR"
  ) {
    return { type: "network", message: ERROR_MESSAGES.network, original: error };
  }

  // 認証エラー
  if (
    status === 401 ||
    code === "PGRST301" ||
    msg.includes("JWT") ||
    msg.includes("token") ||
    msg.includes("auth")
  ) {
    return { type: "auth", message: ERROR_MESSAGES.auth, original: error };
  }

  // 権限エラー（RLS）
  if (
    status === 403 ||
    code === "42501" ||
    msg.includes("permission denied") ||
    msg.includes("policy")
  ) {
    return {
      type: "permission",
      message: ERROR_MESSAGES.permission,
      original: error,
    };
  }

  // Not Found
  if (status === 404 || code === "PGRST116") {
    return {
      type: "not_found",
      message: ERROR_MESSAGES.not_found,
      original: error,
    };
  }

  // バリデーションエラー
  if (
    status === 400 ||
    code === "23505" ||
    code === "23503" ||
    code === "23514"
  ) {
    return {
      type: "validation",
      message: ERROR_MESSAGES.validation,
      original: error,
    };
  }

  // サーバーエラー
  if (status >= 500) {
    return { type: "server", message: ERROR_MESSAGES.server, original: error };
  }

  return { type: "unknown", message: ERROR_MESSAGES.unknown, original: error };
}

/**
 * Supabase クエリ結果のラッパー。エラーがあれば AppError をスローする。
 */
export function unwrapResult<T>(result: {
  data: T | null;
  error: { message?: string; code?: string; status?: number } | null;
}): T {
  if (result.error) {
    const appError = handleSupabaseError(result.error);
    throw appError;
  }
  return result.data as T;
}

/**
 * エラーメッセージを取得するユーティリティ
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return ERROR_MESSAGES.unknown;
}

function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    "message" in error
  );
}
