import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * メール認証後のCookie設定・遷移先判定API
 *
 * クライアント側でsignInWithPassword/signUp後に呼ばれ、
 * セッションCookieを設定し、チーム所属に応じた遷移先を返す
 */
export async function POST(req: Request) {
  try {
    const { access_token, refresh_token, userId, isSignUp } = await req.json();

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: "セッション情報が不足しています" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // access_tokenからユーザー情報を取得
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(access_token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "ユーザー情報の取得に失敗しました" },
        { status: 401 }
      );
    }

    // 新規登録時はusersテーブルにINSERT（signUp経由の場合）
    if (isSignUp && userId) {
      const metadata = user.user_metadata || {};
      const { error: insertError } = await supabaseAdmin.from("users").upsert(
        {
          id: user.id,
          display_name: metadata.display_name || "ユーザー",
          email: user.email,
          phone: metadata.phone || null,
        },
        { onConflict: "id" }
      );

      if (insertError) {
        console.error("usersテーブル挿入エラー:", insertError.message);
      }
    }

    // チーム所属チェック
    const { data: teamMember } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const redirectTo = teamMember ? "/home" : "/onboarding";

    const response = NextResponse.json({
      userId: user.id,
      redirectTo,
    });

    // 認証Cookie設定
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7日間
    };

    response.cookies.set("sb-access-token", access_token, cookieOptions);
    response.cookies.set("sb-refresh-token", refresh_token, cookieOptions);

    return response;
  } catch (err) {
    console.error("メール認証APIエラー:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "不明なエラー" },
      { status: 500 }
    );
  }
}
