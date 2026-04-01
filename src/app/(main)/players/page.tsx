"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { supabase } from "@/lib/supabase/client";
import { getPlayers } from "@/lib/supabase/queries/players";
import { PlayerAvatar } from "@/components/features/PlayerAvatar";
import type { Player } from "@/types";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("ログインが必要です");
          setIsLoading(false);
          return;
        }

        const { data: memberData } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)
          .single();

        if (!memberData) {
          setError("チームに所属していません");
          setIsLoading(false);
          return;
        }

        const playerList = await getPlayers(memberData.team_id);
        setPlayers(playerList);
        setIsLoading(false);
      } catch {
        setError("データの取得に失敗しました");
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">選手一覧</h2>
        <div className="text-xs text-gray-500">{players.length}名</div>
      </div>

      {/* チーム統計サマリー */}
      <div className="grid grid-cols-2 gap-3 bg-white px-4 py-3">
        <div className="rounded-lg bg-green-50 p-3 text-center">
          <div className="text-lg font-bold text-green-700">
            {players.length}
          </div>
          <div className="text-[10px] text-green-600">登録選手</div>
        </div>
        <div className="rounded-lg bg-blue-50 p-3 text-center">
          <div className="text-lg font-bold text-blue-700">
            {new Set(players.map((p) => p.grade).filter(Boolean)).size}
          </div>
          <div className="text-[10px] text-blue-600">学年数</div>
        </div>
      </div>

      {/* 選手リスト */}
      <div className="space-y-2 p-4">
        {players.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            登録された選手がいません
          </div>
        ) : (
          players.map((player) => (
            <Link key={player.id} href={`/players/${player.id}`}>
              <Card className="p-3 transition-colors hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {/* アバター */}
                  <PlayerAvatar player={player} size="md" showNumber />
                  {/* 選手情報 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {player.name}
                      </span>
                      {player.grade && (
                        <span className="text-xs text-gray-400">
                          {player.grade}年
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {player.position || "未設定"}
                      {player.throwing_hand && ` / ${player.throwing_hand}`}
                      {player.batting_hand && `${player.batting_hand}`}
                    </div>
                  </div>
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
