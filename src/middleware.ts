import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 認証不要のパス
const PUBLIC_PATHS = ["/login", "/invite", "/onboarding", "/offline.html"];

// LIFF認証コールバックのパラメータ名
const LIFF_CALLBACK_PARAMS = ["code", "state", "liffClientId", "liffRedirectUri"];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 公開パスはスキップ
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 静的ファイル・API・Service Workerはスキップ
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.json" ||
    pathname.startsWith("/icons/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // LIFF認証コールバックパラメータがある場合は /login にフォワード
  // （LIFFエンドポイントURLがルートに設定されている場合への対応）
  const hasLiffParams = LIFF_CALLBACK_PARAMS.some((param) =>
    searchParams.has(param)
  );
  if (hasLiffParams) {
    const loginUrl = new URL("/login", request.url);
    // LIFF関連のパラメータをすべて保持して /login にリダイレクト
    searchParams.forEach((value, key) => {
      loginUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(loginUrl);
  }

  // Supabase Authのセッションクッキーをチェック
  // sb-<project-ref>-auth-token 形式のクッキーを検索
  const cookies = request.cookies.getAll();
  const supabaseAuth =
    request.cookies.get("sb-access-token") ||
    request.cookies.get("sb-refresh-token") ||
    cookies.some((c) => c.name.includes("-auth-token"));

  // 未認証ユーザーはログインページへリダイレクト
  if (!supabaseAuth) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 認証チェック対象（静的ファイル以外）
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
