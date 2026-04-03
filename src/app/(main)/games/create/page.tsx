"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { supabase } from "@/lib/supabase/client";
import { getPlayers } from "@/lib/supabase/queries/players";
import { createGame, upsertGameLineup } from "@/lib/supabase/queries/games";
import type { Player, GameType, InningScore } from "@/types";

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
  "控え",
];

interface LineupEntry {
  batting_order: number;
  player_id: string;
  position: string;
  is_starter: boolean;
}

interface InningScoreEntry {
  inning: number;
  score_team: string;
  score_opponent: string;
}

export default function GameCreatePage() {
  const router = useRouter();
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { canManageScorebook } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      is_starter: true,
    }))
  );

  useEffect(() => {
    if (teamLoading || !currentTeam) return;
    const load = async () => {
      try {
        const data = await getPlayers(currentTeam.id);
        setPlayers(data);
      } catch {
        setError("選手データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [currentTeam, teamLoading]);

  // スコアから結果を自動判定
  useEffect(() => {
    const st = parseInt(formData.score_team);
    const so = parseInt(formData.score_opponent);
    if (!isNaN(st) && !isNaN(so)) {
      if (st > so) setFormData((prev) => ({ ...prev, result: "win" }));
      else if (st < so) setFormData((prev) => ({ ...prev, result: "lose" }));
      else setFormData((prev) => ({ ...prev, result: "draw" }));
    }
  }, [formData.score_team, formData.score_opponent]);

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
    const updated = inningScores.map((is, i) =>
      i === index ? { ...is, [field]: value } : is
    );
    setInningScores(updated);

    // イニングスコアの合計を自動計算
    const totalTeam = updated.reduce(
      (sum, is) => sum + (is.score_team !== "" ? parseInt(is.score_team) || 0 : 0),
      0
    );
    const totalOpponent = updated.reduce(
      (sum, is) => sum + (is.score_opponent !== "" ? parseInt(is.score_opponent) || 0 : 0),
      0
    );
    setFormData((prev) => ({
      ...prev,
      score_team: String(totalTeam),
      score_opponent: String(totalOpponent),
    }));
  };

  const updateLineup = (
    index: number,
    field: keyof LineupEntry,
    value: string | number | boolean
  ) => {
    setLineup((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  const handleSubmit = async () => {
    if (!currentTeam) return;
    if (!formData.opponent_name || !formData.game_date) {
      setError("対戦チーム名と試合日は必須です");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("ログインが必要です");
        setIsSaving(false);
        return;
      }

      // イニングスコアを整形（入力があるもののみ）
      const hasInningScores = inningScores.some(
        (is) => is.score_team !== "" || is.score_opponent !== ""
      );
      const parsedInningScores: InningScore[] | undefined = hasInningScores
        ? inningScores.map((is) => ({
            inning: is.inning,
            score_team: is.score_team !== "" ? parseInt(is.score_team) || 0 : 0,
            score_opponent: is.score_opponent !== "" ? parseInt(is.score_opponent) || 0 : 0,
          }))
        : undefined;

      const game = await createGame({
        team_id: currentTeam.id,
        opponent_name: formData.opponent_name,
        game_date: formData.game_date,
        venue: formData.venue || undefined,
        game_type: formData.game_type,
        result: formData.result || undefined,
        score_team: parseInt(formData.score_team) || 0,
        score_opponent: parseInt(formData.score_opponent) || 0,
        inning_scores: parsedInningScores,
        notes: formData.notes || undefined,
        created_by: user.id,
      });

      // ラインナップ登録
      const lineupEntries = lineup.filter((l) => l.player_id);
      for (const entry of lineupEntries) {
        await upsertGameLineup({
          game_id: game.id,
          team_id: currentTeam.id,
          player_id: entry.player_id,
          batting_order: entry.batting_order,
          position: entry.position || undefined,
          is_starter: entry.is_starter,
        });
      }

      router.push(`/games/${game.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "不明なエラー";
      console.error("試合登録エラー:", err);
      setError(`試合の登録に失敗しました: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (!canManageScorebook()) return <ErrorDisplay message="試合登録の権限がありません" />;

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
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

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
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">自チーム得点</label>
                <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-900">
                  {formData.score_team || "0"}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">相手チーム得点</label>
                <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-900">
                  {formData.score_opponent || "0"}
                </p>
              </div>
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
                    <th className="px-1 py-1.5 font-medium text-gray-500">計</th>
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
                          className="w-12 rounded border border-gray-200 px-1 py-1 text-center text-sm"
                          value={is.score_team}
                          onChange={(e) =>
                            updateInningScore(i, "score_team", e.target.value)
                          }
                        />
                      </td>
                    ))}
                    <td className="px-1 py-1 text-center text-sm font-bold text-gray-900">
                      {formData.score_team || "0"}
                    </td>
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
                          className="w-12 rounded border border-gray-200 px-1 py-1 text-center text-sm"
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
                    <td className="px-1 py-1 text-center text-sm font-bold text-gray-900">
                      {formData.score_opponent || "0"}
                    </td>
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
                        {players.map((p) => (
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
        <Button className="w-full" onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? "登録中..." : "試合結果を登録"}
        </Button>
      </div>
    </div>
  );
}
