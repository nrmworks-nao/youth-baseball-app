import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * チーム退会API
 * - team_members の is_active を false に変更
 * - サイト管理者が最後の1人の場合は退会不可
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, teamId } = body as { userId: string; teamId: string };

    if (!userId || !teamId) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // メンバー情報を取得
    const { data: member, error: memberError } = await supabaseAdmin
      .from("team_members")
      .select("id, is_admin")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "メンバー情報が見つかりません" },
        { status: 404 }
      );
    }

    // サイト管理者の場合、他に管理者がいるかチェック
    if (member.is_admin) {
      const { count, error: countError } = await supabaseAdmin
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("team_id", teamId)
        .eq("is_admin", true)
        .eq("is_active", true);

      if (countError) {
        return NextResponse.json(
          { error: "管理者チェックに失敗しました" },
          { status: 500 }
        );
      }

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "サイト管理者が他にいないため退会できません。先に別のメンバーをサイト管理者に指定してください。" },
          { status: 400 }
        );
      }
    }

    // 退会処理（論理削除）
    const { error: updateError } = await supabaseAdmin
      .from("team_members")
      .update({ is_active: false })
      .eq("id", member.id);

    if (updateError) {
      console.error("退会処理エラー:", updateError);
      return NextResponse.json(
        { error: "退会処理に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("チーム退会APIエラー:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "不明なエラー" },
      { status: 500 }
    );
  }
}
