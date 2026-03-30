"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DEMO_RECORDS = [
  { opponent: "東ライオンズ", wins: 3, losses: 2, draws: 1 },
  { opponent: "南イーグルス", wins: 2, losses: 3, draws: 0 },
  { opponent: "北スターズ", wins: 4, losses: 1, draws: 0 },
  { opponent: "西ドラゴンズ", wins: 1, losses: 1, draws: 1 },
];

const DEMO_GAMES = [
  { id: "g1", opponent: "東ライオンズ", date: "2026-03-20", result: "win", score_team: 5, score_opponent: 3 },
  { id: "g2", opponent: "南イーグルス", date: "2026-03-13", result: "lose", score_team: 2, score_opponent: 4 },
  { id: "g3", opponent: "北スターズ", date: "2026-03-06", result: "win", score_team: 8, score_opponent: 1 },
  { id: "g4", opponent: "東ライオンズ", date: "2026-02-28", result: "draw", score_team: 3, score_opponent: 3 },
  { id: "g5", opponent: "西ドラゴンズ", date: "2026-02-20", result: "win", score_team: 6, score_opponent: 2 },
];

const RESULT_CONFIG: Record<string, { label: string; variant: "primary" | "danger" | "default" }> = {
  win: { label: "勝", variant: "primary" },
  lose: { label: "負", variant: "danger" },
  draw: { label: "分", variant: "default" },
};

export default function TeamRecordsPage() {
  const totalWins = DEMO_RECORDS.reduce((s, r) => s + r.wins, 0);
  const totalLosses = DEMO_RECORDS.reduce((s, r) => s + r.losses, 0);
  const totalDraws = DEMO_RECORDS.reduce((s, r) => s + r.draws, 0);

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">対戦成績</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* 通算成績 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-[10px] text-gray-500">勝ち</p>
            <p className="text-xl font-bold text-green-700">{totalWins}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <p className="text-[10px] text-gray-500">負け</p>
            <p className="text-xl font-bold text-red-700">{totalLosses}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-[10px] text-gray-500">引き分け</p>
            <p className="text-xl font-bold text-gray-700">{totalDraws}</p>
          </div>
        </div>

        {/* チーム別成績 */}
        <Card>
          <CardHeader>
            <CardTitle>チーム別</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {DEMO_RECORDS.map((record) => (
                <div key={record.opponent} className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-900">{record.opponent}</span>
                  <span className="text-sm text-gray-600">
                    <span className="text-green-600">{record.wins}勝</span>
                    {" "}
                    <span className="text-red-600">{record.losses}敗</span>
                    {" "}
                    <span className="text-gray-500">{record.draws}分</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 最近の対戦 */}
        <Card>
          <CardHeader>
            <CardTitle>最近の対戦</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {DEMO_GAMES.map((game) => {
                const cfg = RESULT_CONFIG[game.result];
                return (
                  <div key={game.id} className="flex items-center justify-between rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      <span className="text-sm text-gray-900">vs {game.opponent}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {game.score_team} - {game.score_opponent}
                      </p>
                      <p className="text-[10px] text-gray-400">{game.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
