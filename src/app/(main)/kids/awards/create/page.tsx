"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, EmptyState } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { createAward, getAwards } from "@/lib/supabase/queries/kids";
import { getPlayers } from "@/lib/supabase/queries/players";
import { supabase } from "@/lib/supabase/client";
import type { AwardCategory, Player, Award } from "@/types";

const AWARD_CATEGORIES: { key: AwardCategory; label: string; icon: string; description: string }[] = [
  { key: "mvp", label: "MVP", icon: "🏆", description: "今週最も活躍した選手" },
  { key: "effort", label: "がんばったで賞", icon: "⭐", description: "努力を称えたい選手" },
  { key: "nice_play", label: "ナイスプレー賞", icon: "✨", description: "素晴らしいプレーをした選手" },
];

interface PlayerWithLastAward extends Player {
  lastAwardDays: number | null;
}

export default function CreateAwardPage() {
  const router = useRouter();
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { hasPermission } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);
  const [category, setCategory] = useState<AwardCategory | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [players, setPlayers] = useState<PlayerWithLastAward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!currentTeam) return;
    setIsLoading(true);
    setError(null);
    try {
      const [playersData, awardsData] = await Promise.all([
        getPlayers(currentTeam.id),
        getAwards(currentTeam.id),
      ]);

      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // 直近1ヶ月の受賞者を特定
      const recentAwards = awardsData.filter(
        (a) => new Date(a.awarded_at) >= oneMonthAgo
      );
      const lastAwardMap = new Map<string, Date>();
      for (const a of awardsData) {
        const d = new Date(a.awarded_at);
        const existing = lastAwardMap.get(a.player_id);
        if (!existing || d > existing) {
          lastAwardMap.set(a.player_id, d);
        }
      }

      const playersWithAwards: PlayerWithLastAward[] = playersData
        .filter((p) => p.is_active)
        .map((p) => {
          const lastDate = lastAwardMap.get(p.id);
          const lastAwardDays = lastDate
            ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
            : null;
          return { ...p, lastAwardDays };
        });

      setPlayers(playersWithAwards);
    } catch {
      setError("データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (teamLoading || !currentTeam) return;
    loadData();
  }, [currentTeam, teamLoading, loadData]);

  // 未受賞者を優先表示（最後の表彰から日数が多い順、または未受賞者）
  const suggestedPlayers = players.filter(
    (p) => p.lastAwardDays === null || p.lastAwardDays >= 30
  );

  const handleSubmit = async () => {
    if (!category || !selectedPlayerId || !currentTeam) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await createAward({
        team_id: currentTeam.id,
        player_id: selectedPlayerId,
        category,
        comment: comment || undefined,
        awarded_at: new Date().toISOString().split("T")[0],
        created_by: user?.id ?? "",
      });
      router.push("/kids/awards");
    } catch {
      setError("表彰の作成に失敗しました");
      setSubmitting(false);
    }
  };

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (error && players.length === 0) return <ErrorDisplay message={error} onRetry={loadData} />;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">表彰作成</h2>
        <p className="text-xs text-gray-500">サイト管理者のみ作成できます</p>
      </div>

      <div className="space-y-4 p-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-center text-xs text-red-700">
            {error}
          </div>
        )}

        {/* カテゴリ選択 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            カテゴリ
          </label>
          <div className="grid grid-cols-3 gap-2">
            {AWARD_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`rounded-xl border-2 p-3 text-center transition-all ${
                  category === cat.key
                    ? "border-green-500 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="text-2xl">{cat.icon}</div>
                <div className="mt-1 text-xs font-bold text-gray-900">
                  {cat.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 未受賞者の提案 */}
        {suggestedPlayers.length > 0 && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">💡</span>
              <span className="text-xs font-bold text-blue-800">
                最近表彰されていない選手
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestedPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedPlayerId === p.id
                      ? "bg-blue-600 text-white"
                      : "bg-white text-blue-700 border border-blue-200"
                  }`}
                >
                  {p.name}
                  {p.lastAwardDays !== null ? `（${p.lastAwardDays}日前）` : "（未受賞）"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 選手選択 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            選手を選ぶ
          </label>
          {players.length === 0 ? (
            <EmptyState title="選手が登録されていません" />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayerId(player.id)}
                  className={`rounded-lg border-2 p-2 text-center transition-all ${
                    selectedPlayerId === player.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex h-8 w-8 mx-auto items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                    {player.number ?? "?"}
                  </div>
                  <div className="mt-1 text-xs font-medium text-gray-900 truncate">
                    {player.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* コメント */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            コメント
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="表彰のコメントを入力..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </div>

        {/* 送信 */}
        <Button
          onClick={handleSubmit}
          disabled={!category || !selectedPlayerId || submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? "表彰を作成中..." : "表彰する"}
        </Button>
      </div>
    </div>
  );
}
