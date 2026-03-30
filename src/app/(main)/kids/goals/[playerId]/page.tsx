"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { getPlayerGoals, createPlayerGoal } from "@/lib/supabase/queries/kids";
import type { PlayerGoal, GoalStatus } from "@/types";

// デモデータ
const DEMO_GOALS: PlayerGoal[] = [
  { id: "g1", player_id: "p1", team_id: "t1", title: "打率を.350にする", target_metric: "batting_avg", target_value: 350, current_value: 315, deadline: "2026-06-30", status: "active", created_at: "2026-01-15", updated_at: "2026-03-20" },
  { id: "g2", player_id: "p1", team_id: "t1", title: "遠投50mを超える", target_metric: "throw_distance", target_value: 50, current_value: 45, deadline: "2026-08-31", status: "active", created_at: "2026-02-01", updated_at: "2026-03-15" },
  { id: "g3", player_id: "p1", team_id: "t1", title: "盗塁を10個決める", target_metric: "stolen_bases", target_value: 10, current_value: 8, deadline: "2026-12-31", status: "active", created_at: "2026-01-01", updated_at: "2026-03-10" },
  { id: "g4", player_id: "p1", team_id: "t1", title: "ベースランを8秒以内にする", target_metric: "base_run", target_value: 80, current_value: 80, deadline: "2026-03-31", status: "achieved", created_at: "2025-10-01", updated_at: "2026-02-28" },
  { id: "g5", player_id: "p1", team_id: "t1", title: "素振り100回/日を1ヶ月続ける", target_metric: "practice", target_value: 30, current_value: 22, deadline: "2025-12-31", status: "expired", created_at: "2025-12-01", updated_at: "2025-12-31" },
];

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string }> = {
  active: { label: "チャレンジ中", color: "bg-blue-100 text-blue-800" },
  achieved: { label: "達成！", color: "bg-green-100 text-green-800" },
  expired: { label: "期限切れ", color: "bg-gray-100 text-gray-500" },
};

export default function GoalsPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [goals, setGoals] = useState<PlayerGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getPlayerGoals(playerId);
        setGoals(data.length > 0 ? data : DEMO_GOALS);
      } catch {
        setGoals(DEMO_GOALS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [playerId]);

  const activeGoals = goals.filter((g) => g.status === "active");
  const achievedGoals = goals.filter((g) => g.status === "achieved");
  const expiredGoals = goals.filter((g) => g.status === "expired");

  const handleCreate = async () => {
    if (!newTitle || !newTarget) return;
    try {
      const goal = await createPlayerGoal({
        player_id: playerId,
        team_id: "t1",
        title: newTitle,
        target_value: parseInt(newTarget),
        deadline: newDeadline || undefined,
      });
      setGoals((prev) => [goal, ...prev]);
    } catch {
      setGoals((prev) => [
        {
          id: `g-${Date.now()}`,
          player_id: playerId,
          team_id: "t1",
          title: newTitle,
          target_value: parseInt(newTarget),
          current_value: 0,
          deadline: newDeadline || undefined,
          status: "active" as GoalStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setNewTitle("");
    setNewTarget("");
    setNewDeadline("");
    setShowForm(false);
  };

  if (loading) return <Loading />;

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
          <Button onClick={handleCreate} className="w-full" disabled={!newTitle || !newTarget}>
            目標を追加
          </Button>
        </div>
      )}

      <div className="space-y-4 p-4">
        {/* アクティブ目標 */}
        {activeGoals.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-bold text-gray-900">
              チャレンジ中の目標
            </h3>
            <div className="space-y-3">
              {activeGoals.map((goal) => {
                const progress = Math.min(
                  (goal.current_value / goal.target_value) * 100,
                  100
                );
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
      </div>
    </div>
  );
}
