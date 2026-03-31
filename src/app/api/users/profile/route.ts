import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * プロフィール更新API
 * PUT: ユーザーのプロフィール情報を更新
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { userId, display_name, phone, avatar_url, notification_settings } =
      body as {
        userId: string;
        display_name?: string;
        phone?: string;
        avatar_url?: string;
        notification_settings?: {
          schedule: boolean;
          post: boolean;
          accounting: boolean;
        };
      };

    if (!userId) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const updateData: Record<string, unknown> = {};
    if (display_name !== undefined) {
      if (!display_name.trim()) {
        return NextResponse.json(
          { error: "表示名を入力してください" },
          { status: 400 }
        );
      }
      updateData.display_name = display_name.trim();
    }
    if (phone !== undefined) updateData.phone = phone.trim() || null;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (notification_settings !== undefined)
      updateData.notification_settings = notification_settings;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "更新する項目がありません" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      console.error("プロフィール更新エラー:", error);
      return NextResponse.json(
        { error: "プロフィールの更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("プロフィール更新APIエラー:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "不明なエラー" },
      { status: 500 }
    );
  }
}
