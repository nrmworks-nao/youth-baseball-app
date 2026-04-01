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
  const { data: myChildren } = await supabaseAdmin
    .from("user_children")
    .select("player_id")
    .eq("user_id", currentUserId);

  if (!myChildren || myChildren.length === 0) return;

  const myPlayerIds = myChildren
    .map((c: { player_id: string }) => c.player_id)
    .filter((id: string) => id !== newPlayerId);

  if (myPlayerIds.length === 0) return;

  const { data: relatedGuardians } = await supabaseAdmin
    .from("user_children")
    .select("user_id, relationship")
    .in("player_id", myPlayerIds)
    .neq("user_id", currentUserId);

  if (!relatedGuardians || relatedGuardians.length === 0) return;

  const uniqueGuardians = [
    ...new Map(
      relatedGuardians.map((g: { user_id: string; relationship: string }) => [g.user_id, g.relationship])
    ),
  ];

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

interface ChildEntry {
  existingPlayerId?: string;
  newPlayer?: {
    name: string;
    number?: number;
    grade?: number;
    position?: string;
    throwing_hand?: string;
    batting_hand?: string;
  };
  relationship: string;
}

/**
 * チーム参加API（トランザクション処理）
 * - team_members追加
 * - players登録（新規）or 既存選手紐づけ
 * - user_children紐づけ
 * - users.phone更新
 *
 * 多対多対応: 既存選手の選択 + 新規選手の登録 + 子供ごとの関係性
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      teamId,
      userId,
      displayName,
      phone,
      children,
      // 後方互換: 旧形式のリクエストもサポート
      relationship: legacyRelationship,
      players: legacyPlayers,
    } = body as {
      teamId: string;
      userId: string;
      displayName: string;
      phone?: string;
      children?: ChildEntry[];
      // 後方互換
      relationship?: string;
      players?: {
        name: string;
        number?: number;
        grade?: number;
        position?: string;
        throwing_hand?: string;
        batting_hand?: string;
      }[];
    };

    // 新形式と旧形式を統合
    const childEntries: ChildEntry[] | undefined = children ?? legacyPlayers?.map((p): ChildEntry => ({
      newPlayer: p,
      relationship: legacyRelationship || "父",
    }));

    if (!teamId || !userId || !displayName || !childEntries?.length) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    // 学年バリデーション
    for (const child of childEntries) {
      if (child.newPlayer?.grade != null && (child.newPlayer.grade < 1 || child.newPlayer.grade > 6)) {
        return NextResponse.json(
          { error: "学年は1〜6の範囲で入力してください" },
          { status: 400 }
        );
      }
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
        is_admin: false,
        display_title: null,
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
    for (const child of childEntries) {
      let playerId: string;

      if (child.existingPlayerId) {
        // 既存選手と紐づけ（選手がチームに属しているか確認）
        const { data: existingPlayer } = await supabaseAdmin
          .from("players")
          .select("id")
          .eq("id", child.existingPlayerId)
          .eq("team_id", teamId)
          .eq("is_active", true)
          .single();

        if (!existingPlayer) {
          console.error("既存選手が見つかりません:", child.existingPlayerId);
          continue;
        }
        playerId = existingPlayer.id;
      } else if (child.newPlayer) {
        // 新規選手を登録
        const { data: newPlayer, error: playerError } = await supabaseAdmin
          .from("players")
          .insert({
            team_id: teamId,
            name: child.newPlayer.name,
            number: child.newPlayer.number || null,
            grade: child.newPlayer.grade || null,
            position: child.newPlayer.position || null,
            throwing_hand: child.newPlayer.throwing_hand || null,
            batting_hand: child.newPlayer.batting_hand || null,
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
        playerId = newPlayer.id;
      } else {
        continue;
      }

      // user_children紐づけ（upsertで重複防止）
      const { error: linkError } = await supabaseAdmin
        .from("user_children")
        .upsert(
          {
            user_id: userId,
            player_id: playerId,
            team_id: teamId,
            relationship: child.relationship,
          },
          { onConflict: "user_id,player_id" }
        );

      if (linkError) {
        console.error("user_children追加エラー:", linkError);
      }

      // 保護者間の子供情報共有
      await shareChildWithRelatedGuardians(
        supabaseAdmin,
        userId,
        playerId,
        teamId
      );
    }

    // 登録された選手一覧を返す（写真アップロード用）
    const { data: registeredChildren } = await supabaseAdmin
      .from("user_children")
      .select("player_id")
      .eq("user_id", userId)
      .eq("team_id", teamId);

    return NextResponse.json({
      success: true,
      isActive,
      memberId: member.id,
      playerIds: registeredChildren?.map((c) => c.player_id) ?? [],
    });
  } catch (err) {
    console.error("チーム参加APIエラー:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "不明なエラー" },
      { status: 500 }
    );
  }
}
