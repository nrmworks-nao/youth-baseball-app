"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, EmptyState } from "@/components/ui/error-display";
import { PlayerAvatar } from "@/components/features/PlayerAvatar";
import { getMonthlyReviews } from "@/lib/supabase/queries/kids";
import { getPlayer } from "@/lib/supabase/queries/players";
import type { MonthlyReview, Player } from "@/types";

function ChangeIndicator({ value, unit = "" }: { value?: number; unit?: string; invert?: boolean }) {
  if (value === undefined || value === null) return null;
  const isPositive = value > 0;
  const isZero = value === 0;
  return (
    <span
      className={`text-xs font-medium ${
        isZero ? "text-gray-400" : isPositive ? "text-green-600" : "text-orange-500"
      }`}
    >
      {value > 0 ? "↑" : value < 0 ? "↓" : "→"}
      {Math.abs(value).toFixed(unit === "%" ? 0 : 1)}{unit}
    </span>
  );
}

export default function ReviewPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [player, setPlayer] = useState<Player | null>(null);
  const [reviews, setReviews] = useState<MonthlyReview[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, playerData] = await Promise.all([
        getMonthlyReviews(playerId),
        getPlayer(playerId),
      ]);
      setReviews(data);
      setPlayer(playerData);
    } catch {
      setError("ふりかえりデータの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <Loading />;
  if (error) return <ErrorDisplay message={error} onRetry={loadData} />;

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col">
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <h2 className="text-base font-bold text-gray-900">今月のふりかえり</h2>
        </div>
        <EmptyState
          title="まだふりかえりデータがありません"
          description="月末に自動生成されます"
        />
      </div>
    );
  }

  const currentReview = reviews[selectedIndex];

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          {player && <PlayerAvatar player={player} size="lg" showNumber />}
          <div>
            <h2 className="text-base font-bold text-gray-900">今月のふりかえり</h2>
            {player && <p className="text-xs text-gray-500">{player.name}</p>}
          </div>
        </div>
      </div>

      {/* 月選択 */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white px-4 py-2 border-b border-gray-100">
        {reviews.map((review, index) => (
          <button
            key={review.id}
            onClick={() => setSelectedIndex(index)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedIndex === index
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {review.year}年{review.month}月
          </button>
        ))}
      </div>

      <div className="space-y-3 p-4">
        {/* ポジティブメッセージ */}
        {currentReview.positive_message && (
          <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-4">
            <div className="flex items-start gap-2">
              <span className="text-2xl">🌟</span>
              <p className="text-sm font-medium text-green-800 leading-relaxed">
                {currentReview.positive_message}
              </p>
            </div>
          </div>
        )}

        {/* 練習・試合 */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {currentReview.practice_attendance_rate !== undefined
                  ? `${Math.round(currentReview.practice_attendance_rate * 100)}%`
                  : "-"}
              </div>
              <div className="text-[10px] text-gray-500">練習参加率</div>
              {currentReview.practice_attendance_rate === 1 && (
                <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">皆勤！</span>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {currentReview.games_played ?? "-"}
              </div>
              <div className="text-[10px] text-gray-500">試合数</div>
            </CardContent>
          </Card>
        </div>

        {/* 打率変化 */}
        <Card>
          <CardHeader>
            <CardTitle>打率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {currentReview.batting_avg !== undefined
                  ? `.${Math.round(currentReview.batting_avg * 1000).toString().padStart(3, "0")}`
                  : "-"}
              </span>
              {currentReview.batting_avg_change !== undefined && (
                <ChangeIndicator
                  value={currentReview.batting_avg_change * 1000}
                  unit="分"
                />
              )}
            </div>
            {currentReview.batting_avg_change !== undefined && (
              <p className="mt-1 text-xs text-gray-500">
                {currentReview.batting_avg_change > 0
                  ? `先月より${Math.round(Math.abs(currentReview.batting_avg_change) * 1000)}分アップ！`
                  : currentReview.batting_avg_change < 0
                    ? "来月はもっと打てるようになろう！"
                    : "先月と同じ打率をキープ！"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 身長・体重 */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-gray-500 mb-1">身長</div>
              <div className="flex items-end gap-1.5">
                <span className="text-xl font-bold text-gray-900">
                  {currentReview.height_cm ?? "-"}
                </span>
                <span className="text-xs text-gray-500 mb-0.5">cm</span>
                <ChangeIndicator value={currentReview.height_change} unit="cm" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-gray-500 mb-1">体重</div>
              <div className="flex items-end gap-1.5">
                <span className="text-xl font-bold text-gray-900">
                  {currentReview.weight_kg ?? "-"}
                </span>
                <span className="text-xs text-gray-500 mb-0.5">kg</span>
                <ChangeIndicator value={currentReview.weight_change} unit="kg" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 獲得バッジ */}
        {currentReview.badges_earned && currentReview.badges_earned.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>獲得バッジ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {currentReview.badges_earned.map((badge) => (
                  <div
                    key={badge}
                    className="flex items-center gap-1.5 rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1.5"
                  >
                    <span>🎖️</span>
                    <span className="text-xs font-medium text-yellow-800">
                      {badge}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 今月のベストプレー */}
        {currentReview.best_play_summary && (
          <Card>
            <CardHeader>
              <CardTitle>今月のベストプレー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2 rounded-lg bg-orange-50 p-3">
                <span className="text-lg">⚾</span>
                <p className="text-sm text-orange-900">
                  {currentReview.best_play_summary}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
