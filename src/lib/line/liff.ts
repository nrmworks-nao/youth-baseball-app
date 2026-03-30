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
 * LINEログイン実行 → Supabase Auth連携 → 遷移先判定
 */
export async function loginWithLine(): Promise<LoginResult> {
  await initializeLiff();

  if (!liff.isLoggedIn()) {
    // LINEログイン画面へ（認証後 /login に戻ってくる）
    liff.login({ redirectUri: window.location.origin + "/login" });
    return { success: false, redirectTo: "/login" };
  }

  // LINEプロフィール取得
  const profile = await liff.getProfile();
  console.log("LINEプロフィール取得:", profile.displayName);

  // API経由でSupabase Auth連携 + ユーザー登録
  const response = await fetch("/api/auth/line", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lineUserId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
    }),
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

  // Supabaseクライアント側にもセッションを設定
  if (data.session) {
    const supabase = getSupabase();
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    console.log("Supabaseセッション設定完了");
  }

  return {
    success: true,
    redirectTo: data.redirectTo || "/home",
    userId: data.userId,
    userSaveResult: "保存成功",
  };
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
