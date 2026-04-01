"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PlayerCard } from "@/components/features/kids/PlayerCard";
import { PlayerPhotoUpload } from "@/components/features/PlayerPhotoUpload";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, EmptyState } from "@/components/ui/error-display";
import { supabase } from "@/lib/supabase/client";
import { getPlayerBadges } from "@/lib/supabase/queries/kids";
import { getPlayer, getMyChildren } from "@/lib/supabase/queries/players";
import { uploadPlayerPhoto } from "@/lib/supabase/storage";
import type { Player, PlayerBadge } from "@/types";

export default function PlayerCardPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [player, setPlayer] = useState<Player | null>(null);
  const [badges, setBadges] = useState<PlayerBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [playerData, badgesData] = await Promise.all([
        getPlayer(playerId),
        getPlayerBadges(playerId),
      ]);
      setPlayer(playerData);
      setBadges(badgesData);

      // 編集権限チェック
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: myMember } = await supabase
          .from("team_members")
          .select("permission_group, is_admin")
          .eq("user_id", user.id)
          .eq("team_id", playerData.team_id)
          .eq("is_active", true)
          .single();

        const isAdmin =
          myMember?.is_admin === true ||
          myMember?.permission_group === "vice_president";

        const myChildren = await getMyChildren(user.id, playerData.team_id);
        const isMyChild = myChildren.some(
          (c) => c.players?.id === playerId || c.player_id === playerId
        );
        setCanEdit(isAdmin || isMyChild);
      }
    } catch {
      setError("選手カードの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <Loading />;
  if (error) return <ErrorDisplay message={error} onRetry={loadData} />;
  if (!player) return <EmptyState title="選手が見つかりません" />;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">マイ選手カード</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* メインカード */}
        <PlayerCard
          name={player.name}
          number={player.number}
          position={player.position}
          grade={player.grade}
          photoUrl={player.card_photo_url}
          cardRank={player.card_rank ?? "bronze"}
          badges={badges}
        />

        {/* 写真変更 */}
        {canEdit && (
          <div className="flex justify-center">
            <PlayerPhotoUpload
              player={player}
              size="xl"
              onUpload={async (file) => {
                await uploadPlayerPhoto(file, player.team_id, player.id);
                loadData();
              }}
            />
          </div>
        )}

        {/* プロフィール情報 */}
        {(player.favorite_pro_player || player.favorite_play || player.dream) && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-bold text-gray-900">プロフィール</h3>
            <div className="space-y-2">
              {player.favorite_pro_player && (
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 text-xs text-gray-500">
                    好きなプロ野球選手
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {player.favorite_pro_player}
                  </span>
                </div>
              )}
              {player.favorite_play && (
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 text-xs text-gray-500">
                    得意なプレー
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {player.favorite_play}
                  </span>
                </div>
              )}
              {player.dream && (
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 text-xs text-gray-500">
                    将来の夢
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {player.dream}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => {/* TODO: カード画像ダウンロード */}}>
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            ダウンロード
          </Button>
          <Button variant="line" className="flex-1" onClick={() => {/* TODO: LINE共有 */}}>
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
            LINEで共有
          </Button>
        </div>

        {/* ランクアップ条件 */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-gray-900">
            ランクアップ条件
          </h3>
          <div className="space-y-2">
            {[
              { rank: "シルバー", condition: "試合出場5回以上", done: true },
              { rank: "ゴールド", condition: "バッジ5個以上獲得", done: badges.length >= 5 },
              { rank: "プラチナ", condition: "打率.300以上 + バッジ10個", done: badges.length >= 10 },
            ].map((item) => (
              <div
                key={item.rank}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${item.done ? "text-green-600" : "text-gray-400"}`}
                  >
                    {item.done ? "✓" : "○"}
                  </span>
                  <span className="text-xs font-medium text-gray-700">
                    {item.rank}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{item.condition}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
