"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { GameType } from "@/types";

// デモ用の選手リスト
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
  { id: "p10", name: "加藤裕太", number: 10 },
  { id: "p11", name: "松本翼", number: 11 },
  { id: "p12", name: "井上龍", number: 12 },
];

const POSITIONS = [
  "投",
  "捕",
  "一",
  "二",
  "三",
  "遊",
  "左",
  "中",
  "右",
  "DH",
];

interface LineupEntry {
  batting_order: number;
  player_id: string;
  position: string;
}

interface InningScoreEntry {
  inning: number;
  score_team: string;
  score_opponent: string;
}

export default function GameCreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    opponent_name: "",
    game_date: "",
    venue: "",
    game_type: "practice" as GameType,
    result: "",
    score_team: "",
    score_opponent: "",
    notes: "",
  });
  const [innings, setInnings] = useState(7);
  const [inningScores, setInningScores] = useState<InningScoreEntry[]>(
    Array.from({ length: 7 }, (_, i) => ({
      inning: i + 1,
      score_team: "",
      score_opponent: "",
    }))
  );
  const [lineup, setLineup] = useState<LineupEntry[]>(
    Array.from({ length: 9 }, (_, i) => ({
      batting_order: i + 1,
      player_id: "",
      position: "",
    }))
  );

  const handleInningsChange = (count: number) => {
    setInnings(count);
    setInningScores(
      Array.from({ length: count }, (_, i) => ({
        inning: i + 1,
        score_team: inningScores[i]?.score_team ?? "",
        score_opponent: inningScores[i]?.score_opponent ?? "",
      }))
    );
  };

  const updateInningScore = (
    index: number,
    field: "score_team" | "score_opponent",
    value: string
  ) => {
    setInningScores((prev) =>
      prev.map((is, i) => (i === index ? { ...is, [field]: value } : is))
    );
  };

  const updateLineup = (
    index: number,
    field: keyof LineupEntry,
    value: string | number
  ) => {
    setLineup((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  const handleSubmit = () => {
    // TODO: createGame() API呼び出し
    alert("試合結果を登録しました（デモ）");
    router.push("/games");
  };

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/games" className="p-1">
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
        <h2 className="text-base font-bold text-gray-900">試合結果登録</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* 基本情報 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              label="対戦チーム名"
              placeholder="例: 東京ジュニアーズ"
              value={formData.opponent_name}
              onChange={(e) =>
                setFormData({ ...formData, opponent_name: e.target.value })
              }
            />
            <Input
              label="試合日"
              type="date"
              value={formData.game_date}
              onChange={(e) =>
                setFormData({ ...formData, game_date: e.target.value })
              }
            />
            <Input
              label="会場"
              placeholder="例: 中央公園グラウンド"
              value={formData.venue}
              onChange={(e) =>
                setFormData({ ...formData, venue: e.target.value })
              }
            />
            <Select
              label="試合種別"
              value={formData.game_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  game_type: e.target.value as GameType,
                })
              }
              options={[
                { value: "practice", label: "練習試合" },
                { value: "tournament", label: "大会" },
                { value: "league", label: "リーグ戦" },
              ]}
            />
            <Select
              label="試合結果"
              value={formData.result}
              onChange={(e) =>
                setFormData({ ...formData, result: e.target.value })
              }
              options={[
                { value: "", label: "選択してください" },
                { value: "win", label: "勝ち" },
                { value: "lose", label: "負け" },
                { value: "draw", label: "引分" },
              ]}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="自チーム得点"
                type="number"
                min="0"
                value={formData.score_team}
                onChange={(e) =>
                  setFormData({ ...formData, score_team: e.target.value })
                }
              />
              <Input
                label="相手チーム得点"
                type="number"
                min="0"
                value={formData.score_opponent}
                onChange={(e) =>
                  setFormData({ ...formData, score_opponent: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* イニングスコア */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">イニングスコア</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">回数:</span>
                {[5, 6, 7].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleInningsChange(n)}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      innings === n
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">
                      &nbsp;
                    </th>
                    {inningScores.map((is) => (
                      <th
                        key={is.inning}
                        className="px-1 py-1.5 font-medium text-gray-500"
                      >
                        {is.inning}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-2 py-1 text-left text-xs font-medium text-gray-700">
                      自チーム
                    </td>
                    {inningScores.map((is, i) => (
                      <td key={is.inning} className="px-0.5 py-1">
                        <input
                          type="number"
                          min="0"
                          className="w-8 rounded border border-gray-200 px-1 py-0.5 text-center text-xs"
                          value={is.score_team}
                          onChange={(e) =>
                            updateInningScore(i, "score_team", e.target.value)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-2 py-1 text-left text-xs font-medium text-gray-700">
                      相手
                    </td>
                    {inningScores.map((is, i) => (
                      <td key={is.inning} className="px-0.5 py-1">
                        <input
                          type="number"
                          min="0"
                          className="w-8 rounded border border-gray-200 px-1 py-0.5 text-center text-xs"
                          value={is.score_opponent}
                          onChange={(e) =>
                            updateInningScore(
                              i,
                              "score_opponent",
                              e.target.value
                            )
                          }
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* スタメン・打順 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">先発メンバー・打順</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="w-10 px-1 py-1.5 text-center font-medium text-gray-500">
                    打順
                  </th>
                  <th className="px-1 py-1.5 text-left font-medium text-gray-500">
                    選手
                  </th>
                  <th className="w-20 px-1 py-1.5 text-left font-medium text-gray-500">
                    守備
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineup.map((entry, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-1 py-1.5 text-center font-bold text-gray-700">
                      {entry.batting_order}
                    </td>
                    <td className="px-1 py-1.5">
                      <select
                        className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                        value={entry.player_id}
                        onChange={(e) =>
                          updateLineup(i, "player_id", e.target.value)
                        }
                      >
                        <option value="">選手を選択</option>
                        {DEMO_PLAYERS.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.number} {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-1 py-1.5">
                      <select
                        className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                        value={entry.position}
                        onChange={(e) =>
                          updateLineup(i, "position", e.target.value)
                        }
                      >
                        <option value="">守備</option>
                        {POSITIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* メモ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">メモ</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="試合のメモ（例: 春季大会2回戦、好投が光った）"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </CardContent>
        </Card>

        {/* 送信 */}
        <Button className="w-full" onClick={handleSubmit}>
          試合結果を登録
        </Button>
      </div>
    </div>
  );
}
