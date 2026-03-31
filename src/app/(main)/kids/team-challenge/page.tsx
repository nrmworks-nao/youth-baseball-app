"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, EmptyState } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { TeamChallengeBar } from "@/components/features/kids/TeamChallengeBar";
import { getTeamChallenges, createTeamChallenge } from "@/lib/supabase/queries/kids";
import type { TeamChallenge } from "@/types";

export default function TeamChallengePage() {
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { hasPermission } = usePermission(currentMembership?.permission_group ?? null);
  const [challenges, setChallenges] = useState<TeamChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentTeam) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTeamChallenges(currentTeam.id);
      setChallenges(data);
    } catch {
      setError("チャレンジデータの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (teamLoading || !currentTeam) return;
    loadData();
  }, [currentTeam, teamLoading, loadData]);

  const activeChallenges = challenges.filter(
    (c) => c.current_value < c.target_value
  );
  const completedChallenges = challenges.filter(
    (c) => c.current_value >= c.target_value
  );

  const canCreate = hasPermission(["team_admin", "vice_president", "manager"]);

  const handleCreate = async () => {
    if (!newTitle || !newTarget || !newEndDate || !currentTeam) return;
    setSubmitting(true);
    try {
      const challenge = await createTeamChallenge({
        team_id: currentTeam.id,
        title: newTitle,
        description: newDescription || undefined,
        target_value: parseInt(newTarget),
        start_date: new Date().toISOString().split("T")[0],
        end_date: newEndDate,
      });
      setChallenges((prev) => [challenge, ...prev]);
    } catch {
      setError("チャレンジの作成に失敗しました");
    }
    setSubmitting(false);
    setNewTitle("");
    setNewDescription("");
    setNewTarget("");
    setNewEndDate("");
    setShowForm(false);
  };

  if (teamLoading || loading) return <Loading />;
  if (error && challenges.length === 0) return <ErrorDisplay message={error} onRetry={loadData} />;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">チームチャレンジ</h2>
          <p className="text-xs text-gray-500">
            みんなで達成しよう！（最大2つ）
          </p>
        </div>
        {canCreate && activeChallenges.length < 2 && (
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "キャンセル" : "作成"}
          </Button>
        )}
      </div>

      {error && (
        <div className="mx-4 mt-2 rounded-lg bg-red-50 border border-red-200 p-2 text-center text-xs text-red-700">
          {error}
        </div>
      )}

      {/* 作成フォーム */}
      {showForm && (
        <div className="border-b border-gray-200 bg-blue-50 p-4 space-y-3">
          <p className="text-xs text-blue-700 font-medium">
            team_admin のみ作成できます
          </p>
          <input
            type="text"
            placeholder="チャレンジタイトル"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <textarea
            placeholder="説明（任意）"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="目標値"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              type="date"
              placeholder="終了日"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <Button onClick={handleCreate} className="w-full" disabled={!newTitle || !newTarget || !newEndDate || submitting}>
            {submitting ? "作成中..." : "チャレンジを作成"}
          </Button>
        </div>
      )}

      <div className="space-y-4 p-4">
        {/* アクティブチャレンジ */}
        {activeChallenges.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-bold text-gray-900">
              チャレンジ中
            </h3>
            <div className="space-y-3">
              {activeChallenges.map((challenge) => (
                <TeamChallengeBar key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        )}

        {activeChallenges.length === 0 && completedChallenges.length === 0 && (
          <EmptyState
            title="まだチャレンジがありません"
            description="新しいチャレンジを作成してチームで挑戦しよう！"
          />
        )}

        {activeChallenges.length === 0 && completedChallenges.length > 0 && (
          <div className="rounded-xl bg-gray-50 p-8 text-center">
            <span className="text-3xl">🎯</span>
            <p className="mt-2 text-sm text-gray-500">
              現在チャレンジはありません
            </p>
            <p className="text-xs text-gray-400">
              新しいチャレンジを作成しよう！
            </p>
          </div>
        )}

        {/* 達成済み */}
        {completedChallenges.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-bold text-gray-900">
              達成済みチャレンジ
            </h3>
            <div className="space-y-3">
              {completedChallenges.map((challenge) => (
                <TeamChallengeBar key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
