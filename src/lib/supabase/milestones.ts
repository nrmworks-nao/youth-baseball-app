import type { PlayerGameStats, PlayerMeasurement, Milestone } from "@/types";

/**
 * マイルストーン自動検出ロジック
 * 選手の成績・測定データから自動的にマイルストーンを検出する
 */

interface MilestoneCandidate {
  milestone_type: string;
  title: string;
  description?: string;
  milestone_date: string;
}

// 初ヒット検出
function detectFirstHit(
  stats: PlayerGameStats[],
  gameDate: (s: PlayerGameStats) => string
): MilestoneCandidate | null {
  const sorted = [...stats].sort(
    (a, b) => new Date(gameDate(a)).getTime() - new Date(gameDate(b)).getTime()
  );
  for (const s of sorted) {
    if (s.hits > 0) {
      return {
        milestone_type: "first_hit",
        title: "初ヒット！",
        description: "記念すべき初ヒットを打ちました！",
        milestone_date: gameDate(s),
      };
    }
  }
  return null;
}

// 初打点検出
function detectFirstRbi(
  stats: PlayerGameStats[],
  gameDate: (s: PlayerGameStats) => string
): MilestoneCandidate | null {
  const sorted = [...stats].sort(
    (a, b) => new Date(gameDate(a)).getTime() - new Date(gameDate(b)).getTime()
  );
  for (const s of sorted) {
    if (s.rbis > 0) {
      return {
        milestone_type: "first_rbi",
        title: "初打点！",
        description: "初めての打点を記録しました！",
        milestone_date: gameDate(s),
      };
    }
  }
  return null;
}

// 初ホームラン検出
function detectFirstHomerun(
  stats: PlayerGameStats[],
  gameDate: (s: PlayerGameStats) => string
): MilestoneCandidate | null {
  const sorted = [...stats].sort(
    (a, b) => new Date(gameDate(a)).getTime() - new Date(gameDate(b)).getTime()
  );
  for (const s of sorted) {
    if (s.home_runs > 0) {
      return {
        milestone_type: "first_homerun",
        title: "初ホームラン！",
        description: "初めてのホームランを打ちました！",
        milestone_date: gameDate(s),
      };
    }
  }
  return null;
}

// 初盗塁検出
function detectFirstSteal(
  stats: PlayerGameStats[],
  gameDate: (s: PlayerGameStats) => string
): MilestoneCandidate | null {
  const sorted = [...stats].sort(
    (a, b) => new Date(gameDate(a)).getTime() - new Date(gameDate(b)).getTime()
  );
  for (const s of sorted) {
    if (s.stolen_bases > 0) {
      return {
        milestone_type: "first_steal",
        title: "初盗塁！",
        description: "初めての盗塁を成功させました！",
        milestone_date: gameDate(s),
      };
    }
  }
  return null;
}

// 初三振（投手）検出
function detectFirstStrikeoutPitched(
  stats: PlayerGameStats[],
  gameDate: (s: PlayerGameStats) => string
): MilestoneCandidate | null {
  const sorted = [...stats].sort(
    (a, b) => new Date(gameDate(a)).getTime() - new Date(gameDate(b)).getTime()
  );
  for (const s of sorted) {
    if (s.strikeouts_pitched > 0) {
      return {
        milestone_type: "first_strikeout_pitched",
        title: "初奪三振！",
        description: "初めての奪三振を記録しました！",
        milestone_date: gameDate(s),
      };
    }
  }
  return null;
}

// 身長10cm節目突破検出
function detectHeightMilestones(
  measurements: PlayerMeasurement[]
): MilestoneCandidate[] {
  const milestones: MilestoneCandidate[] = [];
  const sorted = [...measurements].sort(
    (a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
  );

  const passedThresholds = new Set<number>();
  for (const m of sorted) {
    if (!m.height_cm) continue;
    // 110, 120, 130, 140, 150, 160...
    const threshold = Math.floor(m.height_cm / 10) * 10;
    for (let t = 110; t <= threshold; t += 10) {
      if (!passedThresholds.has(t)) {
        passedThresholds.add(t);
        milestones.push({
          milestone_type: "height_milestone",
          title: `身長${t}cm突破！`,
          description: `身長が${t}cmを超えました！`,
          milestone_date: m.measured_at,
        });
      }
    }
  }
  return milestones;
}

// 自己ベスト更新検出（打率）
function detectBattingAvgBest(
  stats: PlayerGameStats[],
  gameDate: (s: PlayerGameStats) => string
): MilestoneCandidate[] {
  const milestones: MilestoneCandidate[] = [];
  const sorted = [...stats].sort(
    (a, b) => new Date(gameDate(a)).getTime() - new Date(gameDate(b)).getTime()
  );

  let totalHits = 0;
  let totalAtBats = 0;
  let bestAvg = 0;

  for (const s of sorted) {
    totalHits += s.hits;
    totalAtBats += s.at_bats;
    if (totalAtBats >= 10) {
      const avg = totalHits / totalAtBats;
      if (avg > bestAvg + 0.01) {
        bestAvg = avg;
        milestones.push({
          milestone_type: "personal_best",
          title: `打率自己ベスト更新 .${Math.round(avg * 1000)}`,
          description: `通算打率が.${Math.round(avg * 1000)}に上がりました！`,
          milestone_date: gameDate(s),
        });
      }
    }
  }
  return milestones;
}

// 入団記念日検出
function detectAnniversaries(
  joinDate: string,
  currentDate: string
): MilestoneCandidate[] {
  const milestones: MilestoneCandidate[] = [];
  const join = new Date(joinDate);
  const now = new Date(currentDate);

  for (let year = 1; year <= 10; year++) {
    const anniversary = new Date(join);
    anniversary.setFullYear(join.getFullYear() + year);
    if (anniversary <= now) {
      milestones.push({
        milestone_type: "anniversary",
        title: `入団${year}年目！`,
        description: `チームに入って${year}年が経ちました！`,
        milestone_date: anniversary.toISOString().split("T")[0],
      });
    }
  }
  return milestones;
}

/**
 * 全マイルストーンを検出
 */
export function detectAllMilestones(params: {
  stats: PlayerGameStats[];
  measurements: PlayerMeasurement[];
  joinDate: string;
  currentDate: string;
  existingMilestones: Milestone[];
  gameDate: (s: PlayerGameStats) => string;
}): MilestoneCandidate[] {
  const {
    stats,
    measurements,
    joinDate,
    currentDate,
    existingMilestones,
    gameDate,
  } = params;

  const existingTypes = new Set(
    existingMilestones.map((m) => m.milestone_type + ":" + m.title)
  );

  const candidates: MilestoneCandidate[] = [];

  // 各種初回記録
  const detectors = [
    detectFirstHit,
    detectFirstRbi,
    detectFirstHomerun,
    detectFirstSteal,
    detectFirstStrikeoutPitched,
  ];
  for (const detector of detectors) {
    const result = detector(stats, gameDate);
    if (result) candidates.push(result);
  }

  // 身長マイルストーン
  candidates.push(...detectHeightMilestones(measurements));

  // 打率自己ベスト
  candidates.push(...detectBattingAvgBest(stats, gameDate));

  // 入団記念日
  candidates.push(...detectAnniversaries(joinDate, currentDate));

  // 既存マイルストーンと重複しないものだけ返す
  return candidates.filter(
    (c) => !existingTypes.has(c.milestone_type + ":" + c.title)
  );
}
