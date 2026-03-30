"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";

// デモデータ
const DEMO_PLAYERS = [
  {
    id: "p1",
    name: "田中太郎",
    number: 8,
    position: "中堅手",
    grade: 6,
    batting_avg: 0.345,
    games: 12,
  },
  {
    id: "p2",
    name: "佐藤次郎",
    number: 4,
    position: "二塁手",
    grade: 6,
    batting_avg: 0.289,
    games: 12,
  },
  {
    id: "p3",
    name: "鈴木健",
    number: 6,
    position: "遊撃手",
    grade: 6,
    batting_avg: 0.412,
    games: 11,
  },
  {
    id: "p4",
    name: "高橋大輝",
    number: 3,
    position: "一塁手",
    grade: 5,
    batting_avg: 0.325,
    games: 12,
  },
  {
    id: "p5",
    name: "渡辺翔",
    number: 5,
    position: "三塁手",
    grade: 5,
    batting_avg: 0.278,
    games: 10,
  },
  {
    id: "p6",
    name: "伊藤誠",
    number: 7,
    position: "左翼手",
    grade: 5,
    batting_avg: 0.256,
    games: 12,
  },
  {
    id: "p7",
    name: "山田拓",
    number: 9,
    position: "右翼手",
    grade: 4,
    batting_avg: 0.198,
    games: 9,
  },
  {
    id: "p8",
    name: "中村雄太",
    number: 2,
    position: "捕手",
    grade: 6,
    batting_avg: 0.301,
    games: 12,
  },
  {
    id: "p9",
    name: "小林直人",
    number: 1,
    position: "投手",
    grade: 6,
    batting_avg: 0.215,
    games: 8,
  },
];

export default function PlayersPage() {
  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">選手一覧</h2>
        <div className="text-xs text-gray-500">
          {DEMO_PLAYERS.length}名
        </div>
      </div>

      {/* チーム成績サマリー */}
      <div className="grid grid-cols-3 gap-3 bg-white px-4 py-3">
        <div className="rounded-lg bg-green-50 p-3 text-center">
          <div className="text-lg font-bold text-green-700">
            .{Math.round(
              (DEMO_PLAYERS.reduce((s, p) => s + p.batting_avg, 0) /
                DEMO_PLAYERS.length) *
                1000
            )}
          </div>
          <div className="text-[10px] text-green-600">チーム打率</div>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 text-center">
          <div className="text-lg font-bold text-blue-700">
            {DEMO_PLAYERS.reduce((s, p) => s + p.games, 0)}
          </div>
          <div className="text-[10px] text-blue-600">総出場数</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <div className="text-lg font-bold text-gray-700">
            {DEMO_PLAYERS.length}
          </div>
          <div className="text-[10px] text-gray-600">登録選手</div>
        </div>
      </div>

      {/* 選手リスト */}
      <div className="space-y-2 p-4">
        {DEMO_PLAYERS.map((player) => (
          <Link key={player.id} href={`/players/${player.id}`}>
            <Card className="p-3 transition-colors hover:bg-gray-50">
              <div className="flex items-center gap-3">
                {/* 背番号 */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                  <span className="text-sm font-bold text-green-700">
                    {player.number}
                  </span>
                </div>
                {/* 選手情報 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {player.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {player.grade}年
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {player.position}
                  </div>
                </div>
                {/* 成績 */}
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {player.batting_avg.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {player.games}試合
                  </div>
                </div>
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
