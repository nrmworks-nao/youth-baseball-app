"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import {
  getGameLineups,
  getGameStats,
  upsertPlayerGameStats,
} from "@/lib/supabase/queries/games";
import type { PlayerGameStats } from "@/types";

type StatsTab = "batting" | "pitching" | "fielding";

interface PlayerInfo {
  id: string;
  name: string;
  number: number;
}

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
  sacrifice_hits: string;
}

interface PitchingInput {
  innings_pitched: string;
  hits_allowed: string;
  strikeouts_pitched: string;
  walks_allowed: string;
  earned_runs: string;
  is_winning_pitcher: boolean;
  is_losing_pitcher: boolean;
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
  sacrifice_hits: "",
};

const emptyPitching: PitchingInput = {
  innings_pitched: "",
  hits_allowed: "",
  strikeouts_pitched: "",
  walks_allowed: "",
  earned_runs: "",
  is_winning_pitcher: false,
  is_losing_pitcher: false,
};

const emptyFielding: FieldingInput = {
  putouts: "",
  assists: "",
  errors: "",
};

export default function GameStatsPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { hasPermission } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [activeTab, setActiveTab] = useState<StatsTab>("batting");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [battingStats, setBattingStats] = useState<Record<string, BattingInput>>({});
  const [pitchingStats, setPitchingStats] = useState<Record<string, PitchingInput>>({});
  const [fieldingStats, setFieldingStats] = useState<Record<string, FieldingInput>>({});
  const [isPitcher, setIsPitcher] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const canEdit = hasPermission(["director", "vice_president", "coach"]);

  useEffect(() => {
    const load = async () => {
      try {
        const [lineups, existingStats] = await Promise.all([
          getGameLineups(gameId),
          getGameStats(gameId),
        ]);

        // ラインナップから選手情報を取得
        const playerList: PlayerInfo[] = lineups.map((l) => {
          const pd = (l as unknown as { players: { id: string; name: string; number: number } }).players;
          return { id: pd.id, name: pd.name, number: pd.number };
        });
        setPlayers(playerList);
        if (playerList.length > 0) setSelectedPlayer(playerList[0].id);

        // 既存成績があれば初期値に反映
        const bStats: Record<string, BattingInput> = {};
        const pStats: Record<string, PitchingInput> = {};
        const fStats: Record<string, FieldingInput> = {};
        const pitcherFlags: Record<string, boolean> = {};

        for (const p of playerList) {
          const existing = existingStats.find((s) => s.player_id === p.id);
          if (existing) {
            bStats[p.id] = {
              at_bats: existing.at_bats ? String(existing.at_bats) : "",
              hits: existing.hits ? String(existing.hits) : "",
              doubles: existing.doubles ? String(existing.doubles) : "",
              triples: existing.triples ? String(existing.triples) : "",
              home_runs: existing.home_runs ? String(existing.home_runs) : "",
              rbis: existing.rbis ? String(existing.rbis) : "",
              walks: existing.walks ? String(existing.walks) : "",
              strikeouts: existing.strikeouts ? String(existing.strikeouts) : "",
              stolen_bases: existing.stolen_bases ? String(existing.stolen_bases) : "",
              sacrifice_hits: existing.sacrifice_hits ? String(existing.sacrifice_hits) : "",
            };
            pStats[p.id] = {
              innings_pitched: existing.innings_pitched ? String(existing.innings_pitched) : "",
              hits_allowed: existing.hits_allowed ? String(existing.hits_allowed) : "",
              strikeouts_pitched: existing.strikeouts_pitched ? String(existing.strikeouts_pitched) : "",
              walks_allowed: existing.walks_allowed ? String(existing.walks_allowed) : "",
              earned_runs: existing.earned_runs ? String(existing.earned_runs) : "",
              is_winning_pitcher: existing.is_winning_pitcher,
              is_losing_pitcher: existing.is_losing_pitcher,
            };
            fStats[p.id] = {
              putouts: existing.putouts ? String(existing.putouts) : "",
              assists: existing.assists ? String(existing.assists) : "",
              errors: existing.errors ? String(existing.errors) : "",
            };
            pitcherFlags[p.id] = existing.innings_pitched > 0;
          } else {
            bStats[p.id] = { ...emptyBatting };
            pStats[p.id] = { ...emptyPitching };
            fStats[p.id] = { ...emptyFielding };
            pitcherFlags[p.id] = false;
          }
        }

        setBattingStats(bStats);
        setPitchingStats(pStats);
        setFieldingStats(fStats);
        setIsPitcher(pitcherFlags);
      } catch {
        setError("データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [gameId]);

  const updateBatting = (playerId: string, field: keyof BattingInput, value: string) => {
    setBattingStats((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }));
  };

  const updatePitching = (playerId: string, field: keyof PitchingInput, value: string | boolean) => {
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

  const handleSave = async () => {
    if (!currentTeam) return;
    setIsSaving(true);
    setSaveMessage(null);
    setError(null);
    try {
      for (const p of players) {
        const b = battingStats[p.id];
        const f = fieldingStats[p.id];
        const pitchData = isPitcher[p.id] ? pitchingStats[p.id] : null;

        await upsertPlayerGameStats({
          game_id: gameId,
          team_id: currentTeam.id,
          player_id: p.id,
          at_bats: b.at_bats ? parseInt(b.at_bats) : 0,
          hits: b.hits ? parseInt(b.hits) : 0,
          doubles: b.doubles ? parseInt(b.doubles) : 0,
          triples: b.triples ? parseInt(b.triples) : 0,
          home_runs: b.home_runs ? parseInt(b.home_runs) : 0,
          rbis: b.rbis ? parseInt(b.rbis) : 0,
          walks: b.walks ? parseInt(b.walks) : 0,
          strikeouts: b.strikeouts ? parseInt(b.strikeouts) : 0,
          stolen_bases: b.stolen_bases ? parseInt(b.stolen_bases) : 0,
          sacrifice_hits: b.sacrifice_hits ? parseInt(b.sacrifice_hits) : 0,
          putouts: f.putouts ? parseInt(f.putouts) : 0,
          assists: f.assists ? parseInt(f.assists) : 0,
          errors: f.errors ? parseInt(f.errors) : 0,
          innings_pitched: pitchData?.innings_pitched ? parseFloat(pitchData.innings_pitched) : 0,
          hits_allowed: pitchData?.hits_allowed ? parseInt(pitchData.hits_allowed) : 0,
          strikeouts_pitched: pitchData?.strikeouts_pitched ? parseInt(pitchData.strikeouts_pitched) : 0,
          walks_allowed: pitchData?.walks_allowed ? parseInt(pitchData.walks_allowed) : 0,
          earned_runs: pitchData?.earned_runs ? parseInt(pitchData.earned_runs) : 0,
          is_winning_pitcher: pitchData?.is_winning_pitcher ?? false,
          is_losing_pitcher: pitchData?.is_losing_pitcher ?? false,
        });
      }
      setSaveMessage("成績を保存しました");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setError("成績の保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { key: StatsTab; label: string }[] = [
    { key: "batting", label: "打撃" },
    { key: "pitching", label: "投手" },
    { key: "fielding", label: "守備" },
  ];

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (!canEdit) return <ErrorDisplay message="成績入力の権限がありません" />;
  if (players.length === 0) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
          <Link href={`/games/${gameId}`} className="p-1">
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h2 className="text-base font-bold text-gray-900">成績入力</h2>
        </div>
        <div className="p-4 text-center text-sm text-gray-400">
          出場メンバーが登録されていません。試合登録画面でラインナップを設定してください。
        </div>
      </div>
    );
  }

  const player = players.find((p) => p.id === selectedPlayer) ?? players[0];

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
        {saveMessage && (
          <div className="rounded-lg bg-green-50 p-3 text-xs text-green-600">
            {saveMessage}
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* 選手選択 */}
        <select
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
        >
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.number} {p.name}
            </option>
          ))}
        </select>

        {/* 打撃成績 */}
        {activeTab === "batting" && battingStats[selectedPlayer] && (
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
                    { key: "sacrifice_hits", label: "犠打" },
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
              <div className="mb-3">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={isPitcher[selectedPlayer] ?? false}
                    onChange={(e) =>
                      setIsPitcher((prev) => ({
                        ...prev,
                        [selectedPlayer]: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  投手として登板
                </label>
              </div>
              {isPitcher[selectedPlayer] && pitchingStats[selectedPlayer] && (
                <>
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
                          value={pitchingStats[selectedPlayer][field.key] as string}
                          onChange={(e) =>
                            updatePitching(selectedPlayer, field.key, e.target.value)
                          }
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={pitchingStats[selectedPlayer].is_winning_pitcher}
                        onChange={(e) =>
                          updatePitching(selectedPlayer, "is_winning_pitcher", e.target.checked)
                        }
                        className="rounded"
                      />
                      勝利投手
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={pitchingStats[selectedPlayer].is_losing_pitcher}
                        onChange={(e) =>
                          updatePitching(selectedPlayer, "is_losing_pitcher", e.target.checked)
                        }
                        className="rounded"
                      />
                      敗戦投手
                    </label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* 守備成績 */}
        {activeTab === "fielding" && fieldingStats[selectedPlayer] && (
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
                    {players.map((p) => {
                      const stats = battingStats[p.id];
                      if (!stats) return null;
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

        <Button className="w-full" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "保存中..." : "成績を保存"}
        </Button>
      </div>
    </div>
  );
}
