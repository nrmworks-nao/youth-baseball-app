"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PlayerCard } from "@/components/features/kids/PlayerCard";
import type { CardRank } from "@/types";

// デモデータ
const DEMO_MEMBERS = [
  { id: "p1", name: "田中太郎", number: 8, position: "中堅手", grade: 6, cardRank: "gold" as CardRank, battingAvg: 0.345, favoritePlayer: "大谷翔平", bestPlay: "ダイビングキャッチ", dream: "プロ野球選手" },
  { id: "p2", name: "佐藤次郎", number: 4, position: "二塁手", grade: 6, cardRank: "silver" as CardRank, battingAvg: 0.289, favoritePlayer: "山本由伸", bestPlay: "ダブルプレー", dream: "野球選手" },
  { id: "p3", name: "鈴木健", number: 6, position: "遊撃手", grade: 6, cardRank: "platinum" as CardRank, battingAvg: 0.412, favoritePlayer: "鈴木誠也", bestPlay: "バックハンドスロー", dream: "メジャーリーガー" },
  { id: "p4", name: "高橋大輝", number: 3, position: "一塁手", grade: 5, cardRank: "gold" as CardRank, battingAvg: 0.325, favoritePlayer: "村上宗隆", bestPlay: "ファーストストレッチ", dream: "プロ野球選手" },
  { id: "p5", name: "渡辺翔", number: 5, position: "三塁手", grade: 5, cardRank: "silver" as CardRank, battingAvg: 0.278, favoritePlayer: "岡本和真", bestPlay: "強肩", dream: "消防士" },
  { id: "p6", name: "伊藤誠", number: 7, position: "左翼手", grade: 5, cardRank: "bronze" as CardRank, battingAvg: 0.256, favoritePlayer: "柳田悠岐", bestPlay: "好走塁", dream: "教師" },
  { id: "p7", name: "山田拓", number: 9, position: "右翼手", grade: 4, cardRank: "bronze" as CardRank, battingAvg: 0.198, favoritePlayer: "近藤健介", bestPlay: "レーザービーム", dream: "野球選手" },
  { id: "p8", name: "中村雄太", number: 2, position: "捕手", grade: 6, cardRank: "gold" as CardRank, battingAvg: 0.301, favoritePlayer: "甲斐拓也", bestPlay: "盗塁阻止", dream: "スポーツトレーナー" },
  { id: "p9", name: "小林直人", number: 1, position: "投手", grade: 6, cardRank: "platinum" as CardRank, battingAvg: 0.215, favoritePlayer: "佐々木朗希", bestPlay: "ストレート", dream: "プロ野球選手" },
];

type SortKey = "number" | "grade" | "name";
type FilterPosition = "all" | string;

export default function MembersPage() {
  const [sortKey, setSortKey] = useState<SortKey>("number");
  const [filterPosition, setFilterPosition] = useState<FilterPosition>("all");
  const [filterGrade, setFilterGrade] = useState<number | null>(null);

  const positions = useMemo(() => {
    const set = new Set(DEMO_MEMBERS.map((m) => m.position));
    return Array.from(set);
  }, []);

  const grades = useMemo(() => {
    const set = new Set(DEMO_MEMBERS.map((m) => m.grade));
    return Array.from(set).sort((a, b) => b - a);
  }, []);

  const filteredMembers = useMemo(() => {
    let members = [...DEMO_MEMBERS];

    if (filterPosition !== "all") {
      members = members.filter((m) => m.position === filterPosition);
    }
    if (filterGrade !== null) {
      members = members.filter((m) => m.grade === filterGrade);
    }

    members.sort((a, b) => {
      if (sortKey === "number") return (a.number ?? 0) - (b.number ?? 0);
      if (sortKey === "grade") return b.grade - a.grade;
      return a.name.localeCompare(b.name, "ja");
    });

    return members;
  }, [sortKey, filterPosition, filterGrade]);

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

        {/* 学年フィルター */}
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
      </div>

      {/* メンバーグリッド */}
      <div className="grid grid-cols-1 gap-3 p-4">
        {filteredMembers.map((member) => (
          <Link key={member.id} href={`/kids/card/${member.id}`}>
            <PlayerCard
              name={member.name}
              number={member.number}
              position={member.position}
              grade={member.grade}
              cardRank={member.cardRank}
              stats={{
                battingAvg: member.battingAvg,
                obp: 0,
                stolenBases: 0,
                throwDistance: 0,
                baseRun: 0,
              }}
              compact
              className="transition-transform active:scale-[0.98]"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
