"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { getMilestones, createMilestone } from "@/lib/supabase/queries/kids";
import type { Milestone } from "@/types";

// デモデータ
const DEMO_MILESTONES: Milestone[] = [
  { id: "m1", player_id: "p1", team_id: "t1", milestone_type: "first_hit", title: "初ヒット！", description: "記念すべき初ヒットを打ちました！", milestone_date: "2024-05-12", is_auto: true, created_at: "2024-05-12" },
  { id: "m2", player_id: "p1", team_id: "t1", milestone_type: "first_rbi", title: "初打点！", description: "初めての打点を記録しました！", milestone_date: "2024-06-08", is_auto: true, created_at: "2024-06-08" },
  { id: "m3", player_id: "p1", team_id: "t1", milestone_type: "badge_earned", title: "バッジ獲得: 皆勤賞", description: "9月の練習に全て参加しました！", milestone_date: "2024-09-30", is_auto: true, created_at: "2024-09-30" },
  { id: "m4", player_id: "p1", team_id: "t1", milestone_type: "height_milestone", title: "身長140cm突破！", description: "身長が140cmを超えました！", milestone_date: "2024-10-15", is_auto: true, created_at: "2024-10-15" },
  { id: "m5", player_id: "p1", team_id: "t1", milestone_type: "personal_best", title: "打率自己ベスト更新 .345", description: "通算打率が.345に上がりました！", milestone_date: "2024-11-03", is_auto: true, created_at: "2024-11-03" },
  { id: "m6", player_id: "p1", team_id: "t1", milestone_type: "manual", title: "初めて自主練した日", description: "お父さんと公園でバッティング練習をしました", milestone_date: "2024-07-20", is_auto: false, created_at: "2024-07-20" },
  { id: "m7", player_id: "p1", team_id: "t1", milestone_type: "award_received", title: "MVP受賞！", description: "11月の月間MVPに選ばれました！", milestone_date: "2024-11-30", is_auto: true, created_at: "2024-11-30" },
  { id: "m8", player_id: "p1", team_id: "t1", milestone_type: "anniversary", title: "入団1年目！", description: "チームに入って1年が経ちました！", milestone_date: "2025-04-01", is_auto: true, created_at: "2025-04-01" },
  { id: "m9", player_id: "p1", team_id: "t1", milestone_type: "first_steal", title: "初盗塁！", description: "初めての盗塁に成功しました！", milestone_date: "2025-05-18", is_auto: true, created_at: "2025-05-18" },
];

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
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getMilestones(playerId);
        setMilestones(data.length > 0 ? data : DEMO_MILESTONES);
      } catch {
        setMilestones(DEMO_MILESTONES);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [playerId]);

  const sortedMilestones = [...milestones].sort(
    (a, b) =>
      new Date(b.milestone_date).getTime() -
      new Date(a.milestone_date).getTime()
  );

  const handleAddMilestone = async () => {
    if (!newTitle || !newDate) return;
    try {
      const milestone = await createMilestone({
        player_id: playerId,
        team_id: "t1",
        milestone_type: "manual",
        title: newTitle,
        description: newDescription || undefined,
        milestone_date: newDate,
        is_auto: false,
      });
      setMilestones((prev) => [milestone, ...prev]);
    } catch {
      // デモモードではローカルに追加
      setMilestones((prev) => [
        {
          id: `m-${Date.now()}`,
          player_id: playerId,
          team_id: "t1",
          milestone_type: "manual",
          title: newTitle,
          description: newDescription || undefined,
          milestone_date: newDate,
          is_auto: false,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setNewTitle("");
    setNewDescription("");
    setNewDate("");
    setShowAddForm(false);
  };

  if (loading) return <Loading />;

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
          <Button onClick={handleAddMilestone} className="w-full" disabled={!newTitle || !newDate}>
            マイルストーンを追加
          </Button>
        </div>
      )}

      {/* タイムライン */}
      <div className="p-4">
        <div className="relative">
          {/* 縦線 */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-4">
            {sortedMilestones.map((milestone, index) => {
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
      </div>
    </div>
  );
}
