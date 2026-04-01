"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, EmptyState } from "@/components/ui/error-display";
import { PlayerAvatar } from "@/components/features/PlayerAvatar";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { getBestPlays } from "@/lib/supabase/queries/kids";
import type { BestPlay } from "@/types";

export default function BestPlaysPage() {
  const { currentTeam, isLoading: teamLoading } = useCurrentTeam();
  const [plays, setPlays] = useState<BestPlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!currentTeam) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBestPlays(currentTeam.id);
      setPlays(data);
    } catch {
      setError("ベストプレーの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (teamLoading || !currentTeam) return;
    loadData();
  }, [currentTeam, teamLoading, loadData]);

  if (teamLoading || loading) return <Loading />;
  if (error) return <ErrorDisplay message={error} onRetry={loadData} />;

  if (plays.length === 0) {
    return (
      <div className="flex flex-col">
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <h2 className="text-base font-bold text-gray-900">ベストプレー集</h2>
        </div>
        <EmptyState
          title="まだベストプレーがありません"
          description="試合後に自動登録されるか、手動で追加できます"
        />
      </div>
    );
  }

  // 日付でグループ化
  const grouped = plays.reduce<Record<string, BestPlay[]>>((acc, play) => {
    if (!acc[play.play_date]) acc[play.play_date] = [];
    acc[play.play_date].push(play);
    return acc;
  }, {});

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">ベストプレー集</h2>
        <p className="text-xs text-gray-500">
          {plays.length}個のベストプレー
        </p>
      </div>

      <div className="space-y-4 p-4">
        {(Object.entries(grouped) as [string, BestPlay[]][]).map(([date, datePlays]) => (
          <div key={date}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">
                {new Date(date).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              {datePlays[0]?.game && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  vs {(datePlays[0].game as { opponent_name: string }).opponent_name}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {datePlays.map((play) => (
                <Card
                  key={play.id}
                  className="border-l-4 border-l-orange-400 bg-gradient-to-r from-orange-50 to-white"
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* 写真枠 */}
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 text-2xl">
                        {play.photo_url ? (
                          <img
                            src={play.photo_url}
                            alt={play.title}
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          "⚡"
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-gray-900">
                            {play.title}
                          </span>
                          {play.is_auto && (
                            <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">
                              自動
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 flex items-center gap-1.5">
                          {play.player && (
                            <PlayerAvatar player={play.player} size="sm" />
                          )}
                          <span className="text-xs font-medium text-orange-700">
                            {play.player?.name}
                          </span>
                          {play.player?.number !== undefined && (
                            <span className="text-[10px] text-gray-400">
                              #{play.player.number}
                            </span>
                          )}
                        </div>

                        {play.description && (
                          <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                            {play.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
