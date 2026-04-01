import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * チーム新規作成API
 * - teamsテーブルにINSERT（招待コード自動生成付き）
 * - team_membersテーブルに作成者を is_admin=true として登録
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, region, league, userId, permissionGroup } = body as {
      name: string;
      region?: string;
      league?: string;
      userId: string;
      permissionGroup?: string;
    };

    const validPermissionGroups = [
      "director", "president", "vice_president", "captain", "coach", "treasurer", "publicity", "parent",
    ];
    const resolvedPermissionGroup = permissionGroup && validPermissionGroups.includes(permissionGroup)
      ? permissionGroup
      : "director";

    // バリデーション
    if (!name || name.trim().length === 0 || name.trim().length > 100) {
      return NextResponse.json(
        { error: "チーム名は1〜100文字で入力してください" },
        { status: 400 }
      );
    }

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

    // 招待コード生成
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let inviteCode = "";
    for (let i = 0; i < 10; i++) {
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7);

    // チーム作成
    console.log("チーム作成開始:", { name: name.trim(), userId });
    const { data: team, error: teamError } = await supabaseAdmin
      .from("teams")
      .insert({
        name: name.trim(),
        region: region?.trim() || null,
        league: league?.trim() || null,
        created_by: userId,
        invite_code: inviteCode,
        invite_expires_at: inviteExpiresAt.toISOString(),
      })
      .select()
      .single();

    if (teamError) {
      console.error("チーム作成エラー:", teamError);
      return NextResponse.json(
        { error: "チームの作成に失敗しました" },
        { status: 500 }
      );
    }

    // 作成者をサイト管理者(is_admin=true)としてメンバー追加
    const memberPayload = {
      team_id: team.id,
      user_id: userId,
      permission_group: resolvedPermissionGroup,
      is_admin: true,
      display_title: null,
      is_active: true,
    };
    console.log("team_members INSERT:", memberPayload);

    const { data: memberData, error: memberError } = await supabaseAdmin
      .from("team_members")
      .insert(memberPayload)
      .select()
      .single();

    console.log("team_members INSERT結果:", { memberData, memberError });

    if (memberError) {
      console.error("メンバー追加エラー:", memberError);
      // ロールバック: チーム削除
      await supabaseAdmin.from("teams").delete().eq("id", team.id);
      return NextResponse.json(
        { error: "チームメンバーの登録に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, team });
  } catch (err) {
    console.error("チーム作成APIエラー:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "不明なエラー" },
      { status: 500 }
    );
  }
}
