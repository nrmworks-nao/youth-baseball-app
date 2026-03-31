"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PlayerCard } from "@/components/features/kids/PlayerCard";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { getPlayerCard, getPlayerBadges } from "@/lib/supabase/queries/kids";
import { getPlayer, getPlayerAllStats, getPlayerFitnessRecords } from "@/lib/supabase/queries/players";
import type { Player, PlayerCard as PlayerCardType, PlayerBadge, BattingAggregation } from "@/types";

// デモデータ
const DEMO_PLAYER: Player = {
  id: "p1",
  team_id: "t1",
  name: "田中太郎",
  number: 8,
  position: "中堅手",
  grade: 6,
  is_active: true,
  created_at: "2024-04-01",
};

const DEMO_CARD: PlayerCardType = {
  id: "c1",
  player_id: "p1",
  team_id: "t1",
  card_rank: "gold",
  batting_throw: "右投右打",
  favorite_pro_player: "大谷翔平",
  best_play: "ダイビングキャッチ",
  future_dream: "プロ野球選手",
  created_at: "2024-04-01",
  updated_at: "2024-04-01",
};

const DEMO_STATS = {
  battingAvg: 0.345,
  obp: 0.412,
  stolenBases: 8,
  throwDistance: 45,
  baseRun: 8.2,
};

const DEMO_RADAR = [
  { subject: "打撃力", value: 78, fullMark: 100 },
  { subject: "走力", value: 85, fullMark: 100 },
  { subject: "守備力", value: 72, fullMark: 100 },
  { subject: "体力", value: 80, fullMark: 100 },
];

const DEMO_BADGES: PlayerBadge[] = [
  {
    id: "b1",
    player_id: "p1",
    badge_id: "bg1",
    earned_at: "2024-06-15",
    badge: { id: "bg1", name: "初ヒット", description: "初めてのヒット", category: "batting", icon_color: "#f59e0b", is_preset: true, condition_key: "first_hit", created_at: "2024-01-01" },
  },
  {
    id: "b2",
    player_id: "p1",
    badge_id: "bg2",
    earned_at: "2024-07-20",
    badge: { id: "bg2", name: "初打点", description: "初めての打点", category: "batting", icon_color: "#ef4444", is_preset: true, condition_key: "first_rbi", created_at: "2024-01-01" },
  },
  {
    id: "b3",
    player_id: "p1",
    badge_id: "bg3",
    earned_at: "2024-09-10",
    badge: { id: "bg3", name: "皆勤賞", description: "月間練習全参加", category: "effort", icon_color: "#22c55e", is_preset: true, condition_key: "perfect_attendance", created_at: "2024-01-01" },
  },
  {
    id: "b4",
    player_id: "p1",
    badge_id: "bg4",
    earned_at: "2024-10-05",
    badge: { id: "bg4", name: "連続出塁", description: "3試合以上連続出塁", category: "batting", icon_color: "#eab308", is_preset: true, condition_key: "consecutive_on_base_3", created_at: "2024-01-01" },
  },
];

export default function PlayerCardPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [player, setPlayer] = useState<Player | null>(null);
  const [card, setCard] = useState<PlayerCardType | null>(null);
  const [badges, setBadges] = useState<PlayerBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [playerData, cardData, badgesData] = await Promise.all([
          getPlayer(playerId),
          getPlayerCard(playerId),
          getPlayerBadges(playerId),
        ]);
        setPlayer(playerData);
        setCard(cardData);
        setBadges(badgesData);
      } catch {
        // デモデータを使用
        setPlayer(DEMO_PLAYER);
        setCard(DEMO_CARD);
        setBadges(DEMO_BADGES);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [playerId]);

  if (loading) return <Loading />;

  const displayPlayer = player || DEMO_PLAYER;
  const displayCard = card || DEMO_CARD;
  const displayBadges = badges.length > 0 ? badges : DEMO_BADGES;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">マイ選手カード</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* メインカード */}
        <PlayerCard
          name={displayPlayer.name}
          number={displayPlayer.number}
          position={displayPlayer.position}
          grade={displayPlayer.grade}
          battingThrow={displayCard.batting_throw}
          photoUrl={displayCard.photo_url}
          cardRank={displayCard.card_rank}
          stats={DEMO_STATS}
          radarData={DEMO_RADAR}
          badges={displayBadges}
        />

        {/* プロフィール情報 */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-bold text-gray-900">プロフィール</h3>
          <div className="space-y-2">
            {displayCard.favorite_pro_player && (
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 text-xs text-gray-500">
                  好きなプロ野球選手
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {displayCard.favorite_pro_player}
                </span>
              </div>
            )}
            {displayCard.best_play && (
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 text-xs text-gray-500">
                  得意なプレー
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {displayCard.best_play}
                </span>
              </div>
            )}
            {displayCard.future_dream && (
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 text-xs text-gray-500">
                  将来の夢
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {displayCard.future_dream}
                </span>
              </div>
            )}
          </div>
        </div>

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
              { rank: "ゴールド", condition: "バッジ5個以上獲得", done: true },
              { rank: "プラチナ", condition: "打率.300以上 + バッジ10個", done: false },
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
