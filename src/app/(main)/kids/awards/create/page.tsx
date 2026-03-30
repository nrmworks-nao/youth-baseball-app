"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createAward } from "@/lib/supabase/queries/kids";
import type { AwardCategory } from "@/types";

const AWARD_CATEGORIES: { key: AwardCategory; label: string; icon: string; description: string }[] = [
  { key: "mvp", label: "MVP", icon: "🏆", description: "今週最も活躍した選手" },
  { key: "effort", label: "がんばったで賞", icon: "⭐", description: "努力を称えたい選手" },
  { key: "nice_play", label: "ナイスプレー賞", icon: "✨", description: "素晴らしいプレーをした選手" },
];

// デモ選手データ
const DEMO_PLAYERS = [
  { id: "p1", name: "田中太郎", number: 8, lastAwardDays: 14 },
  { id: "p2", name: "佐藤次郎", number: 4, lastAwardDays: 21 },
  { id: "p3", name: "鈴木健", number: 6, lastAwardDays: 7 },
  { id: "p4", name: "高橋大輝", number: 3, lastAwardDays: 28 },
  { id: "p5", name: "渡辺翔", number: 5, lastAwardDays: 35 },
  { id: "p6", name: "伊藤誠", number: 7, lastAwardDays: 14 },
  { id: "p7", name: "山田拓", number: 9, lastAwardDays: 42 },
  { id: "p8", name: "中村雄太", number: 2, lastAwardDays: 21 },
  { id: "p9", name: "小林直人", number: 1, lastAwardDays: 7 },
];

export default function CreateAwardPage() {
  const router = useRouter();
  const [category, setCategory] = useState<AwardCategory | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 未受賞者を優先表示（最後の表彰から日数が多い順）
  const sortedPlayers = [...DEMO_PLAYERS].sort(
    (a, b) => b.lastAwardDays - a.lastAwardDays
  );
  const suggestedPlayers = sortedPlayers.filter((p) => p.lastAwardDays >= 30);

  const handleSubmit = async () => {
    if (!category || !selectedPlayerId) return;
    setSubmitting(true);
    try {
      await createAward({
        team_id: "t1",
        player_id: selectedPlayerId,
        category,
        comment: comment || undefined,
        awarded_at: new Date().toISOString().split("T")[0],
        created_by: "u1",
      });
      router.push("/kids/awards");
    } catch {
      // デモモードでは戻る
      router.push("/kids/awards");
    }
  };

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">表彰作成</h2>
        <p className="text-xs text-gray-500">team_admin のみ作成できます</p>
      </div>

      <div className="space-y-4 p-4">
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
                  {p.name}（{p.lastAwardDays}日前）
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
          <div className="grid grid-cols-3 gap-2">
            {DEMO_PLAYERS.map((player) => (
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
                  {player.number}
                </div>
                <div className="mt-1 text-xs font-medium text-gray-900 truncate">
                  {player.name}
                </div>
              </button>
            ))}
          </div>
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
