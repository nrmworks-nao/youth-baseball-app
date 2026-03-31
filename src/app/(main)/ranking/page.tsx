"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { StatsBarChart } from "@/components/features/charts/BarChart";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import {
  getTeamAllPlayerStats,
  getTeamFitnessRecords,
} from "@/lib/supabase/queries/players";
import type {
  PlayerGameStats,
  PlayerFitnessRecord,
  RankingMetric,
  RankingPeriod,
} from "@/types";

const METRIC_CONFIG: Record<
  RankingMetric,
  { label: string; unit: string; format: (v: number) => string }
> = {
  batting_avg: {
    label: "打率",
    unit: "",
    format: (v) => v.toFixed(3),
  },
  home_runs: {
    label: "本塁打",
    unit: "本",
    format: (v) => String(v),
  },
  rbis: {
    label: "打点",
    unit: "点",
    format: (v) => String(v),
  },
  stolen_bases: {
    label: "盗塁",
    unit: "個",
    format: (v) => String(v),
  },
  ops: {
    label: "OPS",
    unit: "",
    format: (v) => v.toFixed(3),
  },
  throw_distance: {
    label: "遠投",
    unit: "m",
    format: (v) => v.toFixed(1),
  },
  sprint_50m: {
    label: "50m走",
    unit: "秒",
    format: (v) => v.toFixed(2),
  },
};

const PERIOD_LABELS: Record<RankingPeriod, string> = {
  all: "通算",
  month: "今月",
  season: "今シーズン",
};

const MIN_AT_BATS = 10;

const MEDAL_STYLES = [
  "bg-yellow-100 text-yellow-700 border-yellow-300",
  "bg-gray-100 text-gray-600 border-gray-300",
  "bg-orange-100 text-orange-700 border-orange-300",
];

type StatsWithPlayer = PlayerGameStats & {
  players: { id: string; name: string; number: number };
};
type FitnessWithPlayer = PlayerFitnessRecord & {
  players: { id: string; name: string; number: number };
};

interface RankingEntry {
  name: string;
  number: number;
  value: number;
  at_bats?: number;
}

function getSeasonRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  return {
    start: `${year}-04-01`,
    end: `${year + 1}-03-31`,
  };
}

function getMonthRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${lastDay}`,
  };
}

export default function RankingPage() {
  const [metric, setMetric] = useState<RankingMetric>("batting_avg");
  const [period, setPeriod] = useState<RankingPeriod>("all");
  const { currentTeam, isLoading: teamLoading } = useCurrentTeam();
  const [allStats, setAllStats] = useState<StatsWithPlayer[]>([]);
  const [fitnessRecords, setFitnessRecords] = useState<FitnessWithPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teamLoading || !currentTeam) return;
    const load = async () => {
      try {
        const [stats, fitness] = await Promise.all([
          getTeamAllPlayerStats(currentTeam.id),
          getTeamFitnessRecords(currentTeam.id),
        ]);
        setAllStats(stats as StatsWithPlayer[]);
        setFitnessRecords(fitness as FitnessWithPlayer[]);
      } catch {
        setError("データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [currentTeam, teamLoading]);

  const rankings = useMemo((): RankingEntry[] => {
    const isFitnessMetric = ["throw_distance", "sprint_50m"].includes(metric);

    if (isFitnessMetric) {
      // 体力指標: 各選手の最新記録を使用
      const playerLatest = new Map<string, FitnessWithPlayer>();
      for (const r of fitnessRecords) {
        const existing = playerLatest.get(r.player_id);
        if (!existing || r.measured_at > existing.measured_at) {
          playerLatest.set(r.player_id, r);
        }
      }

      const entries: RankingEntry[] = [];
      for (const [, record] of playerLatest) {
        const val = metric === "throw_distance" ? record.throw_distance : record.sprint_50m;
        if (val == null) continue;
        entries.push({
          name: record.players.name,
          number: record.players.number,
          value: val,
        });
      }

      // 50m走は昇順（小さいほど良い）、遠投は降順
      if (metric === "sprint_50m") {
        entries.sort((a, b) => a.value - b.value);
      } else {
        entries.sort((a, b) => b.value - a.value);
      }
      return entries;
    }

    // 打撃指標: 期間フィルタリング + 集計
    let filteredStats = allStats;
    if (period === "month") {
      const { start, end } = getMonthRange();
      filteredStats = allStats.filter((s) => {
        const gameDate = (s as unknown as { games?: { game_date: string } }).games?.game_date;
        if (!gameDate) return true;
        return gameDate >= start && gameDate <= end;
      });
    } else if (period === "season") {
      const { start, end } = getSeasonRange();
      filteredStats = allStats.filter((s) => {
        const gameDate = (s as unknown as { games?: { game_date: string } }).games?.game_date;
        if (!gameDate) return true;
        return gameDate >= start && gameDate <= end;
      });
    }

    // 選手ごとに集計
    const playerAgg = new Map<
      string,
      {
        name: string;
        number: number;
        at_bats: number;
        hits: number;
        doubles: number;
        triples: number;
        home_runs: number;
        rbis: number;
        walks: number;
        stolen_bases: number;
        hbp: number;
        sf: number;
      }
    >();

    for (const s of filteredStats) {
      const pid = s.player_id;
      const existing = playerAgg.get(pid);
      if (existing) {
        existing.at_bats += s.at_bats;
        existing.hits += s.hits;
        existing.doubles += s.doubles;
        existing.triples += s.triples;
        existing.home_runs += s.home_runs;
        existing.rbis += s.rbis;
        existing.walks += s.walks;
        existing.stolen_bases += s.stolen_bases;
      } else {
        playerAgg.set(pid, {
          name: s.players.name,
          number: s.players.number,
          at_bats: s.at_bats,
          hits: s.hits,
          doubles: s.doubles,
          triples: s.triples,
          home_runs: s.home_runs,
          rbis: s.rbis,
          walks: s.walks,
          stolen_bases: s.stolen_bases,
          hbp: 0,
          sf: 0,
        });
      }
    }

    const entries: RankingEntry[] = [];
    for (const [, agg] of playerAgg) {
      let value: number;
      switch (metric) {
        case "batting_avg":
          if (agg.at_bats === 0) continue;
          value = agg.hits / agg.at_bats;
          break;
        case "home_runs":
          value = agg.home_runs;
          break;
        case "rbis":
          value = agg.rbis;
          break;
        case "stolen_bases":
          value = agg.stolen_bases;
          break;
        case "ops": {
          if (agg.at_bats === 0) continue;
          const obpDenom = agg.at_bats + agg.walks + agg.hbp + agg.sf;
          const obp = obpDenom > 0 ? (agg.hits + agg.walks + agg.hbp) / obpDenom : 0;
          const singles = agg.hits - agg.doubles - agg.triples - agg.home_runs;
          const totalBases = singles + agg.doubles * 2 + agg.triples * 3 + agg.home_runs * 4;
          const slg = agg.at_bats > 0 ? totalBases / agg.at_bats : 0;
          value = obp + slg;
          break;
        }
        default:
          continue;
      }
      entries.push({
        name: agg.name,
        number: agg.number,
        value,
        at_bats: agg.at_bats,
      });
    }

    // 打率系は足切り
    const isBattingRate = ["batting_avg", "ops"].includes(metric);
    const filtered = isBattingRate
      ? entries.filter((e) => (e.at_bats ?? 0) >= MIN_AT_BATS)
      : entries;

    filtered.sort((a, b) => b.value - a.value);
    return filtered;
  }, [allStats, fitnessRecords, metric, period]);

  const config = METRIC_CONFIG[metric];
  const isBattingMetric = ["batting_avg", "ops"].includes(metric);

  const chartData = rankings.map((r) => ({
    name: `#${r.number} ${r.name}`,
    value: r.value,
  }));

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">ランキング</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* 期間 */}
        <div className="flex gap-2">
          {(Object.entries(PERIOD_LABELS) as [RankingPeriod, string][]).map(
            ([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === key
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>

        {/* 指標切替 */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(METRIC_CONFIG) as [RankingMetric, typeof config][]).map(
            ([key, cfg]) => (
              <button
                key={key}
                onClick={() => setMetric(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  metric === key
                    ? "bg-green-100 text-green-700 ring-1 ring-green-300"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                {cfg.label}
              </button>
            )
          )}
        </div>

        {isBattingMetric && (
          <div className="text-xs text-gray-400">
            ※ 打席数{MIN_AT_BATS}以上の選手が対象
          </div>
        )}

        {rankings.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            データがありません
          </div>
        ) : (
          <>
            {/* 上位3名ハイライト */}
            <div className="grid grid-cols-3 gap-2">
              {rankings.slice(0, 3).map((r, i) => (
                <Card
                  key={r.number}
                  className={`border ${MEDAL_STYLES[i]} text-center`}
                >
                  <CardContent className="p-3">
                    <div className="text-lg font-bold">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                    </div>
                    <div className="text-xs font-medium">
                      #{r.number} {r.name}
                    </div>
                    <div className="mt-1 text-lg font-bold">
                      {config.format(r.value)}
                      {config.unit && (
                        <span className="text-xs font-normal">{config.unit}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 棒グラフ */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{config.label}ランキング</CardTitle>
              </CardHeader>
              <CardContent>
                <StatsBarChart
                  data={chartData}
                  height={Math.max(250, rankings.length * 40)}
                  layout="vertical"
                  valueLabel={config.label}
                  highlightTop={3}
                />
              </CardContent>
            </Card>

            {/* テーブル */}
            <Card>
              <CardContent className="px-2 py-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-2 py-1.5 text-center font-medium text-gray-500">
                        順位
                      </th>
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">
                        選手
                      </th>
                      <th className="px-2 py-1.5 text-right font-medium text-gray-500">
                        {config.label}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((r, i) => (
                      <tr key={r.number} className="border-b border-gray-50">
                        <td className="px-2 py-2 text-center">
                          {i < 3 ? (
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${MEDAL_STYLES[i]}`}
                            >
                              {i + 1}
                            </span>
                          ) : (
                            <span className="text-gray-500">{i + 1}</span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <span className="font-medium text-gray-900">
                            {r.name}
                          </span>
                          <span className="ml-1 text-gray-400">#{r.number}</span>
                        </td>
                        <td className="px-2 py-2 text-right font-bold text-gray-900">
                          {config.format(r.value)}
                          {config.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
