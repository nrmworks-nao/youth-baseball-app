"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { getBadges, getPlayerBadges } from "@/lib/supabase/queries/kids";
import { PRESET_BADGES, getBadgeIcon } from "@/lib/supabase/badges";
import type { KidsBadge, PlayerBadge, BadgeCategory } from "@/types";

// デモバッジデータ
const DEMO_ALL_BADGES: KidsBadge[] = PRESET_BADGES.map((b, i) => ({
  id: `badge-${i}`,
  name: b.name,
  description: b.description,
  category: b.category,
  icon_color: b.icon_color,
  is_preset: true,
  condition_key: b.condition_key,
  created_at: "2024-01-01",
}));

const DEMO_EARNED_IDS = new Set(["badge-0", "badge-1", "badge-3", "badge-4", "badge-12"]);

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  batting: "打撃",
  pitching: "投球",
  fielding: "守備",
  running: "走塁",
  effort: "努力",
  special: "特別",
  custom: "カスタム",
};

export default function BadgesPage() {
  const [allBadges, setAllBadges] = useState<KidsBadge[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<BadgeCategory | "all">("all");

  useEffect(() => {
    async function load() {
      try {
        const [badges, playerBadges] = await Promise.all([
          getBadges("t1"),
          getPlayerBadges("p1"),
        ]);
        setAllBadges(badges.length > 0 ? badges : DEMO_ALL_BADGES);
        setEarnedBadgeIds(
          playerBadges.length > 0
            ? new Set(playerBadges.map((pb) => pb.badge_id))
            : DEMO_EARNED_IDS
        );
      } catch {
        setAllBadges(DEMO_ALL_BADGES);
        setEarnedBadgeIds(DEMO_EARNED_IDS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Loading />;

  const categories: BadgeCategory[] = Array.from(new Set(allBadges.map((b) => b.category)));
  const filteredBadges =
    filterCategory === "all"
      ? allBadges
      : allBadges.filter((b) => b.category === filterCategory);

  const earnedCount = allBadges.filter((b) => earnedBadgeIds.has(b.id)).length;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">バッジ図鑑</h2>
        <p className="text-xs text-gray-500">
          {earnedCount} / {allBadges.length} 獲得済み
        </p>
      </div>

      {/* 進捗バー */}
      <div className="bg-white px-4 py-2 border-b border-gray-100">
        <div className="relative h-3 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all"
            style={{
              width: `${(earnedCount / allBadges.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* カテゴリフィルター */}
      <div className="flex gap-1.5 overflow-x-auto bg-white px-4 py-2 border-b border-gray-100">
        <button
          onClick={() => setFilterCategory("all")}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filterCategory === "all"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          すべて
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filterCategory === cat
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {getBadgeIcon(cat)} {CATEGORY_LABELS[cat as BadgeCategory] || cat}
          </button>
        ))}
      </div>

      {/* バッジグリッド */}
      <div className="grid grid-cols-3 gap-3 p-4">
        {filteredBadges.map((badge) => {
          const isEarned = earnedBadgeIds.has(badge.id);
          return (
            <Card
              key={badge.id}
              className={`text-center transition-all ${
                isEarned
                  ? "border-2 border-yellow-300 bg-gradient-to-b from-yellow-50 to-white shadow-sm"
                  : "border border-gray-200 bg-gray-50 opacity-60"
              }`}
            >
              <CardContent className="p-3">
                {/* アイコン */}
                <div
                  className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                    isEarned ? "bg-white shadow-sm" : "bg-gray-200"
                  }`}
                  style={
                    isEarned
                      ? {
                          boxShadow: `0 0 12px ${badge.icon_color}40`,
                        }
                      : undefined
                  }
                >
                  {isEarned ? (
                    getBadgeIcon(badge.category)
                  ) : (
                    <span className="text-gray-400">?</span>
                  )}
                </div>

                {/* バッジ名 */}
                <div className="mt-2">
                  <div
                    className={`text-xs font-bold ${
                      isEarned ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {isEarned ? badge.name : "???"}
                  </div>
                  <div className="mt-0.5 text-[10px] text-gray-400 line-clamp-2">
                    {badge.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
