import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 認証不要のパス
const PUBLIC_PATHS = ["/login", "/invite", "/onboarding", "/offline.html"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
