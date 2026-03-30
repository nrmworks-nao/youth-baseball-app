import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * 月次ふりかえり自動生成 API
 * CRONジョブで月初に実行される想定
 * POST /api/cron/monthly-review
 */

// ポジティブメッセージ生成
function generatePositiveMessage(params: {
  battingAvgChange?: number;
  attendanceRate?: number;
  gamesPlayed?: number;
  badgesEarned?: number;
  heightChange?: number;
}): string {
  const messages: string[] = [];

  if (params.battingAvgChange !== undefined) {
    if (params.battingAvgChange > 0) {
      messages.push(
        `先月より打率が${Math.round(Math.abs(params.battingAvgChange) * 1000)}分上がったよ！`
      );
    } else if (params.battingAvgChange < 0) {
      messages.push("来月はもっと打てるようになろう！");
    } else {
      messages.push("打率をしっかりキープできているね！");
    }
  }

  if (params.attendanceRate !== undefined) {
    if (params.attendanceRate >= 1.0) {
      messages.push("練習皆勤賞だね！すごい！");
    } else if (params.attendanceRate >= 0.8) {
      messages.push("練習にたくさん参加できたね！");
    }
  }

  if (params.gamesPlayed !== undefined && params.gamesPlayed > 0) {
    messages.push(`${params.gamesPlayed}試合も出場したよ！`);
  }

  if (params.badgesEarned !== undefined && params.badgesEarned > 0) {
    messages.push(`バッジを${params.badgesEarned}個ゲットしたね！`);
  }

  if (params.heightChange !== undefined && params.heightChange > 0) {
    messages.push(
      `身長が${params.heightChange.toFixed(1)}cm伸びたよ！成長してるね！`
    );
  }

  if (messages.length === 0) {
    messages.push("今月もよくがんばりました！来月も一緒にがんばろう！");
  }

  return messages.join(" ");
}

export async function POST(request: Request) {
  try {
    // 認証チェック（CRONシークレット）
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    const now = new Date();
    // 前月のデータを生成
    const targetMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const targetYear =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    // 全チームの選手を取得
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, team_id, name, created_at");
    if (playersError) throw playersError;

    const results = [];

    for (const player of players || []) {
      // 既に生成済みかチェック
      const { data: existing } = await supabase
        .from("monthly_reviews")
        .select("id")
        .eq("player_id", player.id)
        .eq("year", targetYear)
        .eq("month", targetMonth)
        .single();

      if (existing) continue;

      // 打撃成績（対象月）
      const monthStart = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
      const monthEnd =
        targetMonth === 12
          ? `${targetYear + 1}-01-01`
          : `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-01`;

      const { data: stats } = await supabase
        .from("player_game_stats")
        .select("*, games!game_id(game_date)")
        .eq("player_id", player.id)
        .gte("games.game_date", monthStart)
        .lt("games.game_date", monthEnd);

      const totalAtBats = (stats || []).reduce(
        (sum, s) => sum + (s.at_bats || 0),
        0
      );
      const totalHits = (stats || []).reduce(
        (sum, s) => sum + (s.hits || 0),
        0
      );
      const battingAvg = totalAtBats > 0 ? totalHits / totalAtBats : undefined;

      // 身体測定
      const { data: measurements } = await supabase
        .from("player_measurements")
        .select("*")
        .eq("player_id", player.id)
        .order("measured_at", { ascending: false })
        .limit(2);

      const latestMeasurement = measurements?.[0];
      const prevMeasurement = measurements?.[1];

      // ポジティブメッセージ生成
      const positiveMessage = generatePositiveMessage({
        battingAvgChange: battingAvg !== undefined ? (battingAvg - 0.25) : undefined,
        gamesPlayed: (stats || []).length,
        heightChange:
          latestMeasurement?.height_cm && prevMeasurement?.height_cm
            ? latestMeasurement.height_cm - prevMeasurement.height_cm
            : undefined,
      });

      // ふりかえりレコード作成
      const { data: review, error: reviewError } = await supabase
        .from("monthly_reviews")
        .insert({
          player_id: player.id,
          team_id: player.team_id,
          year: targetYear,
          month: targetMonth,
          games_played: (stats || []).length,
          batting_avg: battingAvg,
          height_cm: latestMeasurement?.height_cm,
          height_change:
            latestMeasurement?.height_cm && prevMeasurement?.height_cm
              ? latestMeasurement.height_cm - prevMeasurement.height_cm
              : null,
          weight_kg: latestMeasurement?.weight_kg,
          weight_change:
            latestMeasurement?.weight_kg && prevMeasurement?.weight_kg
              ? latestMeasurement.weight_kg - prevMeasurement.weight_kg
              : null,
          positive_message: positiveMessage,
        })
        .select()
        .single();

      if (reviewError) {
        console.error(
          `Failed to create review for player ${player.id}:`,
          reviewError
        );
        continue;
      }

      results.push(review);
    }

    return NextResponse.json({
      success: true,
      generated: results.length,
      month: `${targetYear}-${targetMonth}`,
    });
  } catch (error) {
    console.error("Monthly review generation failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
