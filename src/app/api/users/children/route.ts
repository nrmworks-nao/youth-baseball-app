import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * 子供（選手）管理API
 * POST: 子供を追加（players + user_children）
 * PUT: 子供の情報を更新（players）
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, teamId, player, relationship } = body as {
      userId: string;
      teamId: string;
      player: {
        name: string;
        number?: number;
        grade?: number;
        position?: string;
        throwing_hand?: string;
        batting_hand?: string;
      };
      relationship: string;
    };

    if (!userId) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      );
    }

    if (!teamId || !player?.name?.trim()) {
      return NextResponse.json(
        { error: "チームと選手名は必須です" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 選手登録
    const { data: newPlayer, error: playerError } = await supabaseAdmin
      .from("players")
      .insert({
        team_id: teamId,
        name: player.name.trim(),
        number: player.number || null,
        grade: player.grade || null,
        position: player.position || null,
        throwing_hand: player.throwing_hand || null,
        batting_hand: player.batting_hand || null,
        is_active: true,
      })
      .select()
      .single();

    if (playerError) {
      console.error("選手登録エラー:", playerError);
      return NextResponse.json(
        { error: "選手の登録に失敗しました" },
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
        relationship: relationship || null,
      });

    if (linkError) {
      console.error("紐づけエラー:", linkError);
      // ロールバック
      await supabaseAdmin.from("players").delete().eq("id", newPlayer.id);
      return NextResponse.json(
        { error: "選手の紐づけに失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, player: newPlayer });
  } catch (err) {
    console.error("子供追加APIエラー:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "不明なエラー" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { userId, playerId, data } = body as {
      userId: string;
      playerId: string;
      data: {
        name?: string;
        number?: number;
        grade?: number;
        position?: string;
        throwing_hand?: string;
        batting_hand?: string;
      };
    };

    if (!userId) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      );
    }

    if (!playerId) {
      return NextResponse.json(
        { error: "選手IDが必要です" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 権限チェック: この選手が自分の子供であることを確認
    const { data: relation } = await supabaseAdmin
      .from("user_children")
      .select("id")
      .eq("user_id", userId)
      .eq("player_id", playerId)
      .maybeSingle();

    if (!relation) {
      return NextResponse.json(
        { error: "この選手を編集する権限がありません" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.number !== undefined) updateData.number = data.number || null;
    if (data.grade !== undefined) updateData.grade = data.grade || null;
    if (data.position !== undefined)
      updateData.position = data.position || null;
    if (data.throwing_hand !== undefined)
      updateData.throwing_hand = data.throwing_hand || null;
    if (data.batting_hand !== undefined)
      updateData.batting_hand = data.batting_hand || null;

    const { error } = await supabaseAdmin
      .from("players")
      .update(updateData)
      .eq("id", playerId);

    if (error) {
      console.error("選手更新エラー:", error);
      return NextResponse.json(
        { error: "選手情報の更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("選手更新APIエラー:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "不明なエラー" },
      { status: 500 }
    );
  }
}
