import type { PlayerGameStats, PlayerBadge } from "@/types";

/**
 * バッジ自動判定ロジック
 * プリセットバッジの条件を判定する
 */

interface BadgeCheckResult {
  condition_key: string;
  earned: boolean;
  description: string;
}

// プリセットバッジ定義
export const PRESET_BADGES = [
  {
    condition_key: "first_hit",
    name: "初ヒット",
    description: "初めてのヒットを打った",
    category: "batting" as const,
    icon_color: "#f59e0b",
  },
  {
    condition_key: "first_rbi",
    name: "初打点",
    description: "初めての打点を記録した",
    category: "batting" as const,
    icon_color: "#ef4444",
  },
  {
    condition_key: "first_homerun",
    name: "初ホームラン",
    description: "初めてのホームランを打った",
    category: "batting" as const,
    icon_color: "#8b5cf6",
  },
  {
    condition_key: "first_steal",
    name: "初盗塁",
    description: "初めての盗塁に成功した",
    category: "running" as const,
    icon_color: "#06b6d4",
  },
  {
    condition_key: "first_strikeout_pitched",
    name: "初奪三振",
    description: "投手として初めての奪三振を記録した",
    category: "pitching" as const,
    icon_color: "#10b981",
  },
  {
    condition_key: "first_complete_game",
    name: "初完投",
    description: "初めて完投した",
    category: "pitching" as const,
    icon_color: "#3b82f6",
  },
  {
    condition_key: "first_win",
    name: "初勝利",
    description: "投手として初めて勝利を記録した",
    category: "pitching" as const,
    icon_color: "#f97316",
  },
  {
    condition_key: "consecutive_on_base_3",
    name: "連続出塁",
    description: "3試合以上連続で出塁した",
    category: "batting" as const,
    icon_color: "#eab308",
  },
  {
    condition_key: "iron_defense_10",
    name: "守備の鉄人",
    description: "10試合連続ノーエラーを達成した",
    category: "fielding" as const,
    icon_color: "#6366f1",
  },
  {
    condition_key: "speed_runner",
    name: "俊足ランナー",
    description: "ベースラン自己ベストを更新した",
    category: "running" as const,
    icon_color: "#14b8a6",
  },
  {
    condition_key: "throw_king",
    name: "遠投キング",
    description: "遠投自己ベストを更新した",
    category: "effort" as const,
    icon_color: "#dc2626",
  },
  {
    condition_key: "effort_star",
    name: "努力の星",
    description: "目標チャレンジを達成した",
    category: "effort" as const,
    icon_color: "#fbbf24",
  },
  {
    condition_key: "perfect_attendance",
    name: "皆勤賞",
    description: "月間の練習に全て参加した",
    category: "effort" as const,
    icon_color: "#22c55e",
  },
];

/**
 * 選手の成績からバッジ獲得条件をチェック
 */
export function checkBadgeConditions(
  stats: PlayerGameStats[],
  existingBadges: PlayerBadge[]
): BadgeCheckResult[] {
  const earned = new Set(
    existingBadges.map((b) => b.badge?.condition_key).filter(Boolean)
  );
  const results: BadgeCheckResult[] = [];

  // 初ヒット
  if (!earned.has("first_hit")) {
    const hasHit = stats.some((s) => s.hits > 0);
    results.push({
      condition_key: "first_hit",
      earned: hasHit,
      description: "初めてのヒットを打つ",
    });
  }

  // 初打点
  if (!earned.has("first_rbi")) {
    const hasRbi = stats.some((s) => s.rbis > 0);
    results.push({
      condition_key: "first_rbi",
      earned: hasRbi,
      description: "初めての打点を記録する",
    });
  }

  // 初ホームラン
  if (!earned.has("first_homerun")) {
    const hasHr = stats.some((s) => s.home_runs > 0);
    results.push({
      condition_key: "first_homerun",
      earned: hasHr,
      description: "初めてのホームランを打つ",
    });
  }

  // 初盗塁
  if (!earned.has("first_steal")) {
    const hasSteal = stats.some((s) => s.stolen_bases > 0);
    results.push({
      condition_key: "first_steal",
      earned: hasSteal,
      description: "初めての盗塁に成功する",
    });
  }

  // 初奪三振
  if (!earned.has("first_strikeout_pitched")) {
    const hasK = stats.some((s) => s.strikeouts_pitched > 0);
    results.push({
      condition_key: "first_strikeout_pitched",
      earned: hasK,
      description: "投手として初めての奪三振を記録する",
    });
  }

  // 初勝利
  if (!earned.has("first_win")) {
    const hasWin = stats.some((s) => s.is_winning_pitcher);
    results.push({
      condition_key: "first_win",
      earned: hasWin,
      description: "投手として初めて勝利を記録する",
    });
  }

  // 連続出塁（3試合以上）
  if (!earned.has("consecutive_on_base_3")) {
    let consecutive = 0;
    let maxConsecutive = 0;
    for (const s of stats) {
      if (s.hits > 0 || s.walks > 0) {
        consecutive++;
        maxConsecutive = Math.max(maxConsecutive, consecutive);
      } else {
        consecutive = 0;
      }
    }
    results.push({
      condition_key: "consecutive_on_base_3",
      earned: maxConsecutive >= 3,
      description: "3試合以上連続で出塁する",
    });
  }

  // 守備の鉄人（10試合連続ノーエラー）
  if (!earned.has("iron_defense_10")) {
    let consecutive = 0;
    let maxConsecutive = 0;
    for (const s of stats) {
      if (s.errors === 0) {
        consecutive++;
        maxConsecutive = Math.max(maxConsecutive, consecutive);
      } else {
        consecutive = 0;
      }
    }
    results.push({
      condition_key: "iron_defense_10",
      earned: maxConsecutive >= 10,
      description: "10試合連続ノーエラーを達成する",
    });
  }

  return results;
}

/**
 * バッジアイコンを取得（カテゴリに基づくアイコン文字）
 */
export function getBadgeIcon(category: string): string {
  const icons: Record<string, string> = {
    batting: "⚾",
    pitching: "🔥",
    fielding: "🧤",
    running: "💨",
    effort: "⭐",
    special: "🏆",
    custom: "🎖️",
  };
  return icons[category] || "🎖️";
}
