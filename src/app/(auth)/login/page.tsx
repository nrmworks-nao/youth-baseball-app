"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import liff from "@line/liff";
import {
  initializeLiff,
  loginWithLine,
  getLiffId,
  isLoggedIn as isLiffLoggedIn,
} from "@/lib/line/liff";
import type { LoginResult } from "@/lib/line/liff";

interface DebugInfo {
  liffStatus: string;
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
  const [debug, setDebug] = useState<DebugInfo>({
    liffStatus: "初期化中",
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
        setDebug((prev) => ({ ...prev, liffStatus: "初期化成功" }));

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
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "不明なエラー";
        console.error("LIFF初期化エラー:", err);
        setDebug((prev) => ({
          ...prev,
          liffStatus: `初期化失敗: ${message}`,
          error: message,
        }));
        setError("アプリの初期化に失敗しました");
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

      // 画面遷移（cookieを反映するためfull reload）
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
    }
  };

  const handleLogin = async () => {
    if (!isLiffReady) return;

    if (liff.isLoggedIn()) {
      // 既にLINEログイン済みの場合、直接認証処理
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
      // LINEログイン画面へリダイレクト（認証後 /login に戻る）
      liff.login({ redirectUri: window.location.origin + "/login" });
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
          <div className="mx-auto flex h-20 w-20 items-center justify-center">
            <svg
              className="h-20 w-20"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="ball-grad" cx="40%" cy="40%" r="50%" fx="40%" fy="40%">
                  <stop offset="0%" stopColor="#fff"/>
                  <stop offset="100%" stopColor="#f0f0f0"/>
                </radialGradient>
                <filter id="shadow">
                  <feDropShadow dx="-2" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.3)"/>
                </filter>
              </defs>
              {/* 緑の背景円 */}
              <circle cx="50" cy="50" r="48" fill="#4CAF50" filter="url(#shadow)"/>
              {/* 野球ボール本体 */}
              <circle cx="50" cy="50" r="32" fill="url(#ball-grad)"/>
              {/* 上側の縫い目 */}
              <path d="M30 40 C 35 30, 65 30, 70 40" fill="none" stroke="#D32F2F" strokeWidth="2.5"/>
              {/* 下側の縫い目 */}
              <path d="M30 60 C 35 70, 65 70, 70 60" fill="none" stroke="#D32F2F" strokeWidth="2.5"/>
              {/* 上側のステッチ */}
              <g stroke="#D32F2F" strokeWidth="1.5">
                <line x1="28" y1="42" x2="28" y2="46"/>
                <line x1="33" y1="39" x2="33" y2="43"/>
                <line x1="39" y1="37" x2="39" y2="41"/>
                <line x1="45" y1="35" x2="45" y2="39"/>
                <line x1="55" y1="35" x2="55" y2="39"/>
                <line x1="61" y1="37" x2="61" y2="41"/>
                <line x1="67" y1="39" x2="67" y2="43"/>
                <line x1="72" y1="42" x2="72" y2="46"/>
              </g>
              {/* 下側のステッチ */}
              <g stroke="#D32F2F" strokeWidth="1.5">
                <line x1="28" y1="58" x2="28" y2="54"/>
                <line x1="33" y1="61" x2="33" y2="57"/>
                <line x1="39" y1="63" x2="39" y2="59"/>
                <line x1="45" y1="65" x2="45" y2="61"/>
                <line x1="55" y1="65" x2="55" y2="61"/>
                <line x1="61" y1="63" x2="61" y2="59"/>
                <line x1="67" y1="61" x2="67" y2="57"/>
                <line x1="72" y1="58" x2="72" y2="54"/>
              </g>
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Youth Baseball
          </h1>
          <h2 className="text-2xl font-bold text-gray-900">Team Hub</h2>
          <p className="mt-2 text-sm text-gray-500">
            チームの運営をもっとカンタンに
          </p>
        </div>

        {/* ログインボタン */}
        <div className="space-y-4">
          <Button
            variant="line"
            size="lg"
            className="w-full"
            onClick={handleLogin}
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
          <p>ログイン済み: {isLiffReady ? String(liff.isLoggedIn()) : "N/A"}</p>
          <p>LINEアプリ内: {isLiffReady ? String(liff.isInClient()) : "N/A"}</p>
          <hr className="my-1 border-gray-200" />
          <p>Supabaseセッション: {debug.supabaseSession}</p>
          <p>usersテーブル保存: {debug.userSaveResult}</p>
          <p>遷移先: {debug.redirectTo}</p>
          {debug.error && (
            <p className="text-red-500">エラー: {debug.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
