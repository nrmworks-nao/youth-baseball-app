import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * チーム参加API（トランザクション処理）
 * - team_members追加
 * - players登録
 * - user_children紐づけ
 * - users.phone更新
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      teamId,
      userId,
      displayName,
      phone,
      relationship,
      players,
    } = body as {
      teamId: string;
      userId: string;
      displayName: string;
      phone?: string;
      relationship: string;
      players: {
        name: string;
        number?: number;
        grade?: number;
        position?: string;
        throwing_hand?: string;
        batting_hand?: string;
      }[];
    };

    if (!teamId || !userId || !displayName || !players?.length) {
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

    // 重複チェック
    const { data: existing } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "既にこのチームに参加しています" },
        { status: 409 }
      );
    }

    // チームの承認設定を確認
    const { data: team, error: teamError } = await supabaseAdmin
      .from("teams")
      .select("require_approval")
      .eq("id", teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: "チームが見つかりません" },
        { status: 404 }
      );
    }

    const isActive = !team.require_approval;

    // ユーザーの電話番号・表示名更新
    const userUpdate: Record<string, string> = { display_name: displayName };
    if (phone) userUpdate.phone = phone;
    await supabaseAdmin
      .from("users")
      .update(userUpdate)
      .eq("id", userId);

    // team_members追加
    const { data: member, error: memberError } = await supabaseAdmin
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: userId,
        permission_group: "parent",
        display_title: "保護者",
        is_active: isActive,
      })
      .select()
      .single();

    if (memberError) {
      console.error("team_members追加エラー:", memberError);
      return NextResponse.json(
        { error: "チームへの参加に失敗しました" },
        { status: 500 }
      );
    }

    // 選手登録 + 紐づけ
    for (const player of players) {
      const { data: newPlayer, error: playerError } = await supabaseAdmin
        .from("players")
        .insert({
          team_id: teamId,
          name: player.name,
          number: player.number || null,
          grade: player.grade || null,
          position: player.position || null,
          throwing_hand: player.throwing_hand || null,
          batting_hand: player.batting_hand || null,
          is_active: isActive,
        })
        .select()
        .single();

      if (playerError) {
        console.error("players追加エラー:", playerError);
        // ロールバック: 作成済みのメンバーを削除
        await supabaseAdmin
          .from("team_members")
          .delete()
          .eq("id", member.id);
        return NextResponse.json(
          { error: "選手登録に失敗しました" },
          { status: 500 }
        );
      }

      // user_children紐づけ
      const { error: linkError } = await supabaseAdmin
        .from("user_children")
        .insert({
          user_id: userId,
          player_id: newPlayer.id,
          team_id: teamId,
          relationship,
        });

      if (linkError) {
        console.error("user_children追加エラー:", linkError);
      }
    }

    return NextResponse.json({
      success: true,
      isActive,
      memberId: member.id,
    });
  } catch (err) {
    console.error("チーム参加APIエラー:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "不明なエラー" },
      { status: 500 }
    );
  }
}
