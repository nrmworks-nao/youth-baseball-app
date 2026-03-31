"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, EmptyState } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { getPlayerGoals, createPlayerGoal } from "@/lib/supabase/queries/kids";
import type { PlayerGoal, GoalStatus } from "@/types";

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string }> = {
  active: { label: "チャレンジ中", color: "bg-blue-100 text-blue-800" },
  achieved: { label: "達成！", color: "bg-green-100 text-green-800" },
  expired: { label: "期限切れ", color: "bg-gray-100 text-gray-500" },
};

export default function GoalsPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const { currentTeam, isLoading: teamLoading } = useCurrentTeam();
  const [goals, setGoals] = useState<PlayerGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlayerGoals(playerId);
      setGoals(data);
    } catch {
      setError("目標データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeGoals = goals.filter((g) => g.status === "active");
  const achievedGoals = goals.filter((g) => g.status === "achieved");
  const expiredGoals = goals.filter((g) => g.status === "expired");

  const handleCreate = async () => {
    if (!newTitle || !newTarget || !currentTeam) return;
    setSubmitting(true);
    try {
      const goal = await createPlayerGoal({
        player_id: playerId,
        team_id: currentTeam.id,
        title: newTitle,
        target_value: parseInt(newTarget),
        deadline: newDeadline || undefined,
      });
      setGoals((prev) => [goal, ...prev]);
    } catch {
      setError("目標の追加に失敗しました");
    }
    setSubmitting(false);
    setNewTitle("");
    setNewTarget("");
    setNewDeadline("");
    setShowForm(false);
  };

  if (teamLoading || loading) return <Loading />;
  if (error && goals.length === 0) return <ErrorDisplay message={error} onRetry={loadData} />;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">マイ目標チャレンジ</h2>
          <p className="text-xs text-gray-500">
            アクティブ: {activeGoals.length}/3
          </p>
        </div>
        {activeGoals.length < 3 && (
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "キャンセル" : "目標追加"}
          </Button>
        )}
      </div>

      {error && (
        <div className="mx-4 mt-2 rounded-lg bg-red-50 border border-red-200 p-2 text-center text-xs text-red-700">
          {error}
        </div>
      )}

      {/* 目標作成フォーム */}
      {showForm && (
        <div className="border-b border-gray-200 bg-green-50 p-4 space-y-3">
          <input
            type="text"
            placeholder="目標タイトル（例: 打率を.300にする）"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="目標値（数値）"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
          <input
            type="date"
            placeholder="期限（任意）"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
          <Button onClick={handleCreate} className="w-full" disabled={!newTitle || !newTarget || submitting}>
            {submitting ? "追加中..." : "目標を追加"}
          </Button>
        </div>
      )}

      <div className="space-y-4 p-4">
        {goals.length === 0 ? (
          <EmptyState
            title="まだ目標が設定されていません"
            description="「目標追加」ボタンから新しい目標を設定しよう"
          />
        ) : (
          <>
            {/* アクティブ目標 */}
            {activeGoals.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-bold text-gray-900">
                  チャレンジ中の目標
                </h3>
                <div className="space-y-3">
                  {activeGoals.map((goal) => {
                    const progress = goal.target_value > 0
                      ? Math.min((goal.current_value / goal.target_value) * 100, 100)
                      : 0;
                    return (
                      <Card key={goal.id} className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🎯</span>
                              <span className="text-sm font-bold text-gray-900">
                                {goal.title}
                              </span>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_CONFIG.active.color}`}>
                              {STATUS_CONFIG.active.label}
                            </span>
                          </div>

                          {/* プログレスバー */}
                          <div className="relative h-5 overflow-hidden rounded-full bg-gray-200 mb-1.5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white drop-shadow-sm">
                                {Math.round(progress)}%
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              現在値: {goal.current_value} / 目標: {goal.target_value}
                            </span>
                            {goal.deadline && (
                              <span>
                                期限: {new Date(goal.deadline).toLocaleDateString("ja-JP")}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 達成済み */}
            {achievedGoals.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-bold text-gray-900">達成済み</h3>
                <div className="space-y-2">
                  {achievedGoals.map((goal) => (
                    <Card key={goal.id} className="border-2 border-green-200 bg-green-50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏆</span>
                            <span className="text-sm font-medium text-gray-900">
                              {goal.title}
                            </span>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_CONFIG.achieved.color}`}>
                            達成！
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 期限切れ */}
            {expiredGoals.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-bold text-gray-500">アーカイブ</h3>
                <div className="space-y-2">
                  {expiredGoals.map((goal) => (
                    <Card key={goal.id} className="opacity-60">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">{goal.title}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_CONFIG.expired.color}`}>
                            期限切れ
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
