"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { TeamChallengeBar } from "@/components/features/kids/TeamChallengeBar";
import { getTeamChallenges, createTeamChallenge } from "@/lib/supabase/queries/kids";
import type { TeamChallenge } from "@/types";

// デモデータ
const DEMO_CHALLENGES: TeamChallenge[] = [
  {
    id: "tc1",
    team_id: "t1",
    title: "チーム合計100安打を達成しよう！",
    description: "シーズン中にチーム全体で100本のヒットを打とう",
    target_value: 100,
    current_value: 72,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
  },
  {
    id: "tc2",
    team_id: "t1",
    title: "全員でベースラン記録更新！",
    description: "全メンバーがベースランの自己ベストを更新しよう",
    target_value: 9,
    current_value: 5,
    start_date: "2026-03-01",
    end_date: "2026-06-30",
  },
];

const DEMO_COMPLETED: TeamChallenge[] = [
  {
    id: "tc3",
    team_id: "t1",
    title: "練習参加率90%以上を3ヶ月続けよう",
    description: "チーム全体で高い練習参加率をキープしよう",
    target_value: 3,
    current_value: 3,
    start_date: "2025-10-01",
    end_date: "2025-12-31",
  },
];

export default function TeamChallengePage() {
  const [challenges, setChallenges] = useState<TeamChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getTeamChallenges("t1");
        setChallenges(
          data.length > 0 ? data : [...DEMO_CHALLENGES, ...DEMO_COMPLETED]
        );
      } catch {
        setChallenges([...DEMO_CHALLENGES, ...DEMO_COMPLETED]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeChallenges = challenges.filter(
    (c) => c.current_value < c.target_value
  );
  const completedChallenges = challenges.filter(
    (c) => c.current_value >= c.target_value
  );

  const handleCreate = async () => {
    if (!newTitle || !newTarget || !newEndDate) return;
    try {
      const challenge = await createTeamChallenge({
        team_id: "t1",
        title: newTitle,
        description: newDescription || undefined,
        target_value: parseInt(newTarget),
        start_date: new Date().toISOString().split("T")[0],
        end_date: newEndDate,
      });
      setChallenges((prev) => [challenge, ...prev]);
    } catch {
      setChallenges((prev) => [
        {
          id: `tc-${Date.now()}`,
          team_id: "t1",
          title: newTitle,
          description: newDescription || undefined,
          target_value: parseInt(newTarget),
          current_value: 0,
          start_date: new Date().toISOString().split("T")[0],
          end_date: newEndDate,
        },
        ...prev,
      ]);
    }
    setNewTitle("");
    setNewDescription("");
    setNewTarget("");
    setNewEndDate("");
    setShowForm(false);
  };

  if (loading) return <Loading />;

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
        {activeChallenges.length < 2 && (
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "キャンセル" : "作成"}
          </Button>
        )}
      </div>

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
          <Button onClick={handleCreate} className="w-full" disabled={!newTitle || !newTarget || !newEndDate}>
            チャレンジを作成
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

        {activeChallenges.length === 0 && (
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
