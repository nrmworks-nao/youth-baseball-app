import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * チームの既存選手一覧取得API（保護者情報付き）
 * 招待参加時に既存選手を選択するために使用
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "チームIDが必要です" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // チームのアクティブな選手を保護者情報付きで取得
    const { data: players, error } = await supabaseAdmin
      .from("players")
      .select(`
        id, name, number, grade, position,
        user_children(
          relationship,
          users(display_name)
        )
      `)
      .eq("team_id", teamId)
      .eq("is_active", true)
      .order("number", { ascending: true });

    if (error) {
      console.error("選手一覧取得エラー:", error);
      return NextResponse.json(
        { error: "選手一覧の取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ players: players || [] });
  } catch (err) {
    console.error("選手一覧APIエラー:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "不明なエラー" },
      { status: 500 }
    );
  }
}
