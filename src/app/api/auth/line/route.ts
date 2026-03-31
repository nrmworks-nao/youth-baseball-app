import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * LINE認証後のSupabase Auth連携API
 *
 * 受け付ける認証データ（優先順位順）：
 * 1. accessToken: LIFFアクセストークン → LINE APIで検証してプロフィール取得（推奨）
 * 2. idToken: LIFF IDトークン → LINE APIで検証
 * 3. lineUserId + displayName: クライアントから直接送信（フォールバック）
 *
 * 処理フロー：
 * - Supabase Authユーザーを作成/取得
 * - usersテーブルにUPSERT
 * - team_membersの所属チェック
 * - セッションCookieを設定
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accessToken, idToken, lineUserId, displayName, pictureUrl } = body;

    // LINE プロフィール情報を取得（認証方式に応じて）
    let lineProfile: {
      userId: string;
      displayName: string;
      pictureUrl?: string;
    };

    if (accessToken) {
      // 方式1: LIFFアクセストークンでLINE APIからプロフィール取得（最も安全）
      const profileRes = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!profileRes.ok) {
        const errorText = await profileRes.text();
        console.error("LINEプロフィール取得失敗:", profileRes.status, errorText);
        return NextResponse.json(
          { error: "LINEアクセストークンの検証に失敗しました" },
          { status: 401 }
        );
      }

      const profileData = await profileRes.json();
      lineProfile = {
        userId: profileData.userId,
        displayName: profileData.displayName,
        pictureUrl: profileData.pictureUrl,
      };
      console.log(
        "LINE APIでプロフィール取得成功:",
        lineProfile.displayName
      );
    } else if (idToken) {
      // 方式2: IDトークンを検証
      const channelId = process.env.LINE_LOGIN_CHANNEL_ID || "";
      if (!channelId) {
        console.error("LINE_LOGIN_CHANNEL_ID が設定されていません");
        return NextResponse.json(
          { error: "サーバー設定エラー: LINE_LOGIN_CHANNEL_ID未設定" },
          { status: 500 }
        );
      }

      const verifyRes = await fetch(
        "https://api.line.me/oauth2/v2.1/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            id_token: idToken,
            client_id: channelId,
          }),
        }
      );

      if (!verifyRes.ok) {
        const errorText = await verifyRes.text();
        console.error("IDトークン検証失敗:", verifyRes.status, errorText);
        return NextResponse.json(
          { error: "LINE IDトークンの検証に失敗しました" },
          { status: 401 }
        );
      }

      const tokenData = await verifyRes.json();
      lineProfile = {
        userId: tokenData.sub,
        displayName: tokenData.name,
        pictureUrl: tokenData.picture,
      };
      console.log("IDトークン検証成功:", lineProfile.displayName);
    } else if (lineUserId && displayName) {
      // 方式3: クライアントから直接送信（フォールバック、後方互換）
      lineProfile = { userId: lineUserId, displayName, pictureUrl };
      console.log(
        "クライアント送信データ使用（未検証）:",
        lineProfile.displayName
      );
    } else {
      return NextResponse.json(
        {
          error:
            "accessToken, idToken, または lineUserId+displayName が必要です",
        },
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
    const email = `line_${lineProfile.userId}@line.youth-baseball.local`;
    const secret = process.env.LINE_CHANNEL_SECRET || "default-secret";
    const password = crypto
      .createHmac("sha256", secret)
      .update(lineProfile.userId)
      .digest("hex");

    // Supabase Auth ユーザーを作成（既存の場合はスキップ）
    let authUserId: string;

    const { data: createData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          line_id: lineProfile.userId,
          display_name: lineProfile.displayName,
          picture_url: lineProfile.pictureUrl,
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
          console.error(
            "既存ユーザーのサインインに失敗:",
            signInError.message
          );
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
          lineProfile.userId,
          lineProfile.displayName,
          lineProfile.pictureUrl
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
      lineProfile.userId,
      lineProfile.displayName,
      lineProfile.pictureUrl
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
