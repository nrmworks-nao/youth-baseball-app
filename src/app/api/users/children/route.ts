import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * 同じ子供を共有している他の保護者にも新しい子供を自動追加する
 */
async function shareChildWithRelatedGuardians(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  currentUserId: string,
  newPlayerId: string,
  teamId: string
) {
  // 1. 現在のユーザーの他の子供を取得
  const { data: myChildren } = await supabaseAdmin
    .from("user_children")
    .select("player_id")
    .eq("user_id", currentUserId);

  if (!myChildren || myChildren.length === 0) return;

  const myPlayerIds = myChildren
    .map((c: { player_id: string }) => c.player_id)
    .filter((id: string) => id !== newPlayerId);

  if (myPlayerIds.length === 0) return;

  // 2. 同じ子供を持つ他の保護者を取得
  const { data: relatedGuardians } = await supabaseAdmin
    .from("user_children")
    .select("user_id, relationship")
    .in("player_id", myPlayerIds)
    .neq("user_id", currentUserId);

  if (!relatedGuardians || relatedGuardians.length === 0) return;

  // 3. 重複を除いた保護者IDリスト
  const uniqueGuardians = [
    ...new Map(
      relatedGuardians.map((g: { user_id: string; relationship: string }) => [g.user_id, g.relationship])
    ),
  ];

  // 4. 各保護者にも新しい子供を紐づけ
  for (const [guardianUserId, relationship] of uniqueGuardians) {
    await supabaseAdmin.from("user_children").upsert(
      {
        user_id: guardianUserId,
        player_id: newPlayerId,
        relationship: relationship,
        team_id: teamId,
      },
      { onConflict: "user_id,player_id" }
    );
  }
}

/**
 * 子供（選手）管理API
 * POST: 子供を追加（既存選手の紐づけ or 新規登録 + user_children）
 * PUT: 子供の情報を更新（players）
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      teamId,
      player,
      relationship,
      existingPlayerId,
    } = body as {
      userId: string;
      teamId: string;
      player?: {
        name: string;
        number?: number;
        grade?: number;
        position?: string;
        throwing_hand?: string;
        batting_hand?: string;
      };
      relationship: string;
      existingPlayerId?: string;
    };

    if (!userId) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      );
    }

    if (!teamId || (!existingPlayerId && !player?.name?.trim())) {
      return NextResponse.json(
        { error: "チームと選手名は必須です" },
        { status: 400 }
      );
    }

    // 学年バリデーション
    if (player?.grade != null && (player.grade < 1 || player.grade > 6)) {
      return NextResponse.json(
        { error: "学年は1〜6の範囲で入力してください" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let playerId: string;

    if (existingPlayerId) {
      // 既存選手との紐づけ
      const { data: existingPlayer } = await supabaseAdmin
        .from("players")
        .select("id")
        .eq("id", existingPlayerId)
        .eq("team_id", teamId)
        .eq("is_active", true)
        .single();

      if (!existingPlayer) {
        return NextResponse.json(
          { error: "選手が見つかりません" },
          { status: 404 }
        );
      }
      playerId = existingPlayer.id;
    } else {
      // 新規選手登録
      const { data: newPlayer, error: playerError } = await supabaseAdmin
        .from("players")
        .insert({
          team_id: teamId,
          name: player!.name.trim(),
          number: player!.number || null,
          grade: player!.grade || null,
          position: player!.position || null,
          throwing_hand: player!.throwing_hand || null,
          batting_hand: player!.batting_hand || null,
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
      playerId = newPlayer.id;
    }

    // user_children紐づけ（upsertで重複防止）
    const { error: linkError } = await supabaseAdmin
      .from("user_children")
      .upsert(
        {
          user_id: userId,
          player_id: playerId,
          team_id: teamId,
          relationship: relationship || null,
        },
        { onConflict: "user_id,player_id" }
      );

    if (linkError) {
      console.error("紐づけエラー:", linkError);
      // 新規登録した選手の場合のみロールバック
      if (!existingPlayerId) {
        await supabaseAdmin.from("players").delete().eq("id", playerId);
      }
      return NextResponse.json(
        { error: "選手の紐づけに失敗しました" },
        { status: 500 }
      );
    }

    // 保護者間の子供情報共有
    await shareChildWithRelatedGuardians(
      supabaseAdmin,
      userId,
      playerId,
      teamId
    );

    return NextResponse.json({ success: true, playerId });
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

    // 学年バリデーション
    if (data.grade != null && (data.grade < 1 || data.grade > 6)) {
      return NextResponse.json(
        { error: "学年は1〜6の範囲で入力してください" },
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
