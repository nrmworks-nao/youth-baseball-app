"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatsBarChart } from "@/components/features/charts/BarChart";
import type { RankingMetric, RankingPeriod } from "@/types";

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

// デモデータ
const DEMO_RANKINGS: Record<
  RankingMetric,
  { name: string; number: number; value: number; at_bats?: number }[]
> = {
  batting_avg: [
    { name: "鈴木健", number: 6, value: 0.412, at_bats: 82 },
    { name: "田中太郎", number: 8, value: 0.345, at_bats: 78 },
    { name: "高橋大輝", number: 3, value: 0.325, at_bats: 80 },
    { name: "中村雄太", number: 2, value: 0.301, at_bats: 73 },
    { name: "佐藤次郎", number: 4, value: 0.289, at_bats: 76 },
    { name: "渡辺翔", number: 5, value: 0.278, at_bats: 65 },
    { name: "伊藤誠", number: 7, value: 0.256, at_bats: 74 },
    { name: "小林直人", number: 1, value: 0.215, at_bats: 51 },
    { name: "山田拓", number: 9, value: 0.198, at_bats: 58 },
  ],
  home_runs: [
    { name: "高橋大輝", number: 3, value: 5 },
    { name: "鈴木健", number: 6, value: 3 },
    { name: "田中太郎", number: 8, value: 2 },
    { name: "中村雄太", number: 2, value: 2 },
    { name: "渡辺翔", number: 5, value: 1 },
    { name: "佐藤次郎", number: 4, value: 1 },
    { name: "伊藤誠", number: 7, value: 0 },
    { name: "山田拓", number: 9, value: 0 },
    { name: "小林直人", number: 1, value: 0 },
  ],
  rbis: [
    { name: "高橋大輝", number: 3, value: 22 },
    { name: "鈴木健", number: 6, value: 18 },
    { name: "田中太郎", number: 8, value: 15 },
    { name: "渡辺翔", number: 5, value: 12 },
    { name: "中村雄太", number: 2, value: 10 },
    { name: "佐藤次郎", number: 4, value: 8 },
    { name: "山田拓", number: 9, value: 6 },
    { name: "伊藤誠", number: 7, value: 5 },
    { name: "小林直人", number: 1, value: 3 },
  ],
  stolen_bases: [
    { name: "田中太郎", number: 8, value: 15 },
    { name: "佐藤次郎", number: 4, value: 12 },
    { name: "鈴木健", number: 6, value: 8 },
    { name: "渡辺翔", number: 5, value: 6 },
    { name: "山田拓", number: 9, value: 5 },
    { name: "伊藤誠", number: 7, value: 3 },
    { name: "中村雄太", number: 2, value: 2 },
    { name: "高橋大輝", number: 3, value: 1 },
    { name: "小林直人", number: 1, value: 0 },
  ],
  ops: [
    { name: "鈴木健", number: 6, value: 0.952 },
    { name: "高橋大輝", number: 3, value: 0.912 },
    { name: "田中太郎", number: 8, value: 0.845 },
    { name: "中村雄太", number: 2, value: 0.789 },
    { name: "佐藤次郎", number: 4, value: 0.745 },
    { name: "渡辺翔", number: 5, value: 0.712 },
    { name: "伊藤誠", number: 7, value: 0.655 },
    { name: "小林直人", number: 1, value: 0.598 },
    { name: "山田拓", number: 9, value: 0.545 },
  ],
  throw_distance: [
    { name: "高橋大輝", number: 3, value: 48.5 },
    { name: "鈴木健", number: 6, value: 42.5 },
    { name: "小林直人", number: 1, value: 41.0 },
    { name: "中村雄太", number: 2, value: 40.0 },
    { name: "田中太郎", number: 8, value: 38.0 },
    { name: "渡辺翔", number: 5, value: 36.5 },
    { name: "佐藤次郎", number: 4, value: 35.0 },
    { name: "伊藤誠", number: 7, value: 33.0 },
    { name: "山田拓", number: 9, value: 30.0 },
  ],
  sprint_50m: [
    { name: "田中太郎", number: 8, value: 7.5 },
    { name: "佐藤次郎", number: 4, value: 7.6 },
    { name: "鈴木健", number: 6, value: 7.8 },
    { name: "渡辺翔", number: 5, value: 7.9 },
    { name: "山田拓", number: 9, value: 8.0 },
    { name: "伊藤誠", number: 7, value: 8.1 },
    { name: "中村雄太", number: 2, value: 8.2 },
    { name: "高橋大輝", number: 3, value: 8.3 },
    { name: "小林直人", number: 1, value: 8.5 },
  ],
};

const MIN_AT_BATS = 30; // 最低打席数

const MEDAL_STYLES = [
  "bg-yellow-100 text-yellow-700 border-yellow-300",
  "bg-gray-100 text-gray-600 border-gray-300",
  "bg-orange-100 text-orange-700 border-orange-300",
];

export default function RankingPage() {
  const [metric, setMetric] = useState<RankingMetric>("batting_avg");
  const [period, setPeriod] = useState<RankingPeriod>("all");
  const config = METRIC_CONFIG[metric];

  // 打率系は足切りを適用
  const isBattingMetric = ["batting_avg", "ops"].includes(metric);
  const rankings = DEMO_RANKINGS[metric].filter((r) => {
    if (!isBattingMetric) return true;
    return (r.at_bats ?? 0) >= MIN_AT_BATS;
  });

  const chartData = rankings.map((r) => ({
    name: `#${r.number} ${r.name}`,
    value: r.value,
  }));

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
      </div>
    </div>
  );
}
