"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { supabase } from "@/lib/supabase/client";
import { getMyAllChildren } from "@/lib/supabase/queries/users";
import type { ChildWithTeam } from "@/types";

const MENU_ITEMS = [
  {
    href: "/kids/card",
    icon: "🃏",
    title: "マイ選手カード",
    description: "プロ野球カード風の選手カード",
    color: "bg-amber-50 border-amber-200",
    needsPlayer: true,
  },
  {
    href: "/kids/members",
    icon: "👥",
    title: "チームメンバー図鑑",
    description: "チームの仲間を見てみよう",
    color: "bg-blue-50 border-blue-200",
    needsPlayer: false,
  },
  {
    href: "/kids/badges",
    icon: "🏅",
    title: "バッジ図鑑",
    description: "集めたバッジをチェック",
    color: "bg-yellow-50 border-yellow-200",
    needsPlayer: false,
  },
  {
    href: "/kids/awards",
    icon: "🏆",
    title: "今週のMVP・がんばったで賞",
    description: "今週の表彰をチェック",
    color: "bg-purple-50 border-purple-200",
    needsPlayer: false,
  },
  {
    href: "/kids/team-challenge",
    icon: "🎯",
    title: "チームチャレンジ",
    description: "みんなで目標を達成しよう",
    color: "bg-green-50 border-green-200",
    needsPlayer: false,
  },
  {
    href: "/kids/goals",
    icon: "⭐",
    title: "マイ目標チャレンジ",
    description: "自分だけの目標に挑戦",
    color: "bg-teal-50 border-teal-200",
    needsPlayer: true,
  },
  {
    href: "/kids/timeline",
    icon: "📈",
    title: "成長タイムライン",
    description: "これまでの成長を振り返ろう",
    color: "bg-indigo-50 border-indigo-200",
    needsPlayer: true,
  },
  {
    href: "/kids/review",
    icon: "📋",
    title: "今月のふりかえり",
    description: "今月のがんばりをチェック",
    color: "bg-pink-50 border-pink-200",
    needsPlayer: true,
  },
  {
    href: "/kids/best-plays",
    icon: "✨",
    title: "ベストプレー集",
    description: "みんなのナイスプレー",
    color: "bg-orange-50 border-orange-200",
    needsPlayer: false,
  },
];

export default function KidsPage() {
  const { currentTeam, isLoading: teamLoading } = useCurrentTeam();
  const [children, setChildren] = useState<ChildWithTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChildren = useCallback(async () => {
    if (!currentTeam) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (userId) {
        const allChildren = await getMyAllChildren(userId);
        const teamChildren = allChildren.filter(
          (c) => c.team_id === currentTeam.id
        );
        setChildren(teamChildren);
      }
    } catch {
      // 子供情報の取得失敗は非致命的
    } finally {
      setLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (teamLoading || !currentTeam) return;
    loadChildren();
  }, [currentTeam, teamLoading, loadChildren]);

  if (teamLoading || loading) return <Loading />;

  const defaultPlayerId = children[0]?.player?.id;

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">キッズ</h2>
        <p className="text-xs text-gray-500">
          がんばりを記録して、もっと野球を楽しもう！
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {MENU_ITEMS.map((item) => {
          const href =
            item.needsPlayer && defaultPlayerId
              ? `${item.href}/${defaultPlayerId}`
              : item.needsPlayer && !defaultPlayerId
                ? "#"
                : item.href;

          const isDisabled = item.needsPlayer && !defaultPlayerId;

          return (
            <Link
              key={item.href}
              href={href}
              className={isDisabled ? "pointer-events-none" : ""}
            >
              <Card
                className={`h-full border transition-shadow hover:shadow-md ${item.color} ${
                  isDisabled ? "opacity-40" : ""
                }`}
              >
                <CardContent className="p-3">
                  <div className="text-2xl">{item.icon}</div>
                  <div className="mt-1.5 text-sm font-bold text-gray-900">
                    {item.title}
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-500 leading-tight">
                    {item.description}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {!defaultPlayerId && (
        <div className="mx-4 mb-4 rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-500">
            お子さまの登録がまだの場合、一部の機能が利用できません。
            <br />
            マイページからお子さまを登録してください。
          </p>
        </div>
      )}
    </div>
  );
}
