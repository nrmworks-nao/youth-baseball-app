"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { supabase } from "@/lib/supabase/client";
import {
  getPlayer,
  getPlayerAllStats,
  updatePlayer,
  getPlayerParents,
} from "@/lib/supabase/queries/players";
import { getMyChildren } from "@/lib/supabase/queries/players";
import type { Player, ParentPlayerRelation } from "@/types";

type ViewPeriod = "all" | "month" | "tournament";

const POSITIONS = [
  "ピッチャー",
  "キャッチャー",
  "ファースト",
  "セカンド",
  "サード",
  "ショート",
  "レフト",
  "センター",
  "ライト",
];

function calcBattingAvg(hits: number, atBats: number): string {
  if (atBats === 0) return "---";
  return (hits / atBats).toFixed(3);
}

function calcOBP(
  hits: number,
  walks: number,
  hbp: number,
  atBats: number,
  sf: number
): string {
  const denom = atBats + walks + hbp + sf;
  if (denom === 0) return "---";
  return ((hits + walks + hbp) / denom).toFixed(3);
}

function calcSLG(
  hits: number,
  doubles: number,
  triples: number,
  homeRuns: number,
  atBats: number
): string {
  if (atBats === 0) return "---";
  const singles = hits - doubles - triples - homeRuns;
  const totalBases = singles + doubles * 2 + triples * 3 + homeRuns * 4;
  return (totalBases / atBats).toFixed(3);
}

function calcOPS(obp: string, slg: string): string {
  if (obp === "---" || slg === "---") return "---";
  return (parseFloat(obp) + parseFloat(slg)).toFixed(3);
}

function calcERA(earnedRuns: number, inningsPitched: number): string {
  if (inningsPitched === 0) return "---";
  return ((earnedRuns * 7) / inningsPitched).toFixed(2);
}

function calcWHIP(
  hitsAllowed: number,
  walksAllowed: number,
  inningsPitched: number
): string {
  if (inningsPitched === 0) return "---";
  return ((hitsAllowed + walksAllowed) / inningsPitched).toFixed(2);
}

function calcFieldingPct(
  putouts: number,
  assists: number,
  errors: number
): string {
  const total = putouts + assists + errors;
  if (total === 0) return "---";
  return ((putouts + assists) / total).toFixed(3);
}

export default function PlayerDashboardPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [period, setPeriod] = useState<ViewPeriod>("all");
  const [player, setPlayer] = useState<Player | null>(null);
  const [parents, setParents] = useState<ParentPlayerRelation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Player>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Stats aggregation
  const [batting, setBatting] = useState({
    games: 0,
    at_bats: 0,
    hits: 0,
    doubles: 0,
    triples: 0,
    home_runs: 0,
    rbis: 0,
    walks: 0,
    strikeouts: 0,
    stolen_bases: 0,
    hit_by_pitch: 0,
    sacrifice_flies: 0,
  });
  const [pitching, setPitching] = useState({
    innings_pitched: 0,
    earned_runs: 0,
    hits_allowed: 0,
    walks_allowed: 0,
    strikeouts_pitched: 0,
    wins: 0,
    losses: 0,
  });
  const [fielding, setFielding] = useState({
    putouts: 0,
    assists: 0,
    errors: 0,
  });

  const loadData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("ログインが必要です");
        setIsLoading(false);
        return;
      }

      const [playerData, parentData] = await Promise.all([
        getPlayer(playerId),
        getPlayerParents(playerId),
      ]);
      setPlayer(playerData);
      setParents(parentData);

      // 編集権限チェック: team_admin/vice_president or 自分の子供
      const { data: myMember } = await supabase
        .from("team_members")
        .select("permission_group")
        .eq("user_id", user.id)
        .eq("team_id", playerData.team_id)
        .eq("is_active", true)
        .single();

      const isAdmin =
        myMember?.permission_group === "team_admin" ||
        myMember?.permission_group === "vice_president" ||
        myMember?.permission_group === "system_admin";

      const myChildren = await getMyChildren(user.id, playerData.team_id);
      const isMyChild = myChildren.some(
        (c) => c.players?.id === playerId || c.player_id === playerId
      );

      setCanEdit(isAdmin || isMyChild);

      // 試合成績集計
      try {
        const stats = await getPlayerAllStats(playerId);
        if (stats.length > 0) {
          const battingAgg = {
            games: stats.length,
            at_bats: stats.reduce((s, g) => s + g.at_bats, 0),
            hits: stats.reduce((s, g) => s + g.hits, 0),
            doubles: stats.reduce((s, g) => s + g.doubles, 0),
            triples: stats.reduce((s, g) => s + g.triples, 0),
            home_runs: stats.reduce((s, g) => s + g.home_runs, 0),
            rbis: stats.reduce((s, g) => s + g.rbis, 0),
            walks: stats.reduce((s, g) => s + g.walks, 0),
            strikeouts: stats.reduce((s, g) => s + g.strikeouts, 0),
            stolen_bases: stats.reduce((s, g) => s + g.stolen_bases, 0),
            hit_by_pitch: 0,
            sacrifice_flies: 0,
          };
          setBatting(battingAgg);

          const pitchingAgg = {
            innings_pitched: stats.reduce((s, g) => s + g.innings_pitched, 0),
            earned_runs: stats.reduce((s, g) => s + g.earned_runs, 0),
            hits_allowed: stats.reduce((s, g) => s + g.hits_allowed, 0),
            walks_allowed: stats.reduce((s, g) => s + g.walks_allowed, 0),
            strikeouts_pitched: stats.reduce(
              (s, g) => s + g.strikeouts_pitched,
              0
            ),
            wins: stats.filter((g) => g.is_winning_pitcher).length,
            losses: stats.filter((g) => g.is_losing_pitcher).length,
          };
          setPitching(pitchingAgg);

          const fieldingAgg = {
            putouts: stats.reduce((s, g) => s + g.putouts, 0),
            assists: stats.reduce((s, g) => s + g.assists, 0),
            errors: stats.reduce((s, g) => s + g.errors, 0),
          };
          setFielding(fieldingAgg);
        }
      } catch {
        // 成績データがない場合はデフォルト値のまま
      }

      setIsLoading(false);
    } catch {
      setError("データの取得に失敗しました");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  const handleStartEdit = () => {
    if (!player) return;
    setEditData({
      name: player.name,
      number: player.number,
      grade: player.grade,
      position: player.position,
      throwing_hand: player.throwing_hand,
      batting_hand: player.batting_hand,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await updatePlayer(playerId, editData);
      setIsEditing(false);
      loadData();
    } catch {
      // エラー処理
    }
    setIsSaving(false);
  };

  if (isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;
  if (!player) return <ErrorDisplay message="選手が見つかりません" />;

  const battingAvg = calcBattingAvg(batting.hits, batting.at_bats);
  const obp = calcOBP(
    batting.hits,
    batting.walks,
    batting.hit_by_pitch,
    batting.at_bats,
    batting.sacrifice_flies
  );
  const slg = calcSLG(
    batting.hits,
    batting.doubles,
    batting.triples,
    batting.home_runs,
    batting.at_bats
  );
  const ops = calcOPS(obp, slg);
  const era = calcERA(pitching.earned_runs, pitching.innings_pitched);
  const whip = calcWHIP(
    pitching.hits_allowed,
    pitching.walks_allowed,
    pitching.innings_pitched
  );
  const fieldingPct = calcFieldingPct(
    fielding.putouts,
    fielding.assists,
    fielding.errors
  );

  const periods: { key: ViewPeriod; label: string }[] = [
    { key: "all", label: "通算" },
    { key: "month", label: "今月" },
    { key: "tournament", label: "大会" },
  ];

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/players" className="p-1">
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
        <h2 className="flex-1 text-base font-bold text-gray-900">
          成長ダッシュボード
        </h2>
        {canEdit && !isEditing && (
          <Button size="sm" variant="outline" onClick={handleStartEdit}>
            編集
          </Button>
        )}
      </div>

      <div className="space-y-4 p-4">
        {/* 選手プロフィール */}
        {isEditing ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <Input
                label="名前"
                value={editData.name || ""}
                onChange={(e) =>
                  setEditData({ ...editData, name: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="背番号"
                  type="number"
                  value={editData.number?.toString() || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      number: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
                <Select
                  label="学年"
                  value={editData.grade?.toString() || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      grade: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                >
                  <option value="">選択</option>
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={g}>
                      {g}年
                    </option>
                  ))}
                </Select>
              </div>
              <Select
                label="ポジション"
                value={editData.position || ""}
                onChange={(e) =>
                  setEditData({ ...editData, position: e.target.value })
                }
              >
                <option value="">選択</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="投げ"
                  value={editData.throwing_hand || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, throwing_hand: e.target.value })
                  }
                >
                  <option value="">選択</option>
                  <option value="右投">右投</option>
                  <option value="左投">左投</option>
                </Select>
                <Select
                  label="打ち"
                  value={editData.batting_hand || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, batting_hand: e.target.value })
                  }
                >
                  <option value="">選択</option>
                  <option value="右打">右打</option>
                  <option value="左打">左打</option>
                  <option value="両打">両打</option>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                >
                  {isSaving ? "保存中..." : "保存"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditing(false)}
                >
                  キャンセル
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <span className="text-xl font-bold text-green-700">
                    {player.number ?? "-"}
                  </span>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {player.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {player.position || "未設定"}
                    {player.grade ? ` / ${player.grade}年生` : ""}
                  </div>
                  {(player.throwing_hand || player.batting_hand) && (
                    <div className="text-xs text-gray-400">
                      {player.throwing_hand}
                      {player.batting_hand}
                    </div>
                  )}
                </div>
              </div>
              {/* 保護者情報 */}
              {parents.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs font-medium text-gray-500">保護者</p>
                  {parents.map((p) => (
                    <p key={p.id} className="text-xs text-gray-600">
                      {p.users?.display_name || "不明"}
                      {p.relationship && `（${p.relationship}）`}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 期間切替 */}
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                period === p.key
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 主要指標 */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-white p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-gray-900">{battingAvg}</div>
            <div className="text-[10px] text-gray-500">打率</div>
          </div>
          <div className="rounded-lg bg-white p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-gray-900">{obp}</div>
            <div className="text-[10px] text-gray-500">出塁率</div>
          </div>
          <div className="rounded-lg bg-white p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-gray-900">{slg}</div>
            <div className="text-[10px] text-gray-500">長打率</div>
          </div>
          <div className="rounded-lg bg-white p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-green-700">{ops}</div>
            <div className="text-[10px] text-gray-500">OPS</div>
          </div>
        </div>

        {/* 打撃詳細 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">打撃成績</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <div className="grid grid-cols-5 gap-1 text-center text-xs">
              {[
                { label: "試合", value: batting.games },
                { label: "打数", value: batting.at_bats },
                { label: "安打", value: batting.hits },
                { label: "二塁打", value: batting.doubles },
                { label: "三塁打", value: batting.triples },
                { label: "本塁打", value: batting.home_runs },
                { label: "打点", value: batting.rbis },
                { label: "四球", value: batting.walks },
                { label: "三振", value: batting.strikeouts },
                { label: "盗塁", value: batting.stolen_bases },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-gray-50 p-2">
                  <div className="font-bold text-gray-900">{s.value}</div>
                  <div className="text-[10px] text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 投手・守備成績 */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs">投手成績</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">防御率</span>
                <span className="font-bold">{era}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">WHIP</span>
                <span className="font-bold">{whip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">投球回</span>
                <span>{pitching.innings_pitched}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">奪三振</span>
                <span>{pitching.strikeouts_pitched}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">勝-敗</span>
                <span>
                  {pitching.wins}-{pitching.losses}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs">守備成績</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">守備率</span>
                <span className="font-bold">{fieldingPct}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">刺殺</span>
                <span>{fielding.putouts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">補殺</span>
                <span>{fielding.assists}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">失策</span>
                <span>{fielding.errors}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* リンク */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/players/${playerId}/measurements`}>
            <Button variant="outline" className="w-full text-sm">
              身体測定
            </Button>
          </Link>
          <Link href={`/players/${playerId}/fitness`}>
            <Button variant="outline" className="w-full text-sm">
              体力測定
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
