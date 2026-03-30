"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createCustomBadge } from "@/lib/supabase/queries/kids";
import { PRESET_BADGES, getBadgeIcon } from "@/lib/supabase/badges";
import type { BadgeCategory } from "@/types";

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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<BadgeCategory>("custom");
  const [iconColor, setIconColor] = useState("#22c55e");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCreate = async () => {
    if (!name || !description) return;
    setSubmitting(true);
    try {
      await createCustomBadge({
        team_id: "t1",
        name,
        description,
        category,
        icon_color: iconColor,
      });
      setSuccess(true);
    } catch {
      // デモモード
      setSuccess(true);
    }
    setSubmitting(false);
    setName("");
    setDescription("");
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">バッジ管理</h2>
        <p className="text-xs text-gray-500">team_admin のみアクセス可能</p>
      </div>

      <div className="space-y-4 p-4">
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

        {/* プリセットバッジ一覧 */}
        <div>
          <h3 className="mb-2 text-sm font-bold text-gray-900">
            プリセットバッジ一覧
          </h3>
          <div className="space-y-2">
            {PRESET_BADGES.map((badge) => (
              <Card key={badge.condition_key}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm"
                    style={{ boxShadow: `0 0 8px ${badge.icon_color}40` }}
                  >
                    {getBadgeIcon(badge.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-900">
                      {badge.name}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {badge.description}
                    </div>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                    自動判定
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
