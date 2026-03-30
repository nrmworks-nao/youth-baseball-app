import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * LINE認証後のSupabase Auth連携API
 * - Supabase Authユーザーを作成/取得
 * - usersテーブルにUPSERT
 * - team_membersの所属チェック
 * - セッションCookieを設定
 */
export async function POST(req: Request) {
  try {
    const { lineUserId, displayName, pictureUrl } = await req.json();

    if (!lineUserId || !displayName) {
      return NextResponse.json(
        { error: "lineUserId と displayName は必須です" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Admin client (service role) でユーザー管理
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // LINE userId から決定的なメールアドレスとパスワードを生成
    const email = `line_${lineUserId}@line.youth-baseball.local`;
    const secret = process.env.LINE_CHANNEL_SECRET || "default-secret";
    const password = crypto
      .createHmac("sha256", secret)
      .update(lineUserId)
      .digest("hex");

    // Supabase Auth ユーザーを作成（既存の場合はスキップ）
    let authUserId: string;

    const { data: createData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          line_id: lineUserId,
          display_name: displayName,
          picture_url: pictureUrl,
        },
      });

    if (createError) {
      if (
        createError.message.includes("already") ||
        createError.message.includes("exists") ||
        createError.status === 422
      ) {
        // 既存ユーザーにサインイン
        const signInClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data: signInData, error: signInError } =
          await signInClient.auth.signInWithPassword({ email, password });

        if (signInError) {
          console.error("既存ユーザーのサインインに失敗:", signInError.message);
          return NextResponse.json(
            {
              error: `認証エラー: ${signInError.message}`,
              details: "既存ユーザーのサインインに失敗しました",
            },
            { status: 500 }
          );
        }

        authUserId = signInData.user.id;

        // セッション情報を含むレスポンスを準備
        const redirectTo = await determineRedirect(
          supabaseAdmin,
          authUserId,
          lineUserId,
          displayName,
          pictureUrl
        );

        const response = NextResponse.json({
          session: {
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
          },
          userId: authUserId,
          redirectTo,
        });

        setAuthCookies(response, signInData.session);
        return response;
      }

      console.error("ユーザー作成エラー:", createError.message);
      return NextResponse.json(
        { error: `ユーザー作成に失敗: ${createError.message}` },
        { status: 500 }
      );
    }

    authUserId = createData.user.id;

    // 新規ユーザーのサインイン
    const signInClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: signInData, error: signInError } =
      await signInClient.auth.signInWithPassword({ email, password });

    if (signInError) {
      console.error("新規ユーザーのサインインに失敗:", signInError.message);
      return NextResponse.json(
        { error: `サインインに失敗: ${signInError.message}` },
        { status: 500 }
      );
    }

    const redirectTo = await determineRedirect(
      supabaseAdmin,
      authUserId,
      lineUserId,
      displayName,
      pictureUrl
    );

    const response = NextResponse.json({
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
      userId: authUserId,
      redirectTo,
    });

    setAuthCookies(response, signInData.session);
    return response;
  } catch (err) {
    console.error("LINE認証APIエラー:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "不明なエラー",
      },
      { status: 500 }
    );
  }
}

/**
 * usersテーブルにUPSERTし、遷移先を決定する
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function determineRedirect(
  supabaseAdmin: any,
  authUserId: string,
  lineUserId: string,
  displayName: string,
  pictureUrl?: string
): Promise<string> {
  // usersテーブルにUPSERT
  const { error: upsertError } = await supabaseAdmin.from("users").upsert(
    {
      id: authUserId,
      line_id: lineUserId,
      line_display_name: displayName,
      line_picture_url: pictureUrl || null,
      display_name: displayName,
    },
    { onConflict: "id" }
  );

  if (upsertError) {
    console.error("usersテーブルUPSERTエラー:", upsertError.message);
    // エラーでも続行（遷移先判定は行う）
  }

  // team_membersの所属チェック
  const { data: teamMember } = await supabaseAdmin
    .from("team_members")
    .select("id")
    .eq("user_id", authUserId)
    .limit(1)
    .maybeSingle();

  if (teamMember) {
    return "/home";
  }

  return "/onboarding";
}

/**
 * レスポンスに認証Cookieを設定
 */
function setAuthCookies(
  response: NextResponse,
  session: { access_token: string; refresh_token: string }
) {
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7日間
  };

  response.cookies.set("sb-access-token", session.access_token, cookieOptions);
  response.cookies.set(
    "sb-refresh-token",
    session.refresh_token,
    cookieOptions
  );
}
