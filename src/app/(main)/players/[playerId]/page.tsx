"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatsLineChart } from "@/components/features/charts/LineChart";
import { StatsRadarChart } from "@/components/features/charts/RadarChart";

type ViewPeriod = "all" | "month" | "tournament";

// デモ選手
const DEMO_PLAYER = {
  id: "p3",
  name: "鈴木健",
  number: 6,
  position: "遊撃手",
  grade: 6,
};

// 打撃集計デモ
const DEMO_BATTING = {
  all: {
    games: 24,
    at_bats: 82,
    hits: 28,
    doubles: 6,
    triples: 2,
    home_runs: 3,
    rbis: 18,
    walks: 12,
    strikeouts: 10,
    stolen_bases: 8,
    hit_by_pitch: 2,
    sacrifice_flies: 1,
  },
  month: {
    games: 4,
    at_bats: 14,
    hits: 6,
    doubles: 2,
    triples: 0,
    home_runs: 1,
    rbis: 5,
    walks: 3,
    strikeouts: 1,
    stolen_bases: 2,
    hit_by_pitch: 0,
    sacrifice_flies: 0,
  },
  tournament: {
    games: 6,
    at_bats: 20,
    hits: 9,
    doubles: 3,
    triples: 1,
    home_runs: 2,
    rbis: 8,
    walks: 4,
    strikeouts: 2,
    stolen_bases: 3,
    hit_by_pitch: 1,
    sacrifice_flies: 1,
  },
};

// 投手集計デモ
const DEMO_PITCHING = {
  innings_pitched: 14.0,
  earned_runs: 5,
  hits_allowed: 12,
  walks_allowed: 6,
  strikeouts_pitched: 18,
  wins: 2,
  losses: 1,
};

// 守備集計デモ
const DEMO_FIELDING = {
  putouts: 32,
  assists: 48,
  errors: 4,
};

// 月別推移デモ
const DEMO_MONTHLY_TREND = [
  { month: "2025/10", batting_avg: 0.285, ops: 0.72 },
  { month: "2025/11", batting_avg: 0.31, ops: 0.78 },
  { month: "2025/12", batting_avg: 0.295, ops: 0.75 },
  { month: "2026/01", batting_avg: 0.32, ops: 0.82 },
  { month: "2026/02", batting_avg: 0.35, ops: 0.88 },
  { month: "2026/03", batting_avg: 0.412, ops: 0.95 },
];

// レーダーチャートデモ
const DEMO_RADAR = [
  { subject: "打撃力", value: 85, fullMark: 100 },
  { subject: "走力", value: 75, fullMark: 100 },
  { subject: "守備力", value: 80, fullMark: 100 },
  { subject: "体力", value: 70, fullMark: 100 },
];

function calcBattingAvg(hits: number, atBats: number): string {
  if (atBats === 0) return "---";
  return (hits / atBats).toFixed(3);
}

function calcOBP(
  hits: number,
  walks: number,
  hbp: number,
  atBats: number,
  sf: number
): string {
  const denom = atBats + walks + hbp + sf;
  if (denom === 0) return "---";
  return ((hits + walks + hbp) / denom).toFixed(3);
}

function calcSLG(
  hits: number,
  doubles: number,
  triples: number,
  homeRuns: number,
  atBats: number
): string {
  if (atBats === 0) return "---";
  const singles = hits - doubles - triples - homeRuns;
  const totalBases = singles + doubles * 2 + triples * 3 + homeRuns * 4;
  return (totalBases / atBats).toFixed(3);
}

function calcOPS(obp: string, slg: string): string {
  if (obp === "---" || slg === "---") return "---";
  return (parseFloat(obp) + parseFloat(slg)).toFixed(3);
}

function calcERA(earnedRuns: number, inningsPitched: number): string {
  if (inningsPitched === 0) return "---";
  return ((earnedRuns * 7) / inningsPitched).toFixed(2);
}

function calcWHIP(
  hitsAllowed: number,
  walksAllowed: number,
  inningsPitched: number
): string {
  if (inningsPitched === 0) return "---";
  return ((hitsAllowed + walksAllowed) / inningsPitched).toFixed(2);
}

function calcFieldingPct(
  putouts: number,
  assists: number,
  errors: number
): string {
  const total = putouts + assists + errors;
  if (total === 0) return "---";
  return ((putouts + assists) / total).toFixed(3);
}

export default function PlayerDashboardPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [period, setPeriod] = useState<ViewPeriod>("all");
  const player = DEMO_PLAYER;
  const batting = DEMO_BATTING[period];

  const battingAvg = calcBattingAvg(batting.hits, batting.at_bats);
  const obp = calcOBP(
    batting.hits,
    batting.walks,
    batting.hit_by_pitch,
    batting.at_bats,
    batting.sacrifice_flies
  );
  const slg = calcSLG(
    batting.hits,
    batting.doubles,
    batting.triples,
    batting.home_runs,
    batting.at_bats
  );
  const ops = calcOPS(obp, slg);
  const era = calcERA(DEMO_PITCHING.earned_runs, DEMO_PITCHING.innings_pitched);
  const whip = calcWHIP(
    DEMO_PITCHING.hits_allowed,
    DEMO_PITCHING.walks_allowed,
    DEMO_PITCHING.innings_pitched
  );
  const fieldingPct = calcFieldingPct(
    DEMO_FIELDING.putouts,
    DEMO_FIELDING.assists,
    DEMO_FIELDING.errors
  );

  // 前月比
  const prevMonth = DEMO_MONTHLY_TREND[DEMO_MONTHLY_TREND.length - 2];
  const currMonth = DEMO_MONTHLY_TREND[DEMO_MONTHLY_TREND.length - 1];
  const avgDiff = currMonth.batting_avg - prevMonth.batting_avg;

  const periods: { key: ViewPeriod; label: string }[] = [
    { key: "all", label: "通算" },
    { key: "month", label: "今月" },
    { key: "tournament", label: "大会" },
  ];

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/players" className="p-1">
          <svg
            className="h-5 w-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
        <h2 className="text-base font-bold text-gray-900">成長ダッシュボード</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* 選手プロフィール */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <span className="text-xl font-bold text-green-700">
                  {player.number}
                </span>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {player.name}
                </div>
                <div className="text-sm text-gray-500">
                  {player.position} / {player.grade}年生
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 期間切替 */}
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                period === p.key
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 主要指標 */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-white p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-gray-900">{battingAvg}</div>
            <div className="text-[10px] text-gray-500">打率</div>
          </div>
          <div className="rounded-lg bg-white p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-gray-900">{obp}</div>
            <div className="text-[10px] text-gray-500">出塁率</div>
          </div>
          <div className="rounded-lg bg-white p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-gray-900">{slg}</div>
            <div className="text-[10px] text-gray-500">長打率</div>
          </div>
          <div className="rounded-lg bg-white p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-green-700">{ops}</div>
            <div className="text-[10px] text-gray-500">OPS</div>
          </div>
        </div>

        {/* 前月比 */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">前月比（打率）</span>
              <span
                className={`text-sm font-bold ${avgDiff >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {avgDiff >= 0 ? "+" : ""}
                {avgDiff.toFixed(3)}
                {avgDiff >= 0 ? " ↑" : " ↓"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 打撃詳細 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">打撃成績</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <div className="grid grid-cols-5 gap-1 text-center text-xs">
              {[
                { label: "試合", value: batting.games },
                { label: "打数", value: batting.at_bats },
                { label: "安打", value: batting.hits },
                { label: "二塁打", value: batting.doubles },
                { label: "三塁打", value: batting.triples },
                { label: "本塁打", value: batting.home_runs },
                { label: "打点", value: batting.rbis },
                { label: "四球", value: batting.walks },
                { label: "三振", value: batting.strikeouts },
                { label: "盗塁", value: batting.stolen_bases },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-gray-50 p-2">
                  <div className="font-bold text-gray-900">{s.value}</div>
                  <div className="text-[10px] text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 成績推移グラフ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">成績推移</CardTitle>
          </CardHeader>
          <CardContent>
            <StatsLineChart
              data={DEMO_MONTHLY_TREND}
              xAxisKey="month"
              datasets={[
                { dataKey: "batting_avg", label: "打率", color: "#16a34a" },
                { dataKey: "ops", label: "OPS", color: "#2563eb" },
              ]}
              height={220}
            />
          </CardContent>
        </Card>

        {/* レーダーチャート */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">能力チャート</CardTitle>
          </CardHeader>
          <CardContent>
            <StatsRadarChart data={DEMO_RADAR} height={250} />
          </CardContent>
        </Card>

        {/* 投手・守備成績 */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs">投手成績</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">防御率</span>
                <span className="font-bold">{era}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">WHIP</span>
                <span className="font-bold">{whip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">投球回</span>
                <span>{DEMO_PITCHING.innings_pitched}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">奪三振</span>
                <span>{DEMO_PITCHING.strikeouts_pitched}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">勝-敗</span>
                <span>
                  {DEMO_PITCHING.wins}-{DEMO_PITCHING.losses}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs">守備成績</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">守備率</span>
                <span className="font-bold">{fieldingPct}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">刺殺</span>
                <span>{DEMO_FIELDING.putouts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">補殺</span>
                <span>{DEMO_FIELDING.assists}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">失策</span>
                <span>{DEMO_FIELDING.errors}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* リンク */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/players/${playerId}/measurements`}>
            <Button variant="outline" className="w-full text-sm">
              身体測定
            </Button>
          </Link>
          <Link href={`/players/${playerId}/fitness`}>
            <Button variant="outline" className="w-full text-sm">
              体力測定
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
