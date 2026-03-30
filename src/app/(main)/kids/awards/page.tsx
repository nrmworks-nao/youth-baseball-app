"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { getAwards } from "@/lib/supabase/queries/kids";
import type { Award, AwardCategory } from "@/types";

const AWARD_CONFIG: Record<AwardCategory, { label: string; icon: string; color: string }> = {
  mvp: { label: "MVP", icon: "🏆", color: "bg-yellow-50 border-yellow-300" },
  effort: { label: "がんばったで賞", icon: "⭐", color: "bg-blue-50 border-blue-300" },
  nice_play: { label: "ナイスプレー賞", icon: "✨", color: "bg-purple-50 border-purple-300" },
};

// デモデータ
const DEMO_AWARDS: Award[] = [
  { id: "a1", team_id: "t1", player_id: "p3", category: "mvp", comment: "大会で猛打賞！チームを勝利に導きました！", awarded_at: "2026-03-23", created_by: "u1", created_at: "2026-03-23", player: { id: "p3", team_id: "t1", name: "鈴木健", number: 6, position: "遊撃手", grade: 6, created_at: "" } },
  { id: "a2", team_id: "t1", player_id: "p7", category: "effort", comment: "毎日自主練を欠かさず続けています！", awarded_at: "2026-03-23", created_by: "u1", created_at: "2026-03-23", player: { id: "p7", team_id: "t1", name: "山田拓", number: 9, position: "右翼手", grade: 4, created_at: "" } },
  { id: "a3", team_id: "t1", player_id: "p8", category: "nice_play", comment: "盗塁阻止で試合の流れを変えました！", awarded_at: "2026-03-16", created_by: "u1", created_at: "2026-03-16", player: { id: "p8", team_id: "t1", name: "中村雄太", number: 2, position: "捕手", grade: 6, created_at: "" } },
  { id: "a4", team_id: "t1", player_id: "p1", category: "mvp", comment: "3打数3安打の猛打賞！", awarded_at: "2026-03-09", created_by: "u1", created_at: "2026-03-09", player: { id: "p1", team_id: "t1", name: "田中太郎", number: 8, position: "中堅手", grade: 6, created_at: "" } },
  { id: "a5", team_id: "t1", player_id: "p6", category: "effort", comment: "守備が上手になりました！", awarded_at: "2026-03-09", created_by: "u1", created_at: "2026-03-09", player: { id: "p6", team_id: "t1", name: "伊藤誠", number: 7, position: "左翼手", grade: 5, created_at: "" } },
  { id: "a6", team_id: "t1", player_id: "p9", category: "nice_play", comment: "5回を無失点に抑える好投！", awarded_at: "2026-03-02", created_by: "u1", created_at: "2026-03-02", player: { id: "p9", team_id: "t1", name: "小林直人", number: 1, position: "投手", grade: 6, created_at: "" } },
];

export default function AwardsPage() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<AwardCategory | "all">("all");

  useEffect(() => {
    async function load() {
      try {
        const data = await getAwards("t1");
        setAwards(data.length > 0 ? data : DEMO_AWARDS);
      } catch {
        setAwards(DEMO_AWARDS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Loading />;

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
        <Link href="/kids/awards/create">
          <Button size="sm">表彰する</Button>
        </Link>
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
        {(Object.entries(grouped) as [string, Award[]][]).map(([date, dateAwards]) => (
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
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                          {config.icon}
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
        ))}
      </div>
    </div>
  );
}
