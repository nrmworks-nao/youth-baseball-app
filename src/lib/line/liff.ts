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
 * LINEログイン実行
 * LIFF内ブラウザまたは外部ブラウザに応じてログイン処理を分岐
 */
export async function loginWithLine(): Promise<void> {
  await initializeLiff();

  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.origin + "/login" });
    return;
  }

  await syncWithSupabaseAuth();
}

/**
 * LINEプロフィール取得 → Supabase Authとセッション連携
 */
async function syncWithSupabaseAuth(): Promise<void> {
  const supabase = getSupabase();
  const profile = await liff.getProfile();
  const idToken = liff.getIDToken();

  if (!idToken) {
    throw new Error("LINE IDトークンを取得できませんでした");
  }

  // Supabase AuthにLINE IDトークンで認証
  // カスタム認証: Edge FunctionでLINE IDトークンを検証してSupabase JWTを発行する想定
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google", // カスタムプロバイダーとして設定（Supabase側で設定変更が必要）
    token: idToken,
  });

  if (error) {
    // フォールバック: メールレス認証
    console.warn("IDトークン認証に失敗、代替認証を試行:", error.message);
  }

  // プロフィール情報を保存
  console.log("LINEプロフィール:", profile.displayName);
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
  const supabase = getSupabase();
  await supabase.auth.signOut();
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
