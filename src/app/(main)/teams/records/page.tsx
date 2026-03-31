"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { getHeadToHeadRecords } from "@/lib/supabase/queries/inter-team";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { HeadToHeadRecord } from "@/types";

const RESULT_CONFIG: Record<string, { label: string; variant: "primary" | "danger" | "default" }> = {
  win: { label: "勝", variant: "primary" },
  lose: { label: "負", variant: "danger" },
  draw: { label: "分", variant: "default" },
};

export default function TeamRecordsPage() {
  const { currentTeam, isLoading: teamLoading } = useCurrentTeam();
  const [records, setRecords] = useState<HeadToHeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentTeam) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getHeadToHeadRecords(currentTeam.id);
      setRecords(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (!teamLoading && currentTeam) {
      fetchData();
    }
  }, [teamLoading, currentTeam, fetchData]);

  if (teamLoading || isLoading) {
    return <Loading text="対戦成績を読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  if (!currentTeam) {
    return <ErrorDisplay title="チーム未選択" message="チームを選択してください。" />;
  }

  // チーム別集計
  const opponentStats: Record<string, { wins: number; losses: number; draws: number }> = {};
  for (const r of records) {
    if (!opponentStats[r.opponent_name]) {
      opponentStats[r.opponent_name] = { wins: 0, losses: 0, draws: 0 };
    }
    if (r.result === "win") opponentStats[r.opponent_name].wins++;
    else if (r.result === "lose") opponentStats[r.opponent_name].losses++;
    else opponentStats[r.opponent_name].draws++;
  }

  const totalWins = Object.values(opponentStats).reduce((s, r) => s + r.wins, 0);
  const totalLosses = Object.values(opponentStats).reduce((s, r) => s + r.losses, 0);
  const totalDraws = Object.values(opponentStats).reduce((s, r) => s + r.draws, 0);

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">対戦成績</h2>
      </div>

      <div className="space-y-4 p-4">
        {records.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">対戦記録はありません</p>
        ) : (
          <>
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
                  {Object.entries(opponentStats).map(([opponent, stat]) => (
                    <div key={opponent} className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50">
                      <span className="text-sm font-medium text-gray-900">{opponent}</span>
                      <span className="text-sm text-gray-600">
                        <span className="text-green-600">{stat.wins}勝</span>
                        {" "}
                        <span className="text-red-600">{stat.losses}敗</span>
                        {" "}
                        <span className="text-gray-500">{stat.draws}分</span>
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
                  {records.slice(0, 10).map((game) => {
                    const cfg = RESULT_CONFIG[game.result] ?? RESULT_CONFIG.draw;
                    return (
                      <div key={game.id} className="flex items-center justify-between rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          <span className="text-sm text-gray-900">vs {game.opponent_name}</span>
                        </div>
                        <div className="text-right">
                          {game.score_team != null && game.score_opponent != null && (
                            <p className="text-sm font-bold text-gray-900">
                              {game.score_team} - {game.score_opponent}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400">{game.game_date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
