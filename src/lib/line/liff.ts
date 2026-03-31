"use client";

import liff from "@line/liff";
import { getSupabase } from "@/lib/supabase/client";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

let isInitialized = false;

/**
 * LIFF IDを取得（デバッグ用）
 */
export function getLiffId(): string {
  return LIFF_ID;
}

/**
 * LIFF初期化済みかどうか
 */
export function isLiffInitialized(): boolean {
  return isInitialized;
}

/**
 * LIFF SDK初期化
 */
export async function initializeLiff(): Promise<void> {
  if (isInitialized) return;

  if (!LIFF_ID) {
    const err = new Error("NEXT_PUBLIC_LIFF_ID が設定されていません");
    console.error("LIFF初期化に失敗しました:", err.message);
    throw err;
  }

  try {
    await liff.init({ liffId: LIFF_ID });
    isInitialized = true;
    console.log("LIFF初期化成功");
  } catch (error) {
    console.error("LIFF初期化に失敗しました:", error);
    throw error;
  }
}

/**
 * ログイン結果の型定義
 */
export interface LoginResult {
  success: boolean;
  redirectTo: string;
  userId?: string;
  error?: string;
  userSaveResult?: string;
}

/**
 * LINE認証コールバックかどうかを判定
 * LINE認証後のリダイレクトでURLにLIFF関連パラメータが付く
 */
function isAuthCallback(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  return (
    params.has("code") ||
    params.has("liffClientId") ||
    params.has("liffRedirectUri") ||
    hash.includes("access_token")
  );
}

/**
 * LINEログイン実行 → Supabase Auth連携 → 遷移先判定
 */
export async function loginWithLine(): Promise<LoginResult> {
  await initializeLiff();

  if (liff.isLoggedIn()) {
    // LIFF認証済み → アクセストークンでサーバー認証
    const accessToken = liff.getAccessToken();

    if (accessToken) {
      console.log("LIFFアクセストークン取得成功 → サーバー認証開始");
      return await authenticateWithServer({ accessToken });
    }

    // アクセストークンが取得できない場合はプロフィールで認証（フォールバック）
    try {
      const profile = await liff.getProfile();
      console.log("LINEプロフィール取得:", profile.displayName);
      return await authenticateWithServer({
        lineUserId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      });
    } catch (err) {
      console.error("LINEプロフィール取得失敗:", err);
      return {
        success: false,
        redirectTo: "/login",
        error: "LINEプロフィールの取得に失敗しました",
      };
    }
  }

  // LIFF未ログイン状態
  // 認証コールバック中か、既に認証試行済みかをチェック
  const callbackDetected = isAuthCallback();
  const authAttempted =
    typeof window !== "undefined" &&
    sessionStorage.getItem("liff_auth_started") === "1";

  if (callbackDetected || authAttempted) {
    // LINE認証から戻ってきたがLIFFセッションが確立されていない
    // 無限ループを防止するためフラグをクリア
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("liff_auth_started");
    }

    console.warn(
      "LINE認証コールバック検知: isLoggedIn=false, callback=",
      callbackDetected,
      "attempted=",
      authAttempted
    );

    // アクセストークンが取得できるか試行
    const accessToken = liff.getAccessToken();
    if (accessToken) {
      console.log("フォールバック: アクセストークン取得成功");
      return await authenticateWithServer({ accessToken });
    }

    // IDトークンが取得できるか試行
    const idToken = liff.getIDToken();
    if (idToken) {
      console.log("フォールバック: IDトークン取得成功");
      return await authenticateWithServer({ idToken });
    }

    // すべて失敗 → ループせずエラーを表示
    console.error(
      "LINE認証コールバック処理失敗: LIFFセッション未確立、トークン取得不可"
    );
    return {
      success: false,
      redirectTo: "/login",
      error:
        "LINE認証は成功しましたが、セッションの確立に失敗しました。再度お試しください。",
    };
  }

  // 初回認証 → LINEログイン画面へリダイレクト
  if (typeof window !== "undefined") {
    sessionStorage.setItem("liff_auth_started", "1");
  }
  console.log("LINEログイン画面へリダイレクト開始");
  liff.login({ redirectUri: window.location.origin + "/login" });
  return { success: false, redirectTo: "/login" };
}

/**
 * サーバーに認証データを送信してSupabaseセッションを確立
 */
async function authenticateWithServer(authData: {
  accessToken?: string;
  idToken?: string;
  lineUserId?: string;
  displayName?: string;
  pictureUrl?: string;
}): Promise<LoginResult> {
  try {
    const response = await fetch("/api/auth/line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("LINE認証APIエラー:", data.error);
      return {
        success: false,
        redirectTo: "/login",
        error: data.error || "認証に失敗しました",
        userSaveResult: data.details,
      };
    }

    // Supabaseクライアント側にセッションを設定
    if (data.session) {
      const supabase = getSupabase();
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      console.log("Supabaseセッション設定完了");
    }

    // 成功時にフラグをクリア
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("liff_auth_started");
    }

    return {
      success: true,
      redirectTo: data.redirectTo || "/home",
      userId: data.userId,
      userSaveResult: "保存成功",
    };
  } catch (err) {
    console.error("認証サーバーエラー:", err);
    return {
      success: false,
      redirectTo: "/login",
      error: "サーバーとの通信に失敗しました",
    };
  }
}

/**
 * LINEプロフィール情報を取得
 */
export async function getLineProfile() {
  await initializeLiff();
  if (!liff.isLoggedIn()) return null;
  return liff.getProfile();
}

/**
 * ログアウト
 */
export async function logout(): Promise<void> {
  // Supabase サインアウト
  const supabase = getSupabase();
  await supabase.auth.signOut();

  // 認証Cookieを削除
  document.cookie =
    "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie =
    "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

  if (liff.isLoggedIn()) {
    liff.logout();
  }

  // 認証フラグをクリア
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("liff_auth_started");
  }

  window.location.href = "/login";
}

/**
 * ログイン済みかどうか
 */
export function isLoggedIn(): boolean {
  return isInitialized && liff.isLoggedIn();
}

/**
 * LIFF内ブラウザかどうか
 */
export function isInLiffBrowser(): boolean {
  return isInitialized && liff.isInClient();
}
