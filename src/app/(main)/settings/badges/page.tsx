"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, EmptyState } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { getBadges, createCustomBadge, updateBadge, awardBadge } from "@/lib/supabase/queries/kids";
import { getPlayers } from "@/lib/supabase/queries/players";
import { getBadgeIcon } from "@/lib/supabase/badges";
import type { BadgeCategory, KidsBadge, Player } from "@/types";

const ICON_COLORS = [
  { label: "赤", value: "#ef4444" },
  { label: "オレンジ", value: "#f97316" },
  { label: "黄", value: "#eab308" },
  { label: "緑", value: "#22c55e" },
  { label: "青", value: "#3b82f6" },
  { label: "紫", value: "#8b5cf6" },
  { label: "ピンク", value: "#ec4899" },
];

const CATEGORIES: { key: BadgeCategory; label: string }[] = [
  { key: "batting", label: "打撃" },
  { key: "pitching", label: "投球" },
  { key: "fielding", label: "守備" },
  { key: "running", label: "走塁" },
  { key: "effort", label: "努力" },
  { key: "special", label: "特別" },
  { key: "custom", label: "カスタム" },
];

export default function BadgeManagementPage() {
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { isAdmin } = usePermission(currentMembership?.permission_group ?? null);

  const [badges, setBadges] = useState<KidsBadge[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // カスタムバッジ作成フォーム
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<BadgeCategory>("custom");
  const [iconColor, setIconColor] = useState("#22c55e");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // バッジ付与
  const [awardingBadgeId, setAwardingBadgeId] = useState<string | null>(null);
  const [awardPlayerId, setAwardPlayerId] = useState<string | null>(null);
  const [awarding, setAwarding] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentTeam) return;
    setIsLoading(true);
    setError(null);
    try {
      const [badgesData, playersData] = await Promise.all([
        getBadges(currentTeam.id),
        getPlayers(currentTeam.id),
      ]);
      setBadges(badgesData);
      setPlayers(playersData.filter((p) => p.is_active));
    } catch {
      setError("バッジデータの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (teamLoading || !currentTeam) return;
    loadData();
  }, [currentTeam, teamLoading, loadData]);

  const handleCreate = async () => {
    if (!name || !description || !currentTeam) return;
    setSubmitting(true);
    try {
      const newBadge = await createCustomBadge({
        team_id: currentTeam.id,
        name,
        description,
        category,
        icon_color: iconColor,
      });
      setBadges((prev) => [...prev, newBadge]);
      setSuccess(true);
      setName("");
      setDescription("");
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("バッジの作成に失敗しました");
    }
    setSubmitting(false);
  };

  const handleToggleActive = async (badge: KidsBadge) => {
    try {
      const updated = await updateBadge(badge.id, { is_active: !badge.is_active } as Partial<KidsBadge>);
      setBadges((prev) => prev.map((b) => (b.id === badge.id ? updated : b)));
    } catch {
      setError("バッジの更新に失敗しました");
    }
  };

  const handleAwardBadge = async () => {
    if (!awardingBadgeId || !awardPlayerId || !currentTeam) return;
    setAwarding(true);
    try {
      await awardBadge({
        team_id: currentTeam.id,
        player_id: awardPlayerId,
        badge_id: awardingBadgeId,
      });
      setAwardingBadgeId(null);
      setAwardPlayerId(null);
      // TODO: LINE通知
    } catch {
      setError("バッジの付与に失敗しました");
    }
    setAwarding(false);
  };

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (error && badges.length === 0) return <ErrorDisplay message={error} onRetry={loadData} />;

  const presetBadges = badges.filter((b) => b.is_preset);
  const customBadges = badges.filter((b) => !b.is_preset);

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">バッジ管理</h2>
        <p className="text-xs text-gray-500">team_admin のみアクセス可能</p>
      </div>

      <div className="space-y-4 p-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-center text-xs text-red-700">
            {error}
          </div>
        )}

        {/* カスタムバッジ作成 */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">カスタムバッジ作成</h3>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                バッジ名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: チームワーク賞"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                獲得条件の説明
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例: チームメイトを助けるプレーをした"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                カテゴリ
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      category === cat.key
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                アイコン色
              </label>
              <div className="flex gap-2">
                {ICON_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setIconColor(c.value)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      iconColor === c.value
                        ? "border-gray-800 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* プレビュー */}
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500 mb-2">プレビュー</div>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm"
                  style={{ boxShadow: `0 0 12px ${iconColor}40` }}
                >
                  {getBadgeIcon(category)}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {name || "バッジ名"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {description || "獲得条件"}
                  </div>
                </div>
              </div>
            </div>

            {success && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-2 text-center text-xs text-green-700">
                バッジを作成しました！
              </div>
            )}

            <Button
              onClick={handleCreate}
              disabled={!name || !description || submitting}
              className="w-full"
            >
              {submitting ? "作成中..." : "バッジを作成"}
            </Button>
          </CardContent>
        </Card>

        {/* バッジ付与モーダル */}
        {awardingBadgeId && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-bold text-gray-900">バッジを付与する</h3>
              <p className="text-xs text-gray-500">
                {badges.find((b) => b.id === awardingBadgeId)?.name} を付与する選手を選択
              </p>
              {players.length === 0 ? (
                <EmptyState title="選手が登録されていません" />
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {players.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setAwardPlayerId(p.id)}
                      className={`rounded-lg border-2 p-2 text-center transition-all ${
                        awardPlayerId === p.id
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex h-8 w-8 mx-auto items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                        {p.number ?? "?"}
                      </div>
                      <div className="mt-1 text-xs font-medium text-gray-900 truncate">
                        {p.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAwardingBadgeId(null);
                    setAwardPlayerId(null);
                  }}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleAwardBadge}
                  disabled={!awardPlayerId || awarding}
                  className="flex-1"
                >
                  {awarding ? "付与中..." : "付与する"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* プリセットバッジ一覧 */}
        <div>
          <h3 className="mb-2 text-sm font-bold text-gray-900">
            プリセットバッジ一覧
          </h3>
          {presetBadges.length === 0 ? (
            <EmptyState
              title="プリセットバッジがありません"
              description="システムバッジがまだ登録されていません"
            />
          ) : (
            <div className="space-y-2">
              {presetBadges.map((badge) => (
                <Card key={badge.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm ${
                        badge.is_active ? "" : "opacity-40"
                      }`}
                      style={{ boxShadow: `0 0 8px ${badge.icon_color}40` }}
                    >
                      {getBadgeIcon(badge.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold ${badge.is_active ? "text-gray-900" : "text-gray-400"}`}>
                        {badge.name}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {badge.description}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => setAwardingBadgeId(badge.id)}
                        className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 hover:bg-green-200"
                      >
                        付与
                      </button>
                      <button
                        onClick={() => handleToggleActive(badge)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          badge.is_active
                            ? "bg-gray-100 text-gray-500"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {badge.is_active ? "有効" : "無効"}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* カスタムバッジ一覧 */}
        {customBadges.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-bold text-gray-900">
              カスタムバッジ一覧
            </h3>
            <div className="space-y-2">
              {customBadges.map((badge) => (
                <Card key={badge.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm ${
                        badge.is_active ? "" : "opacity-40"
                      }`}
                      style={{ boxShadow: `0 0 8px ${badge.icon_color}40` }}
                    >
                      {getBadgeIcon(badge.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold ${badge.is_active ? "text-gray-900" : "text-gray-400"}`}>
                        {badge.name}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {badge.description}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => setAwardingBadgeId(badge.id)}
                        className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 hover:bg-green-200"
                      >
                        付与
                      </button>
                      <button
                        onClick={() => handleToggleActive(badge)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          badge.is_active
                            ? "bg-gray-100 text-gray-500"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {badge.is_active ? "有効" : "無効"}
                      </button>
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
