"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { getBestPlays } from "@/lib/supabase/queries/kids";
import type { BestPlay } from "@/types";

// デモデータ
const DEMO_BEST_PLAYS: BestPlay[] = [
  {
    id: "bp1",
    team_id: "t1",
    game_id: "g1",
    player_id: "p3",
    title: "猛打賞！3打数3安打",
    description: "全打席でヒットを放ち、チームの勝利に貢献しました",
    is_auto: true,
    play_date: "2026-03-23",
    created_at: "2026-03-23",
    player: { id: "p3", team_id: "t1", name: "鈴木健", number: 6, position: "遊撃手", grade: 6, is_active: true, created_at: "" },
    game: { id: "g1", team_id: "t1", opponent_name: "レッドスターズ", game_date: "2026-03-23", venue: "", game_type: "tournament", created_by: "", created_at: "", updated_at: "" } as BestPlay["game"],
  },
  {
    id: "bp2",
    team_id: "t1",
    game_id: "g1",
    player_id: "p1",
    title: "決勝タイムリーヒット！",
    description: "7回裏2アウトから逆転のタイムリーを放ちました",
    is_auto: true,
    play_date: "2026-03-23",
    created_at: "2026-03-23",
    player: { id: "p1", team_id: "t1", name: "田中太郎", number: 8, position: "中堅手", grade: 6, is_active: true, created_at: "" },
    game: { id: "g1", team_id: "t1", opponent_name: "レッドスターズ", game_date: "2026-03-23", venue: "", game_type: "tournament", created_by: "", created_at: "", updated_at: "" } as BestPlay["game"],
  },
  {
    id: "bp3",
    team_id: "t1",
    game_id: "g2",
    player_id: "p9",
    title: "5回無失点の好投！",
    description: "立ち上がりから制球が安定し、相手打線を封じました",
    is_auto: true,
    play_date: "2026-03-16",
    created_at: "2026-03-16",
    player: { id: "p9", team_id: "t1", name: "小林直人", number: 1, position: "投手", grade: 6, is_active: true, created_at: "" },
    game: { id: "g2", team_id: "t1", opponent_name: "ブルーウェーブ", game_date: "2026-03-16", venue: "", game_type: "league", created_by: "", created_at: "", updated_at: "" } as BestPlay["game"],
  },
  {
    id: "bp4",
    team_id: "t1",
    player_id: "p8",
    title: "盗塁阻止2回！鉄壁の守備",
    description: "正確なスローイングで2つの盗塁を刺しました",
    is_auto: false,
    play_date: "2026-03-16",
    created_by: "u1",
    created_at: "2026-03-16",
    player: { id: "p8", team_id: "t1", name: "中村雄太", number: 2, position: "捕手", grade: 6, is_active: true, created_at: "" },
  },
  {
    id: "bp5",
    team_id: "t1",
    game_id: "g3",
    player_id: "p5",
    title: "ファインプレー！ダイビングキャッチ",
    description: "三塁線の強い打球をダイビングキャッチで好捕！",
    is_auto: false,
    play_date: "2026-03-09",
    created_by: "u1",
    created_at: "2026-03-09",
    player: { id: "p5", team_id: "t1", name: "渡辺翔", number: 5, position: "三塁手", grade: 5, is_active: true, created_at: "" },
    game: { id: "g3", team_id: "t1", opponent_name: "グリーンファイターズ", game_date: "2026-03-09", venue: "", game_type: "practice", created_by: "", created_at: "", updated_at: "" } as BestPlay["game"],
  },
];

export default function BestPlaysPage() {
  const [plays, setPlays] = useState<BestPlay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBestPlays("t1");
        setPlays(data.length > 0 ? data : DEMO_BEST_PLAYS);
      } catch {
        setPlays(DEMO_BEST_PLAYS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Loading />;

  // 日付でグループ化
  const grouped = plays.reduce<Record<string, BestPlay[]>>((acc, play) => {
    if (!acc[play.play_date]) acc[play.play_date] = [];
    acc[play.play_date].push(play);
    return acc;
  }, {});

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">ベストプレー集</h2>
        <p className="text-xs text-gray-500">
          {plays.length}個のベストプレー
        </p>
      </div>

      <div className="space-y-4 p-4">
        {(Object.entries(grouped) as [string, BestPlay[]][]).map(([date, datePlays]) => (
          <div key={date}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">
                {new Date(date).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              {datePlays[0]?.game && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  vs {(datePlays[0].game as { opponent_name: string }).opponent_name}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {datePlays.map((play) => (
                <Card
                  key={play.id}
                  className="border-l-4 border-l-orange-400 bg-gradient-to-r from-orange-50 to-white"
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      {/* 写真枠 */}
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 text-2xl">
                        {play.photo_url ? (
                          <img
                            src={play.photo_url}
                            alt={play.title}
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          "⚡"
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-gray-900">
                            {play.title}
                          </span>
                          {play.is_auto && (
                            <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">
                              自動
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="text-xs font-medium text-orange-700">
                            {play.player?.name}
                          </span>
                          {play.player?.number !== undefined && (
                            <span className="text-[10px] text-gray-400">
                              #{play.player.number}
                            </span>
                          )}
                        </div>

                        {play.description && (
                          <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                            {play.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
