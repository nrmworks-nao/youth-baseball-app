"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, EmptyState } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { getMilestones, createMilestone } from "@/lib/supabase/queries/kids";
import type { Milestone } from "@/types";

const MILESTONE_ICONS: Record<string, { icon: string; color: string }> = {
  first_hit: { icon: "⚾", color: "bg-yellow-100 border-yellow-300" },
  first_rbi: { icon: "💪", color: "bg-red-100 border-red-300" },
  first_homerun: { icon: "🏠", color: "bg-purple-100 border-purple-300" },
  first_strikeout_pitched: { icon: "🔥", color: "bg-orange-100 border-orange-300" },
  first_complete_game: { icon: "🎯", color: "bg-blue-100 border-blue-300" },
  first_win: { icon: "🏆", color: "bg-amber-100 border-amber-300" },
  first_steal: { icon: "💨", color: "bg-cyan-100 border-cyan-300" },
  personal_best: { icon: "📈", color: "bg-green-100 border-green-300" },
  height_milestone: { icon: "📏", color: "bg-pink-100 border-pink-300" },
  anniversary: { icon: "🎂", color: "bg-indigo-100 border-indigo-300" },
  badge_earned: { icon: "🎖️", color: "bg-amber-100 border-amber-300" },
  award_received: { icon: "🏅", color: "bg-yellow-100 border-yellow-300" },
  manual: { icon: "📝", color: "bg-gray-100 border-gray-300" },
};

export default function TimelinePage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const { currentTeam, isLoading: teamLoading } = useCurrentTeam();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMilestones(playerId);
      setMilestones(data);
    } catch {
      setError("タイムラインの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sortedMilestones = [...milestones].sort(
    (a, b) =>
      new Date(b.milestone_date).getTime() -
      new Date(a.milestone_date).getTime()
  );

  const handleAddMilestone = async () => {
    if (!newTitle || !newDate || !currentTeam) return;
    setSubmitting(true);
    try {
      const milestone = await createMilestone({
        player_id: playerId,
        team_id: currentTeam.id,
        milestone_type: "manual",
        title: newTitle,
        description: newDescription || undefined,
        milestone_date: newDate,
        is_auto: false,
      });
      setMilestones((prev) => [milestone, ...prev]);
    } catch {
      setError("マイルストーンの追加に失敗しました");
    }
    setSubmitting(false);
    setNewTitle("");
    setNewDescription("");
    setNewDate("");
    setShowAddForm(false);
  };

  if (teamLoading || loading) return <Loading />;
  if (error && milestones.length === 0) return <ErrorDisplay message={error} onRetry={loadData} />;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">成長タイムライン</h2>
          <p className="text-xs text-gray-500">{sortedMilestones.length}個のマイルストーン</p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "キャンセル" : "追加"}
        </Button>
      </div>

      {error && (
        <div className="mx-4 mt-2 rounded-lg bg-red-50 border border-red-200 p-2 text-center text-xs text-red-700">
          {error}
        </div>
      )}

      {/* 手動追加フォーム */}
      {showAddForm && (
        <div className="border-b border-gray-200 bg-green-50 p-4 space-y-3">
          <input
            type="text"
            placeholder="タイトル（例: 初めて自主練した日）"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
          <textarea
            placeholder="詳しく書こう（任意）"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
          <Button onClick={handleAddMilestone} className="w-full" disabled={!newTitle || !newDate || submitting}>
            {submitting ? "追加中..." : "マイルストーンを追加"}
          </Button>
        </div>
      )}

      {/* タイムライン */}
      <div className="p-4">
        {sortedMilestones.length === 0 ? (
          <EmptyState
            title="まだマイルストーンがありません"
            description="「追加」ボタンから思い出を記録しよう"
          />
        ) : (
          <div className="relative">
            {/* 縦線 */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-4">
              {sortedMilestones.map((milestone) => {
                const config = MILESTONE_ICONS[milestone.milestone_type] || MILESTONE_ICONS.manual;
                return (
                  <div key={milestone.id} className="relative flex gap-3 pl-0">
                    {/* アイコン */}
                    <div
                      className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 ${config.color}`}
                    >
                      <span className="text-lg">{config.icon}</span>
                    </div>

                    {/* コンテンツ */}
                    <Card className="flex-1">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">
                              {milestone.title}
                            </h4>
                            {milestone.description && (
                              <p className="mt-0.5 text-xs text-gray-600">
                                {milestone.description}
                              </p>
                            )}
                          </div>
                          {!milestone.is_auto && (
                            <span className="flex-shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">
                              手動
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 text-[10px] text-gray-400">
                          {new Date(milestone.milestone_date).toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
