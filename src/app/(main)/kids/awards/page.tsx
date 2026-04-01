"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, EmptyState } from "@/components/ui/error-display";
import { PlayerAvatar } from "@/components/features/PlayerAvatar";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { getAwards } from "@/lib/supabase/queries/kids";
import type { Award, AwardCategory } from "@/types";

const AWARD_CONFIG: Record<AwardCategory, { label: string; icon: string; color: string }> = {
  mvp: { label: "MVP", icon: "🏆", color: "bg-yellow-50 border-yellow-300" },
  effort: { label: "がんばったで賞", icon: "⭐", color: "bg-blue-50 border-blue-300" },
  nice_play: { label: "ナイスプレー賞", icon: "✨", color: "bg-purple-50 border-purple-300" },
};

export default function AwardsPage() {
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { canCreateAwards } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<AwardCategory | "all">("all");

  const loadData = useCallback(async () => {
    if (!currentTeam) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAwards(currentTeam.id);
      setAwards(data);
    } catch {
      setError("表彰データの取得に失敗しました");
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

  const filtered =
    filterCategory === "all"
      ? awards
      : awards.filter((a) => a.category === filterCategory);

  // 日付でグループ化
  const grouped: Record<string, Award[]> = filtered.reduce<Record<string, Award[]>>((acc, award) => {
    const date = award.awarded_at;
    if (!acc[date]) acc[date] = [];
    acc[date].push(award);
    return acc;
  }, {});

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">
          今週のMVP・がんばったで賞
        </h2>
        {canCreateAwards() && (
          <Link href="/kids/awards/create">
            <Button size="sm">表彰する</Button>
          </Link>
        )}
      </div>

      {/* カテゴリフィルター */}
      <div className="flex gap-1.5 bg-white px-4 py-2 border-b border-gray-100">
        <button
          onClick={() => setFilterCategory("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filterCategory === "all"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          すべて
        </button>
        {(Object.keys(AWARD_CONFIG) as AwardCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filterCategory === cat
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {AWARD_CONFIG[cat].icon} {AWARD_CONFIG[cat].label}
          </button>
        ))}
      </div>

      {/* 表彰一覧 */}
      <div className="space-y-4 p-4">
        {filtered.length === 0 ? (
          <EmptyState
            title="まだ表彰がありません"
            description="「表彰する」ボタンから選手を表彰しよう"
          />
        ) : (
          (Object.entries(grouped) as [string, Award[]][]).map(([date, dateAwards]) => (
            <div key={date}>
              <div className="mb-2 text-xs font-medium text-gray-500">
                {new Date(date).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="space-y-2">
                {dateAwards.map((award) => {
                  const config = AWARD_CONFIG[award.category];
                  return (
                    <Card
                      key={award.id}
                      className={`border-2 ${config.color}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            {award.player ? (
                              <PlayerAvatar player={award.player} size="lg" />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                                {config.icon}
                              </div>
                            )}
                            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm shadow-sm">
                              {config.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500">
                                {config.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-sm font-bold text-gray-900">
                                {award.player?.name}
                              </span>
                              {award.player?.number !== undefined && (
                                <span className="text-xs text-gray-400">
                                  #{award.player.number}
                                </span>
                              )}
                            </div>
                            {award.comment && (
                              <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                                {award.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
