"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import liff from "@line/liff";
import {
  initializeLiff,
  loginWithLine,
  getLiffId,
  isLoggedIn as isLiffLoggedIn,
} from "@/lib/line/liff";
import type { LoginResult } from "@/lib/line/liff";
import { supabase } from "@/lib/supabase/client";

interface DebugInfo {
  liffStatus: string;
  liffLoggedIn: string;
  accessToken: string;
  supabaseSession: string;
  userSaveResult: string;
  redirectTo: string;
  error: string;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // メール/パスワード認証
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailLogging, setIsEmailLogging] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [debug, setDebug] = useState<DebugInfo>({
    liffStatus: "初期化中",
    liffLoggedIn: "N/A",
    accessToken: "N/A",
    supabaseSession: "未確認",
    userSaveResult: "未実行",
    redirectTo: "未決定",
    error: "",
  });

  useEffect(() => {
    const init = async () => {
      try {
        await initializeLiff();
        setIsLiffReady(true);

        // デバッグ情報を更新
        const loggedIn = liff.isLoggedIn();
        const token = liff.getAccessToken();
        setDebug((prev) => ({
          ...prev,
          liffStatus: "初期化成功",
          liffLoggedIn: String(loggedIn),
          accessToken: token ? `${token.substring(0, 8)}...` : "なし",
        }));

        // LINEログイン後のコールバック処理
        if (isLiffLoggedIn()) {
          setIsLoggingIn(true);
          setDebug((prev) => ({
            ...prev,
            liffStatus: "ログイン済み - 認証処理中...",
          }));

          const result = await loginWithLine();
          handleLoginResult(result);
          return;
        }

        // LIFF未ログインだが認証コールバックの可能性がある場合
        const params = new URLSearchParams(window.location.search);
        const authAttempted =
          sessionStorage.getItem("liff_auth_started") === "1";
        const hasCallbackParams =
          params.has("code") ||
          params.has("liffClientId") ||
          params.has("liffRedirectUri");

        if (hasCallbackParams || authAttempted) {
          setIsLoggingIn(true);
          setDebug((prev) => ({
            ...prev,
            liffStatus: `コールバック検知 (params=${hasCallbackParams}, flag=${authAttempted}) - 認証試行中...`,
          }));

          const result = await loginWithLine();
          handleLoginResult(result);
          return;
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "不明なエラー";
        console.error("LIFF初期化エラー:", err);
        setDebug((prev) => ({
          ...prev,
          liffStatus: `初期化失敗: ${message}`,
          error: message,
        }));
        // LIFF初期化失敗でもメール認証は使えるようにする
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleLoginResult = (result: LoginResult) => {
    if (result.success) {
      setDebug((prev) => ({
        ...prev,
        supabaseSession: "セッション作成済み",
        userSaveResult: result.userSaveResult || "成功",
        redirectTo: result.redirectTo,
        error: "",
      }));

      window.location.href = result.redirectTo;
    } else {
      setIsLoggingIn(false);
      setIsLoading(false);
      const errorMsg = result.error || "ログインに失敗しました";
      setError(errorMsg);
      setDebug((prev) => ({
        ...prev,
        supabaseSession: "セッション未作成",
        userSaveResult: result.userSaveResult || "未実行",
        redirectTo: "遷移中止",
        error: errorMsg,
      }));

      if (window.location.search) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  };

  const handleLineLogin = async () => {
    if (!isLiffReady) return;

    if (liff.isLoggedIn()) {
      setIsLoggingIn(true);
      setDebug((prev) => ({
        ...prev,
        liffStatus: "ログイン済み - 認証処理中...",
      }));

      try {
        const result = await loginWithLine();
        handleLoginResult(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "不明なエラー";
        setIsLoggingIn(false);
        setError(message);
        setDebug((prev) => ({ ...prev, error: message }));
      }
    } else {
      liff.login({ redirectUri: window.location.origin + "/login" });
    }
  };

  // メール/パスワードでログイン
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    if (!email.trim() || !password) {
      setEmailError("メールアドレスとパスワードを入力してください");
      return;
    }

    setIsEmailLogging(true);
    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setEmailError("メールアドレスまたはパスワードが正しくありません");
        return;
      }

      // Cookie設定のためサーバーサイドで処理
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setEmailError(result.error || "ログインに失敗しました");
        return;
      }

      window.location.href = result.redirectTo || "/home";
    } catch {
      setEmailError("ログインに失敗しました。再度お試しください。");
    } finally {
      setIsEmailLogging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loading text="準備中..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-8">
        {/* ロゴ・タイトル */}
        <div className="text-center">
          <img src="/app-icon.png" alt="Youth Baseball Team Hub" className="w-20 h-20 mx-auto" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Youth Baseball
          </h1>
          <h2 className="text-2xl font-bold text-gray-900">Team Hub</h2>
          <p className="mt-2 text-sm text-gray-500">
            チームの運営をもっとカンタンに
          </p>
        </div>

        {/* メール/パスワードログインフォーム */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <Input
            label="メールアドレス"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label="パスワード"
            type="password"
            placeholder="8文字以上"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {emailError && (
            <p className="text-center text-sm text-red-600">{emailError}</p>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isEmailLogging}
          >
            {isEmailLogging ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            ログイン
          </Button>
          <p className="text-center text-sm text-gray-500">
            アカウントをお持ちでない方は{" "}
            <Link href="/register" className="text-green-600 hover:underline font-medium">
              新規登録
            </Link>
          </p>
        </form>

        {/* 区切り線 */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-sm text-gray-400">または</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* LINEログインボタン */}
        <div className="space-y-4">
          <Button
            variant="line"
            size="lg"
            className="w-full"
            onClick={handleLineLogin}
            disabled={!isLiffReady || isLoggingIn}
          >
            {isLoggingIn ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
            )}
            LINEでログイン
          </Button>

          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}

          <p className="text-center text-xs text-gray-400">
            ログインすることで利用規約・プライバシーポリシーに同意したものとみなします
          </p>
        </div>

        {/* デバッグ情報 */}
        {process.env.NODE_ENV === "development" && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-700">デバッグ情報</p>
            <p>
              LIFF ID:{" "}
              {(() => {
                const id = getLiffId();
                if (!id) return "未設定";
                return `${id.substring(0, 4)}****`;
              })()}
            </p>
            <p>LIFF状態: {debug.liffStatus}</p>
            <p>ボタン状態: {!isLiffReady || isLoggingIn ? "disabled" : "enabled"}</p>
            <p>ログイン済み(LIFF): {debug.liffLoggedIn}</p>
            <p>アクセストークン: {debug.accessToken}</p>
            <p>LINEアプリ内: {isLiffReady ? String(liff.isInClient()) : "N/A"}</p>
            <hr className="my-1 border-gray-200" />
            <p>Supabaseセッション: {debug.supabaseSession}</p>
            <p>usersテーブル保存: {debug.userSaveResult}</p>
            <p>遷移先: {debug.redirectTo}</p>
            {debug.error && (
              <p className="text-red-500">エラー: {debug.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
