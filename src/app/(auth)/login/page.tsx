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

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liffStatus, setLiffStatus] = useState<string>("初期化中");

  useEffect(() => {
    const init = async () => {
      try {
        await initializeLiff();
        setIsLiffReady(true);
        setLiffStatus("初期化成功");

        // LINEログイン後のコールバック処理
        if (isLiffLoggedIn()) {
          setIsLoggingIn(true);
          await loginWithLine();
          window.location.href = "/home";
          return;
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "不明なエラー";
        console.error("LIFF初期化エラー:", err);
        setLiffStatus(`初期化失敗: ${message}`);
        setError("アプリの初期化に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleLogin = () => {
    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: window.location.origin + "/home" });
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
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-green-100">
            <svg
              className="h-10 w-10"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* 野球ボール本体 */}
              <circle cx="12" cy="12" r="10" fill="white" stroke="#16a34a" strokeWidth="1.5" />
              {/* 左側の縫い目 */}
              <path
                d="M6.5 3.5C7.5 6 7.5 9 6.5 12C5.5 15 5.5 18 6.5 20.5"
                stroke="#dc2626"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* 左側の縫い目ステッチ */}
              <path
                d="M5.2 5.5L7.8 4.5M5 8L7.5 7M5 10L7.5 9.5M5 12.5L7.5 12M5 15L7.5 14.5M5 17L7.5 16.5M5.2 19L7.8 18"
                stroke="#dc2626"
                strokeWidth="0.8"
                strokeLinecap="round"
              />
              {/* 右側の縫い目 */}
              <path
                d="M17.5 3.5C16.5 6 16.5 9 17.5 12C18.5 15 18.5 18 17.5 20.5"
                stroke="#dc2626"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* 右側の縫い目ステッチ */}
              <path
                d="M18.8 5.5L16.2 4.5M19 8L16.5 7M19 10L16.5 9.5M19 12.5L16.5 12M19 15L16.5 14.5M19 17L16.5 16.5M18.8 19L16.2 18"
                stroke="#dc2626"
                strokeWidth="0.8"
                strokeLinecap="round"
              />
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

        {/* デバッグ情報（環境変数確認用） */}
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
          <p>LIFF状態: {liffStatus}</p>
          <p>ボタン状態: {!isLiffReady || isLoggingIn ? "disabled" : "enabled"}</p>
          <p>ログイン済み: {isLiffReady ? String(liff.isLoggedIn()) : "N/A"}</p>
          <p>LINEアプリ内: {isLiffReady ? String(liff.isInClient()) : "N/A"}</p>
          {error && <p className="text-red-500">エラー: {error}</p>}
        </div>
      </div>
    </div>
  );
}
