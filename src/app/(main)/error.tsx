"use client";

import { useEffect } from "react";
import { getErrorMessage } from "@/lib/supabase/error-handler";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Main area error:", error);
  }, [error]);

  const message = getErrorMessage(error);

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg
          className="h-8 w-8 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          エラーが発生しました
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          再試行
        </button>
        <a
          href="/home"
          className="inline-flex min-h-[44px] items-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          ホームに戻る
        </a>
      </div>
    </div>
  );
}
