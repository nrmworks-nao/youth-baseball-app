"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GameType, GameResult } from "@/types";

// デモデータ
const DEMO_GAMES = [
  {
    id: "1",
    opponent_name: "東京ジュニアーズ",
    game_date: "2026-03-23",
    venue: "中央公園グラウンド",
    game_type: "tournament" as GameType,
    result: "win" as GameResult,
    score_team: 8,
    score_opponent: 3,
  },
  {
    id: "2",
    opponent_name: "南部ベアーズ",
    game_date: "2026-03-16",
    venue: "南部運動場",
    game_type: "practice" as GameType,
    result: "lose" as GameResult,
    score_team: 2,
    score_opponent: 5,
  },
  {
    id: "3",
    opponent_name: "北区スターズ",
    game_date: "2026-03-09",
    venue: "北区野球場",
    game_type: "league" as GameType,
    result: "win" as GameResult,
    score_team: 6,
    score_opponent: 4,
  },
  {
    id: "4",
    opponent_name: "西部ライオンズ",
    game_date: "2026-03-02",
    venue: "西部グラウンド",
    game_type: "practice" as GameType,
    result: "draw" as GameResult,
    score_team: 3,
    score_opponent: 3,
  },
  {
    id: "5",
    opponent_name: "中央タイガース",
    game_date: "2026-02-23",
    venue: "中央球場",
    game_type: "tournament" as GameType,
    result: "win" as GameResult,
    score_team: 10,
    score_opponent: 2,
  },
];

const GAME_TYPE_LABEL: Record<GameType, string> = {
  practice: "練習試合",
  tournament: "大会",
  league: "リーグ戦",
};

const GAME_TYPE_VARIANT: Record<GameType, "practice" | "game" | "default"> = {
  practice: "practice",
  tournament: "game",
  league: "default",
};

const RESULT_CONFIG: Record<
  GameResult,
  { label: string; color: string; bg: string }
> = {
  win: { label: "勝", color: "text-green-700", bg: "bg-green-100" },
  lose: { label: "敗", color: "text-red-700", bg: "bg-red-100" },
  draw: { label: "分", color: "text-gray-700", bg: "bg-gray-100" },
};

type FilterType = "all" | GameType;

export default function GamesPage() {
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredGames =
    filter === "all"
      ? DEMO_GAMES
      : DEMO_GAMES.filter((g) => g.game_type === filter);

  // 勝敗サマリー
  const wins = DEMO_GAMES.filter((g) => g.result === "win").length;
  const losses = DEMO_GAMES.filter((g) => g.result === "lose").length;
  const draws = DEMO_GAMES.filter((g) => g.result === "draw").length;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">試合一覧</h2>
        <Link href="/games/create">
          <Button size="sm">+ 試合登録</Button>
        </Link>
      </div>

      {/* 勝敗サマリー */}
      <div className="grid grid-cols-3 gap-3 bg-white px-4 py-3">
        <div className="rounded-lg bg-green-50 p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{wins}</div>
          <div className="text-xs text-green-600">勝ち</div>
        </div>
        <div className="rounded-lg bg-red-50 p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{losses}</div>
          <div className="text-xs text-red-600">負け</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <div className="text-2xl font-bold text-gray-700">{draws}</div>
          <div className="text-xs text-gray-600">引分</div>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex gap-2 border-b border-gray-200 bg-white px-4 pb-3">
        {(
          [
            { key: "all", label: "すべて" },
            { key: "tournament", label: "大会" },
            { key: "league", label: "リーグ戦" },
            { key: "practice", label: "練習試合" },
          ] as { key: FilterType; label: string }[]
        ).map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === item.key
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 試合リスト */}
      <div className="space-y-2 p-4">
        {filteredGames.map((game) => {
          const resultConfig = game.result
            ? RESULT_CONFIG[game.result]
            : null;
          return (
            <Link key={game.id} href={`/games/${game.id}`}>
              <Card className="p-4 transition-colors hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={GAME_TYPE_VARIANT[game.game_type]}>
                        {GAME_TYPE_LABEL[game.game_type]}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {game.game_date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        vs {game.opponent_name}
                      </span>
                    </div>
                    {game.venue && (
                      <div className="text-xs text-gray-400">
                        {game.venue}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {resultConfig && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${resultConfig.bg} ${resultConfig.color}`}
                      >
                        {resultConfig.label}
                      </span>
                    )}
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {game.score_team} - {game.score_opponent}
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
                </div>
              </Card>
            </Link>
          );
        })}
        {filteredGames.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            試合データがありません
          </div>
        )}
      </div>
    </div>
  );
}
