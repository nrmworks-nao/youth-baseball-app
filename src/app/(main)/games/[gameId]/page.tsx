"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { getGame, getGameLineups, getGameStats } from "@/lib/supabase/queries/games";
import type { Game, GameLineup, PlayerGameStats, GameType, GameResult, InningScore } from "@/types";

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
  const { currentMembership } = useCurrentTeam();
  const { hasPermission } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);
  const [game, setGame] = useState<Game | null>(null);
  const [lineups, setLineups] = useState<GameLineup[]>([]);
  const [stats, setStats] = useState<PlayerGameStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canEdit = hasPermission(["director", "vice_president", "coach"]);

  useEffect(() => {
    const load = async () => {
      try {
        const [gameData, lineupData, statsData] = await Promise.all([
          getGame(gameId),
          getGameLineups(gameId),
          getGameStats(gameId),
        ]);
        setGame(gameData);
        setLineups(lineupData);
        setStats(statsData);
      } catch {
        setError("試合データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [gameId]);

  if (isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;
  if (!game) return <ErrorDisplay message="試合が見つかりません" />;

  const resultConfig = game.result ? RESULT_CONFIG[game.result] : null;

  // lineups から先発/途中出場を分離
  const starters = lineups.filter((l) => l.is_starter).sort((a, b) => (a.batting_order ?? 99) - (b.batting_order ?? 99));
  const substitutes = lineups.filter((l) => !l.is_starter);

  // 投手成績のある選手
  const pitcherStats = stats.filter((s) => s.innings_pitched > 0);

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
                  {game.score_team ?? "-"}
                </div>
              </div>
              <div className="text-lg font-bold text-gray-400">-</div>
              <div className="text-center">
                <div className="text-xs text-gray-500">
                  {game.opponent_name}
                </div>
                <div className="text-4xl font-bold text-gray-900">
                  {game.score_opponent ?? "-"}
                </div>
              </div>
            </div>

            {game.venue && (
              <div className="text-center text-xs text-gray-400">
                {game.venue}
              </div>
            )}

            {/* イニングスコア */}
            {game.inning_scores && game.inning_scores.length > 0 && (
              <div className="mt-4 overflow-x-auto border-t border-gray-100 pt-3">
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">
                        &nbsp;
                      </th>
                      {game.inning_scores.map((is: InningScore) => (
                        <th
                          key={is.inning}
                          className="min-w-[24px] px-1 py-1.5 font-medium text-gray-500"
                        >
                          {is.inning}
                        </th>
                      ))}
                      <th className="min-w-[32px] px-2 py-1.5 font-bold text-gray-700">
                        計
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="whitespace-nowrap px-2 py-1.5 text-left text-xs font-medium text-gray-700">
                        自チーム
                      </td>
                      {game.inning_scores.map((is: InningScore) => (
                        <td key={is.inning} className="px-1 py-1.5 text-gray-900">
                          {is.score_team}
                        </td>
                      ))}
                      <td className="px-2 py-1.5 font-bold text-gray-900">
                        {game.score_team ?? game.inning_scores.reduce((sum: number, is: InningScore) => sum + is.score_team, 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap px-2 py-1.5 text-left text-xs font-medium text-gray-700">
                        {game.opponent_name}
                      </td>
                      {game.inning_scores.map((is: InningScore) => (
                        <td key={is.inning} className="px-1 py-1.5 text-gray-900">
                          {is.score_opponent}
                        </td>
                      ))}
                      <td className="px-2 py-1.5 font-bold text-gray-900">
                        {game.score_opponent ?? game.inning_scores.reduce((sum: number, is: InningScore) => sum + is.score_opponent, 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* スタメン */}
        {starters.length > 0 && (
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
                  {starters.map((p) => {
                    const playerData = (p as unknown as { players: { id: string; name: string; number: number; position: string } }).players;
                    return (
                      <tr key={p.id} className="border-b border-gray-50">
                        <td className="px-2 py-1.5 font-bold text-gray-700">
                          {p.batting_order ?? "-"}
                        </td>
                        <td className="px-2 py-1.5">
                          {p.position && (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">
                              {p.position}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-gray-600">
                          #{playerData?.number ?? "-"}
                        </td>
                        <td className="px-2 py-1.5 font-medium text-gray-900">
                          {playerData?.name ?? "不明"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* 途中出場 */}
        {substitutes.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">途中出場</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
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
                  {substitutes.map((p) => {
                    const playerData = (p as unknown as { players: { id: string; name: string; number: number; position: string } }).players;
                    return (
                      <tr key={p.id} className="border-b border-gray-50">
                        <td className="px-2 py-1.5">
                          {p.position && (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-700">
                              {p.position}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-gray-600">
                          #{playerData?.number ?? "-"}
                        </td>
                        <td className="px-2 py-1.5 font-medium text-gray-900">
                          {playerData?.name ?? "不明"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* 打撃成績サマリー */}
        {stats.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">打撃成績</CardTitle>
                {canEdit && (
                  <Link href={`/games/${gameId}/stats`}>
                    <Button variant="ghost" size="sm" className="text-xs">
                      詳細入力 →
                    </Button>
                  </Link>
                )}
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
                    {stats.map((s) => {
                      const playerData = (s as unknown as { players: { id: string; name: string; number: number } }).players;
                      return (
                        <tr key={s.id} className="border-b border-gray-50">
                          <td className="px-2 py-1.5">
                            <span className="font-medium text-gray-900">
                              {playerData?.name ?? "不明"}
                            </span>
                            <span className="ml-1 text-gray-400">#{playerData?.number ?? "-"}</span>
                          </td>
                          <td className="px-2 py-1.5 text-center">{s.at_bats}</td>
                          <td className="px-2 py-1.5 text-center font-medium">
                            {s.hits}
                          </td>
                          <td className="px-2 py-1.5 text-center">{s.rbis}</td>
                          <td className="px-2 py-1.5 text-center">{s.walks}</td>
                          <td className="px-2 py-1.5 text-center font-medium text-green-700">
                            {s.at_bats > 0
                              ? (s.hits / s.at_bats).toFixed(3)
                              : "---"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 投手成績 */}
        {pitcherStats.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">投手成績</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">投手</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-500">投球回</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-500">被安打</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-500">奪三振</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-500">四球</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-500">自責点</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pitcherStats.map((s) => {
                      const playerData = (s as unknown as { players: { id: string; name: string; number: number } }).players;
                      return (
                        <tr key={s.id} className="border-b border-gray-50">
                          <td className="px-2 py-1.5 font-medium text-gray-900">
                            {playerData?.name ?? "不明"}
                            {s.is_winning_pitcher && <span className="ml-1 text-green-600">(勝)</span>}
                            {s.is_losing_pitcher && <span className="ml-1 text-red-600">(敗)</span>}
                          </td>
                          <td className="px-2 py-1.5 text-center">{s.innings_pitched}</td>
                          <td className="px-2 py-1.5 text-center">{s.hits_allowed}</td>
                          <td className="px-2 py-1.5 text-center">{s.strikeouts_pitched}</td>
                          <td className="px-2 py-1.5 text-center">{s.walks_allowed}</td>
                          <td className="px-2 py-1.5 text-center">{s.earned_runs}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 守備成績 */}
        {stats.some((s) => s.putouts > 0 || s.assists > 0 || s.errors > 0) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">守備成績</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">選手</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-500">刺殺</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-500">補殺</th>
                      <th className="px-2 py-1.5 text-center font-medium text-gray-500">失策</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.filter((s) => s.putouts > 0 || s.assists > 0 || s.errors > 0).map((s) => {
                      const playerData = (s as unknown as { players: { id: string; name: string; number: number } }).players;
                      return (
                        <tr key={s.id} className="border-b border-gray-50">
                          <td className="px-2 py-1.5 font-medium text-gray-900">
                            {playerData?.name ?? "不明"}
                          </td>
                          <td className="px-2 py-1.5 text-center">{s.putouts}</td>
                          <td className="px-2 py-1.5 text-center">{s.assists}</td>
                          <td className="px-2 py-1.5 text-center">{s.errors}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

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
          {canEdit && (
            <Link href={`/games/${gameId}/stats`}>
              <Button variant="outline" className="w-full text-sm">
                成績入力・編集
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
