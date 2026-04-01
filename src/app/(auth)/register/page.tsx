"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { supabase } from "@/lib/supabase/client";

function RegisterForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!displayName.trim()) {
      errors.displayName = "表示名を入力してください";
    }
    if (!email.trim()) {
      errors.email = "メールアドレスを入力してください";
    }
    if (!password) {
      errors.password = "パスワードを入力してください";
    } else if (password.length < 8) {
      errors.password = "パスワードは8文字以上で入力してください";
    }
    if (password !== passwordConfirm) {
      errors.passwordConfirm = "パスワードが一致しません";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Supabase Authでユーザー作成
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            phone: phone.trim() || null,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already")) {
          setError("このメールアドレスは既に登録されています");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (!data.session) {
        setError("アカウント作成に失敗しました。再度お試しください。");
        return;
      }

      // Cookie設定 + usersテーブルINSERT
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          userId: data.user?.id,
          isSignUp: true,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "登録に失敗しました");
        return;
      }

      // redirectパラメータがある場合はそちらに遷移、なければonboarding
      window.location.href = redirectTo || "/onboarding";
    } catch {
      setError("登録に失敗しました。再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">新規登録</h1>
          <p className="mt-2 text-sm text-gray-500">
            アカウントを作成してチームに参加しましょう
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="表示名"
            placeholder="山田 太郎"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={fieldErrors.displayName}
            autoComplete="name"
          />
          <Input
            label="メールアドレス"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
          />
          <Input
            label="パスワード"
            type="password"
            placeholder="8文字以上"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            autoComplete="new-password"
          />
          <Input
            label="パスワード（確認）"
            type="password"
            placeholder="もう一度入力してください"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            error={fieldErrors.passwordConfirm}
            autoComplete="new-password"
          />
          <Input
            label="電話番号（任意）"
            type="tel"
            placeholder="090-1234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />

          {error && (
            <p className="text-center text-sm text-red-600">{error}</p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            アカウントを作成
          </Button>

          <p className="text-center text-sm text-gray-500">
            既にアカウントをお持ちの方は{" "}
            <Link href="/login" className="text-green-600 hover:underline font-medium">
              ログイン
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading className="min-h-screen" />}>
      <RegisterForm />
    </Suspense>
  );
}
