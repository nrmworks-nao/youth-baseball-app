"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GameType, GameResult } from "@/types";

// デモデータ
const DEMO_GAME = {
  id: "1",
  opponent_name: "東京ジュニアーズ",
  game_date: "2026-03-23",
  venue: "中央公園グラウンド",
  game_type: "tournament" as GameType,
  result: "win" as GameResult,
  score_team: 8,
  score_opponent: 3,
  notes: "春季大会 2回戦。序盤からリードを守り切って快勝。",
  inning_scores: [
    { inning: 1, score_team: 2, score_opponent: 1 },
    { inning: 2, score_team: 0, score_opponent: 0 },
    { inning: 3, score_team: 3, score_opponent: 0 },
    { inning: 4, score_team: 1, score_opponent: 2 },
    { inning: 5, score_team: 0, score_opponent: 0 },
    { inning: 6, score_team: 2, score_opponent: 0 },
    { inning: 7, score_team: 0, score_opponent: 0 },
  ],
};

const DEMO_LINEUP = [
  { batting_order: 1, position: "中", name: "田中太郎", number: 8 },
  { batting_order: 2, position: "二", name: "佐藤次郎", number: 4 },
  { batting_order: 3, position: "遊", name: "鈴木健", number: 6 },
  { batting_order: 4, position: "一", name: "高橋大輝", number: 3 },
  { batting_order: 5, position: "三", name: "渡辺翔", number: 5 },
  { batting_order: 6, position: "左", name: "伊藤誠", number: 7 },
  { batting_order: 7, position: "右", name: "山田拓", number: 9 },
  { batting_order: 8, position: "捕", name: "中村雄太", number: 2 },
  { batting_order: 9, position: "投", name: "小林直人", number: 1 },
];

const DEMO_BATTING = [
  { name: "田中太郎", number: 8, at_bats: 4, hits: 2, rbis: 1, walks: 0 },
  { name: "佐藤次郎", number: 4, at_bats: 4, hits: 1, rbis: 0, walks: 1 },
  { name: "鈴木健", number: 6, at_bats: 3, hits: 2, rbis: 3, walks: 1 },
  { name: "高橋大輝", number: 3, at_bats: 4, hits: 3, rbis: 2, walks: 0 },
  { name: "渡辺翔", number: 5, at_bats: 3, hits: 1, rbis: 1, walks: 1 },
  { name: "伊藤誠", number: 7, at_bats: 3, hits: 0, rbis: 0, walks: 1 },
  { name: "山田拓", number: 9, at_bats: 3, hits: 1, rbis: 1, walks: 0 },
  { name: "中村雄太", number: 2, at_bats: 3, hits: 1, rbis: 0, walks: 0 },
  { name: "小林直人", number: 1, at_bats: 2, hits: 0, rbis: 0, walks: 1 },
];

const GAME_TYPE_LABEL: Record<GameType, string> = {
  practice: "練習試合",
  tournament: "大会",
  league: "リーグ戦",
};

const RESULT_CONFIG: Record<
  GameResult,
  { label: string; color: string; bg: string }
> = {
  win: { label: "勝利", color: "text-green-700", bg: "bg-green-100" },
  lose: { label: "敗北", color: "text-red-700", bg: "bg-red-100" },
  draw: { label: "引分", color: "text-gray-700", bg: "bg-gray-100" },
};

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const game = DEMO_GAME;
  const resultConfig = game.result ? RESULT_CONFIG[game.result] : null;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/games" className="p-1">
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
          <h2 className="text-base font-bold text-gray-900">試合詳細</h2>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* スコアボード */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="game">
                {GAME_TYPE_LABEL[game.game_type]}
              </Badge>
              <span className="text-xs text-gray-500">{game.game_date}</span>
              {resultConfig && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${resultConfig.bg} ${resultConfig.color}`}
                >
                  {resultConfig.label}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-6 py-4">
              <div className="text-center">
                <div className="text-xs text-gray-500">自チーム</div>
                <div className="text-4xl font-bold text-gray-900">
                  {game.score_team}
                </div>
              </div>
              <div className="text-lg font-bold text-gray-400">-</div>
              <div className="text-center">
                <div className="text-xs text-gray-500">
                  {game.opponent_name}
                </div>
                <div className="text-4xl font-bold text-gray-900">
                  {game.score_opponent}
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-gray-400">
              {game.venue}
            </div>
          </CardContent>
        </Card>

        {/* イニングスコア */}
        {game.inning_scores && game.inning_scores.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">イニングスコア</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">
                        &nbsp;
                      </th>
                      {game.inning_scores.map((is) => (
                        <th
                          key={is.inning}
                          className="px-2 py-1.5 font-medium text-gray-500"
                        >
                          {is.inning}
                        </th>
                      ))}
                      <th className="px-2 py-1.5 font-bold text-gray-700">
                        計
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-1.5 text-left font-medium text-gray-700">
                        自チーム
                      </td>
                      {game.inning_scores.map((is) => (
                        <td key={is.inning} className="px-2 py-1.5">
                          {is.score_team}
                        </td>
                      ))}
                      <td className="px-2 py-1.5 font-bold">
                        {game.score_team}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1.5 text-left font-medium text-gray-700">
                        {game.opponent_name}
                      </td>
                      {game.inning_scores.map((is) => (
                        <td key={is.inning} className="px-2 py-1.5">
                          {is.score_opponent}
                        </td>
                      ))}
                      <td className="px-2 py-1.5 font-bold">
                        {game.score_opponent}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* スタメン */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">スタメン・打順</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-2 py-1.5 text-left font-medium text-gray-500">
                    打順
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium text-gray-500">
                    守備
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium text-gray-500">
                    背番号
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium text-gray-500">
                    選手名
                  </th>
                </tr>
              </thead>
              <tbody>
                {DEMO_LINEUP.map((p) => (
                  <tr key={p.batting_order} className="border-b border-gray-50">
                    <td className="px-2 py-1.5 font-bold text-gray-700">
                      {p.batting_order}
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">
                        {p.position}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-gray-600">
                      #{p.number}
                    </td>
                    <td className="px-2 py-1.5 font-medium text-gray-900">
                      {p.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* 個人成績サマリー */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">打撃成績</CardTitle>
              <Link href={`/games/${gameId}/stats`}>
                <Button variant="ghost" size="sm" className="text-xs">
                  詳細入力 →
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">
                      選手
                    </th>
                    <th className="px-2 py-1.5 text-center font-medium text-gray-500">
                      打数
                    </th>
                    <th className="px-2 py-1.5 text-center font-medium text-gray-500">
                      安打
                    </th>
                    <th className="px-2 py-1.5 text-center font-medium text-gray-500">
                      打点
                    </th>
                    <th className="px-2 py-1.5 text-center font-medium text-gray-500">
                      四球
                    </th>
                    <th className="px-2 py-1.5 text-center font-medium text-gray-500">
                      打率
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_BATTING.map((p) => (
                    <tr key={p.number} className="border-b border-gray-50">
                      <td className="px-2 py-1.5">
                        <span className="font-medium text-gray-900">
                          {p.name}
                        </span>
                        <span className="ml-1 text-gray-400">#{p.number}</span>
                      </td>
                      <td className="px-2 py-1.5 text-center">{p.at_bats}</td>
                      <td className="px-2 py-1.5 text-center font-medium">
                        {p.hits}
                      </td>
                      <td className="px-2 py-1.5 text-center">{p.rbis}</td>
                      <td className="px-2 py-1.5 text-center">{p.walks}</td>
                      <td className="px-2 py-1.5 text-center font-medium text-green-700">
                        {p.at_bats > 0
                          ? (p.hits / p.at_bats).toFixed(3)
                          : "---"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* メモ */}
        {game.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">メモ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">{game.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* アクションボタン */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/games/${gameId}/scorebook`}>
            <Button variant="outline" className="w-full text-sm">
              スコアブック
            </Button>
          </Link>
          <Link href={`/games/${gameId}/stats`}>
            <Button variant="outline" className="w-full text-sm">
              成績入力・編集
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
