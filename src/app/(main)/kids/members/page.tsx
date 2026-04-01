"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { PlayerCard } from "@/components/features/kids/PlayerCard";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, EmptyState } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { getPlayers } from "@/lib/supabase/queries/players";
import type { Player } from "@/types";

type SortKey = "number" | "grade" | "name";
type FilterPosition = "all" | string;

export default function MembersPage() {
  const [sortKey, setSortKey] = useState<SortKey>("number");
  const [filterPosition, setFilterPosition] = useState<FilterPosition>("all");
  const [filterGrade, setFilterGrade] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentTeam, isLoading: teamLoading } = useCurrentTeam();

  const loadData = useCallback(async () => {
    if (!currentTeam) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPlayers(currentTeam.id);
      setPlayers(data.filter((p) => p.is_active));
    } catch {
      setError("メンバーデータの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (teamLoading || !currentTeam) return;
    loadData();
  }, [currentTeam, teamLoading, loadData]);

  const positions = useMemo(() => {
    const set = new Set(players.map((m) => m.position).filter(Boolean));
    return Array.from(set) as string[];
  }, [players]);

  const grades = useMemo(() => {
    const set = new Set(players.map((m) => m.grade).filter(Boolean));
    return (Array.from(set) as number[]).sort((a, b) => b - a);
  }, [players]);

  const filteredMembers = useMemo(() => {
    let members = [...players];

    if (filterPosition !== "all") {
      members = members.filter((m) => m.position === filterPosition);
    }
    if (filterGrade !== null) {
      members = members.filter((m) => m.grade === filterGrade);
    }

    members.sort((a, b) => {
      if (sortKey === "number") return (a.number ?? 0) - (b.number ?? 0);
      if (sortKey === "grade") return (b.grade ?? 0) - (a.grade ?? 0);
      return a.name.localeCompare(b.name, "ja");
    });

    return members;
  }, [players, sortKey, filterPosition, filterGrade]);

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} onRetry={loadData} />;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">
          チームメンバー図鑑
        </h2>
        <p className="text-xs text-gray-500">
          {filteredMembers.length}名のメンバー
        </p>
      </div>

      {/* フィルター・ソート */}
      <div className="space-y-2 bg-white px-4 py-3 border-b border-gray-100">
        {/* ソート */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">並び順:</span>
          <div className="flex gap-1">
            {([
              { key: "number", label: "背番号" },
              { key: "grade", label: "学年" },
              { key: "name", label: "名前" },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortKey(opt.key)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  sortKey === opt.key
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ポジションフィルター */}
        {positions.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="flex-shrink-0 text-xs text-gray-500">ポジション:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setFilterPosition("all")}
                className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterPosition === "all"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                全て
              </button>
              {positions.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setFilterPosition(pos)}
                  className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    filterPosition === pos
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 学年フィルター */}
        {grades.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">学年:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setFilterGrade(null)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  filterGrade === null
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                全て
              </button>
              {grades.map((g) => (
                <button
                  key={g}
                  onClick={() => setFilterGrade(g)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    filterGrade === g
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {g}年
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* メンバーグリッド */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          title="まだメンバーが登録されていません"
          description="選手を登録するとここに表示されます"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 p-4">
          {filteredMembers.map((member) => (
            <Link key={member.id} href={`/kids/card/${member.id}`}>
              <PlayerCard
                name={member.name}
                number={member.number}
                position={member.position}
                grade={member.grade}
                photoUrl={member.card_photo_url}
                cardRank={member.card_rank ?? "bronze"}
                compact
                className="transition-transform active:scale-[0.98]"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
