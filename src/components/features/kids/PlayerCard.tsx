"use client";

import { cn } from "@/lib/utils/cn";
import { StatsRadarChart } from "@/components/features/charts/RadarChart";
import { getBadgeIcon } from "@/lib/supabase/badges";
import type { CardRank, PlayerBadge } from "@/types";

// ランク設定
const RANK_CONFIG: Record<
  CardRank,
  { label: string; border: string; bg: string; text: string; shine: string }
> = {
  bronze: {
    label: "ブロンズ",
    border: "border-amber-600",
    bg: "bg-gradient-to-br from-amber-50 to-amber-100",
    text: "text-amber-700",
    shine: "from-amber-200/50 to-transparent",
  },
  silver: {
    label: "シルバー",
    border: "border-gray-400",
    bg: "bg-gradient-to-br from-gray-50 to-gray-200",
    text: "text-gray-600",
    shine: "from-gray-200/50 to-transparent",
  },
  gold: {
    label: "ゴールド",
    border: "border-yellow-500",
    bg: "bg-gradient-to-br from-yellow-50 to-yellow-200",
    text: "text-yellow-700",
    shine: "from-yellow-200/60 to-transparent",
  },
  platinum: {
    label: "プラチナ",
    border: "border-purple-400",
    bg: "bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100",
    text: "text-purple-700",
    shine: "from-purple-200/50 via-blue-100/30 to-transparent",
  },
};

interface PlayerCardProps {
  name: string;
  number?: number;
  position?: string;
  grade?: number;
  battingThrow?: string;
  photoUrl?: string;
  cardRank: CardRank;
  stats?: {
    battingAvg: number;
    obp: number;
    stolenBases: number;
    throwDistance: number;
    baseRun: number;
  };
  radarData?: { subject: string; value: number; fullMark: number }[];
  badges?: PlayerBadge[];
  compact?: boolean;
  className?: string;
}

export function PlayerCard({
  name,
  number,
  position,
  grade,
  battingThrow,
  photoUrl,
  cardRank,
  stats,
  radarData,
  badges = [],
  compact = false,
  className,
}: PlayerCardProps) {
  const rank = RANK_CONFIG[cardRank];

  if (compact) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border-2 p-3",
          rank.border,
          rank.bg,
          className
        )}
      >
        {/* 光沢エフェクト */}
        <div
          className={cn(
            "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rotate-45 bg-gradient-to-br opacity-60",
            rank.shine
          )}
        />

        <div className="flex items-center gap-3">
          {/* 顔写真 */}
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 border-white bg-gray-200 shadow-sm">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400">
                {number ?? "?"}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-900 truncate">
                {name}
              </span>
              <span
                className={cn(
                  "flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  rank.text,
                  cardRank === "platinum"
                    ? "bg-purple-100"
                    : cardRank === "gold"
                      ? "bg-yellow-100"
                      : cardRank === "silver"
                        ? "bg-gray-100"
                        : "bg-amber-100"
                )}
              >
                {rank.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {number !== undefined && <span>#{number}</span>}
              {position && <span>{position}</span>}
              {grade && <span>{grade}年</span>}
            </div>
          </div>

          {stats && (
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-bold text-gray-900">
                .{Math.round(stats.battingAvg * 1000)}
              </div>
              <div className="text-[10px] text-gray-400">打率</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // フルサイズカード
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border-3 shadow-lg",
        rank.border,
        rank.bg,
        className
      )}
    >
      {/* 光沢エフェクト */}
      <div
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-40 w-40 rotate-45 bg-gradient-to-br opacity-60",
          rank.shine
        )}
      />

      {/* ランクバッジ */}
      <div className="absolute right-3 top-3 z-10">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold shadow-sm",
            rank.text,
            cardRank === "platinum"
              ? "bg-purple-100 shadow-purple-200"
              : cardRank === "gold"
                ? "bg-yellow-100 shadow-yellow-200"
                : cardRank === "silver"
                  ? "bg-gray-100 shadow-gray-200"
                  : "bg-amber-100 shadow-amber-200"
          )}
        >
          {rank.label}
        </span>
      </div>

      {/* 選手情報ヘッダー */}
      <div className="relative flex items-start gap-4 p-4 pb-2">
        {/* 顔写真 */}
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border-3 border-white bg-gray-200 shadow-md">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-gray-400">
              {number ?? "?"}
            </div>
          )}
          {/* 背番号オーバーレイ */}
          {number !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-sm font-bold text-white">
              #{number}
            </div>
          )}
        </div>

        {/* 基本情報 */}
        <div className="flex-1 pt-1">
          <h3 className="text-xl font-bold text-gray-900">{name}</h3>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {position && (
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-700 shadow-sm">
                {position}
              </span>
            )}
            {grade && (
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-700 shadow-sm">
                {grade}年生
              </span>
            )}
            {battingThrow && (
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-700 shadow-sm">
                {battingThrow}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ステータス */}
      {stats && (
        <div className="grid grid-cols-5 gap-1 px-4 py-2">
          {[
            { label: "打率", value: `.${Math.round(stats.battingAvg * 1000).toString().padStart(3, "0")}` },
            { label: "出塁率", value: `.${Math.round(stats.obp * 1000).toString().padStart(3, "0")}` },
            { label: "盗塁", value: `${stats.stolenBases}` },
            { label: "遠投", value: `${stats.throwDistance}m` },
            { label: "ベースラン", value: `${stats.baseRun}秒` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg bg-white/70 p-1.5 text-center shadow-sm"
            >
              <div className="text-sm font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-[9px] text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* レーダーチャート */}
      {radarData && radarData.length > 0 && (
        <div className="px-2">
          <StatsRadarChart
            data={radarData}
            height={200}
            color={
              cardRank === "platinum"
                ? "#7c3aed"
                : cardRank === "gold"
                  ? "#ca8a04"
                  : cardRank === "silver"
                    ? "#6b7280"
                    : "#b45309"
            }
          />
        </div>
      )}

      {/* 獲得バッジ */}
      {badges.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {badges.slice(0, 6).map((pb) => (
              <div
                key={pb.id}
                className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-xs shadow-sm"
                title={pb.badge?.name}
              >
                <span>{getBadgeIcon(pb.badge?.category || "special")}</span>
                <span className="font-medium text-gray-700">
                  {pb.badge?.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
