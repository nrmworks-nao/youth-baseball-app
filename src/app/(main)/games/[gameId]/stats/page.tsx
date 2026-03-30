"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type StatsTab = "batting" | "pitching" | "fielding";

// デモ選手
const DEMO_PLAYERS = [
  { id: "p1", name: "田中太郎", number: 8 },
  { id: "p2", name: "佐藤次郎", number: 4 },
  { id: "p3", name: "鈴木健", number: 6 },
  { id: "p4", name: "高橋大輝", number: 3 },
  { id: "p5", name: "渡辺翔", number: 5 },
  { id: "p6", name: "伊藤誠", number: 7 },
  { id: "p7", name: "山田拓", number: 9 },
  { id: "p8", name: "中村雄太", number: 2 },
  { id: "p9", name: "小林直人", number: 1 },
];

interface BattingInput {
  at_bats: string;
  hits: string;
  doubles: string;
  triples: string;
  home_runs: string;
  rbis: string;
  walks: string;
  strikeouts: string;
  stolen_bases: string;
}

interface PitchingInput {
  innings_pitched: string;
  hits_allowed: string;
  strikeouts_pitched: string;
  walks_allowed: string;
  earned_runs: string;
}

interface FieldingInput {
  putouts: string;
  assists: string;
  errors: string;
}

const emptyBatting: BattingInput = {
  at_bats: "",
  hits: "",
  doubles: "",
  triples: "",
  home_runs: "",
  rbis: "",
  walks: "",
  strikeouts: "",
  stolen_bases: "",
};

const emptyPitching: PitchingInput = {
  innings_pitched: "",
  hits_allowed: "",
  strikeouts_pitched: "",
  walks_allowed: "",
  earned_runs: "",
};

const emptyFielding: FieldingInput = {
  putouts: "",
  assists: "",
  errors: "",
};

export default function GameStatsPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const [activeTab, setActiveTab] = useState<StatsTab>("batting");
  const [selectedPlayer, setSelectedPlayer] = useState(DEMO_PLAYERS[0].id);
  const [battingStats, setBattingStats] = useState<
    Record<string, BattingInput>
  >(
    Object.fromEntries(DEMO_PLAYERS.map((p) => [p.id, { ...emptyBatting }]))
  );
  const [pitchingStats, setPitchingStats] = useState<
    Record<string, PitchingInput>
  >(
    Object.fromEntries(DEMO_PLAYERS.map((p) => [p.id, { ...emptyPitching }]))
  );
  const [fieldingStats, setFieldingStats] = useState<
    Record<string, FieldingInput>
  >(
    Object.fromEntries(DEMO_PLAYERS.map((p) => [p.id, { ...emptyFielding }]))
  );

  const updateBatting = (playerId: string, field: keyof BattingInput, value: string) => {
    setBattingStats((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }));
  };

  const updatePitching = (playerId: string, field: keyof PitchingInput, value: string) => {
    setPitchingStats((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }));
  };

  const updateFielding = (playerId: string, field: keyof FieldingInput, value: string) => {
    setFieldingStats((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }));
  };

  const handleSave = () => {
    // TODO: upsertPlayerGameStats() API呼び出し
    alert("成績を保存しました（デモ）");
  };

  const tabs: { key: StatsTab; label: string }[] = [
    { key: "batting", label: "打撃" },
    { key: "pitching", label: "投手" },
    { key: "fielding", label: "守備" },
  ];

  const player = DEMO_PLAYERS.find((p) => p.id === selectedPlayer)!;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href={`/games/${gameId}`} className="p-1">
          <svg
            className="h-5 w-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
        <h2 className="text-base font-bold text-gray-900">成績入力</h2>
      </div>

      {/* タブ */}
      <div className="flex border-b border-gray-200 bg-white">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-center text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-green-600 text-green-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 p-4">
        {/* 選手選択 */}
        <select
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
        >
          {DEMO_PLAYERS.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.number} {p.name}
            </option>
          ))}
        </select>

        {/* 打撃成績 */}
        {activeTab === "batting" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                打撃成績 - #{player.number} {player.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { key: "at_bats", label: "打数" },
                    { key: "hits", label: "安打" },
                    { key: "doubles", label: "二塁打" },
                    { key: "triples", label: "三塁打" },
                    { key: "home_runs", label: "本塁打" },
                    { key: "rbis", label: "打点" },
                    { key: "walks", label: "四球" },
                    { key: "strikeouts", label: "三振" },
                    { key: "stolen_bases", label: "盗塁" },
                  ] as { key: keyof BattingInput; label: string }[]
                ).map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      value={battingStats[selectedPlayer][field.key]}
                      onChange={(e) =>
                        updateBatting(selectedPlayer, field.key, e.target.value)
                      }
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 投手成績 */}
        {activeTab === "pitching" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                投手成績 - #{player.number} {player.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { key: "innings_pitched", label: "投球回" },
                    { key: "hits_allowed", label: "被安打" },
                    { key: "strikeouts_pitched", label: "奪三振" },
                    { key: "walks_allowed", label: "与四球" },
                    { key: "earned_runs", label: "自責点" },
                  ] as { key: keyof PitchingInput; label: string }[]
                ).map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step={field.key === "innings_pitched" ? "0.1" : "1"}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      value={pitchingStats[selectedPlayer][field.key]}
                      onChange={(e) =>
                        updatePitching(
                          selectedPlayer,
                          field.key,
                          e.target.value
                        )
                      }
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 守備成績 */}
        {activeTab === "fielding" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                守備成績 - #{player.number} {player.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { key: "putouts", label: "刺殺" },
                    { key: "assists", label: "補殺" },
                    { key: "errors", label: "失策" },
                  ] as { key: keyof FieldingInput; label: string }[]
                ).map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      value={fieldingStats[selectedPlayer][field.key]}
                      onChange={(e) =>
                        updateFielding(
                          selectedPlayer,
                          field.key,
                          e.target.value
                        )
                      }
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 全選手一括表示（打撃タブ時） */}
        {activeTab === "batting" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">全選手打撃成績一覧</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-1 py-1.5 text-left font-medium text-gray-500">
                        選手
                      </th>
                      <th className="px-1 py-1.5 text-center font-medium text-gray-500">
                        打数
                      </th>
                      <th className="px-1 py-1.5 text-center font-medium text-gray-500">
                        安打
                      </th>
                      <th className="px-1 py-1.5 text-center font-medium text-gray-500">
                        二
                      </th>
                      <th className="px-1 py-1.5 text-center font-medium text-gray-500">
                        三
                      </th>
                      <th className="px-1 py-1.5 text-center font-medium text-gray-500">
                        本
                      </th>
                      <th className="px-1 py-1.5 text-center font-medium text-gray-500">
                        点
                      </th>
                      <th className="px-1 py-1.5 text-center font-medium text-gray-500">
                        四
                      </th>
                      <th className="px-1 py-1.5 text-center font-medium text-gray-500">
                        三振
                      </th>
                      <th className="px-1 py-1.5 text-center font-medium text-gray-500">
                        盗
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_PLAYERS.map((p) => {
                      const stats = battingStats[p.id];
                      return (
                        <tr key={p.id} className="border-b border-gray-50">
                          <td className="px-1 py-1.5 font-medium text-gray-900">
                            #{p.number}
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            {stats.at_bats || "-"}
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            {stats.hits || "-"}
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            {stats.doubles || "-"}
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            {stats.triples || "-"}
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            {stats.home_runs || "-"}
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            {stats.rbis || "-"}
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            {stats.walks || "-"}
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            {stats.strikeouts || "-"}
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            {stats.stolen_bases || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Button className="w-full" onClick={handleSave}>
          成績を保存
        </Button>
      </div>
    </div>
  );
}
