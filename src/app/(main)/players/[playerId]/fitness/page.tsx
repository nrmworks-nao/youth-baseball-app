"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { StatsLineChart } from "@/components/features/charts/LineChart";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { supabase } from "@/lib/supabase/client";
import {
  getPlayerFitnessRecords,
  createPlayerFitnessRecord,
} from "@/lib/supabase/queries/players";
import { getMyChildren } from "@/lib/supabase/queries/players";
import type { PlayerFitnessRecord } from "@/types";

const FITNESS_FIELDS = [
  { key: "sprint_50m", label: "50m走", unit: "秒", step: "0.01" },
  { key: "throw_distance", label: "遠投", unit: "m", step: "0.1" },
  { key: "standing_jump", label: "立ち幅跳び", unit: "cm", step: "1" },
  { key: "sit_ups", label: "上体起こし", unit: "回", step: "1" },
] as const;

export default function FitnessPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { hasPermission } = usePermission(currentMembership?.permission_group ?? null);
  const [records, setRecords] = useState<PlayerFitnessRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    measured_at: "",
    sprint_50m: "",
    throw_distance: "",
    standing_jump: "",
    sit_ups: "",
    shuttle_run: "",
    flexibility: "",
    grip_strength: "",
  });

  useEffect(() => {
    if (teamLoading || !currentTeam) return;
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("ログインが必要です");
          setIsLoading(false);
          return;
        }

        const data = await getPlayerFitnessRecords(playerId);
        setRecords(data);

        // 権限チェック
        const isAdmin = hasPermission(["team_admin", "manager"]);
        const myChildren = await getMyChildren(user.id, currentTeam.id);
        const isMyChild = myChildren.some(
          (c) => c.players?.id === playerId || c.player_id === playerId
        );
        setCanEdit(isAdmin || isMyChild);
      } catch {
        setError("データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [playerId, currentTeam, teamLoading, hasPermission]);

  const handleSubmit = async () => {
    if (!currentTeam || !formData.measured_at) return;
    setIsSaving(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await createPlayerFitnessRecord({
        team_id: currentTeam.id,
        player_id: playerId,
        measured_at: formData.measured_at,
        sprint_50m: formData.sprint_50m ? parseFloat(formData.sprint_50m) : undefined,
        throw_distance: formData.throw_distance ? parseFloat(formData.throw_distance) : undefined,
        standing_jump: formData.standing_jump ? parseFloat(formData.standing_jump) : undefined,
        sit_ups: formData.sit_ups ? parseInt(formData.sit_ups) : undefined,
        shuttle_run: formData.shuttle_run ? parseFloat(formData.shuttle_run) : undefined,
        flexibility: formData.flexibility ? parseFloat(formData.flexibility) : undefined,
        grip_strength: formData.grip_strength ? parseFloat(formData.grip_strength) : undefined,
        recorded_by: user.id,
      });

      // リロード
      const data = await getPlayerFitnessRecords(playerId);
      setRecords(data);
      setShowForm(false);
      setFormData({
        measured_at: "",
        sprint_50m: "",
        throw_distance: "",
        standing_jump: "",
        sit_ups: "",
        shuttle_run: "",
        flexibility: "",
        grip_strength: "",
      });
    } catch {
      setError("記録の保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (error && records.length === 0) return <ErrorDisplay message={error} />;

  const latest = records.length > 0 ? records[records.length - 1] : null;
  const prev = records.length > 1 ? records[records.length - 2] : null;

  // チャート用データ（measured_atをフォーマット）
  const chartData = records.map((r) => ({
    measured_at: r.measured_at.slice(0, 7).replace("-", "/"),
    sprint_50m: r.sprint_50m ?? null,
    throw_distance: r.throw_distance ?? null,
    standing_jump: r.standing_jump ?? null,
    sit_ups: r.sit_ups ?? null,
  }));

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href={`/players/${playerId}`} className="p-1">
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
          <h2 className="text-base font-bold text-gray-900">体力測定</h2>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "閉じる" : "+ 記録"}
          </Button>
        )}
      </div>

      <div className="space-y-4 p-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* 入力フォーム */}
        {showForm && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">新規記録</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                label="測定日"
                type="date"
                value={formData.measured_at}
                onChange={(e) =>
                  setFormData({ ...formData, measured_at: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="50m走（秒）"
                  type="number"
                  step="0.01"
                  placeholder="例: 7.8"
                  value={formData.sprint_50m}
                  onChange={(e) =>
                    setFormData({ ...formData, sprint_50m: e.target.value })
                  }
                />
                <Input
                  label="遠投（m）"
                  type="number"
                  step="0.1"
                  placeholder="例: 42.5"
                  value={formData.throw_distance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      throw_distance: e.target.value,
                    })
                  }
                />
                <Input
                  label="立ち幅跳び（cm）"
                  type="number"
                  placeholder="例: 178"
                  value={formData.standing_jump}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      standing_jump: e.target.value,
                    })
                  }
                />
                <Input
                  label="上体起こし（回）"
                  type="number"
                  placeholder="例: 30"
                  value={formData.sit_ups}
                  onChange={(e) =>
                    setFormData({ ...formData, sit_ups: e.target.value })
                  }
                />
                <Input
                  label="シャトルラン"
                  type="number"
                  step="0.01"
                  placeholder="例: 45.5"
                  value={formData.shuttle_run}
                  onChange={(e) =>
                    setFormData({ ...formData, shuttle_run: e.target.value })
                  }
                />
                <Input
                  label="長座体前屈（cm）"
                  type="number"
                  step="0.1"
                  placeholder="例: 35.0"
                  value={formData.flexibility}
                  onChange={(e) =>
                    setFormData({ ...formData, flexibility: e.target.value })
                  }
                />
                <Input
                  label="握力（kg）"
                  type="number"
                  step="0.1"
                  placeholder="例: 22.0"
                  value={formData.grip_strength}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      grip_strength: e.target.value,
                    })
                  }
                />
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? "保存中..." : "記録する"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 最新データカード */}
        {latest && (
          <div className="grid grid-cols-2 gap-3">
            {FITNESS_FIELDS.map((field) => {
              const curr = latest[field.key];
              const prevVal = prev ? prev[field.key] : null;
              if (curr == null) return null;
              const hasPrev = prevVal != null;
              const diff = hasPrev
                ? field.key === "sprint_50m"
                  ? (prevVal as number) - curr
                  : curr - (prevVal as number)
                : 0;
              const isPositive = diff >= 0;
              return (
                <Card key={field.key}>
                  <CardContent className="p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">
                      {curr}
                      <span className="text-xs font-normal text-gray-500">
                        {field.unit}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{field.label}</div>
                    {hasPrev && (
                      <div
                        className={`mt-0.5 text-[10px] font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
                      >
                        {isPositive ? "+" : ""}
                        {field.key === "sprint_50m"
                          ? ((prevVal as number) - curr).toFixed(2)
                          : (curr - (prevVal as number)).toFixed(1)}
                        {field.unit}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* 50m走推移 */}
        {chartData.length > 0 && chartData.some((d) => d.sprint_50m != null) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">50m走 推移</CardTitle>
            </CardHeader>
            <CardContent>
              <StatsLineChart
                data={chartData}
                xAxisKey="measured_at"
                datasets={[
                  { dataKey: "sprint_50m", label: "50m走(秒)", color: "#dc2626" },
                ]}
                height={200}
                yAxisLabel="秒"
              />
            </CardContent>
          </Card>
        )}

        {/* 遠投推移 */}
        {chartData.length > 0 && chartData.some((d) => d.throw_distance != null) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">遠投 推移</CardTitle>
            </CardHeader>
            <CardContent>
              <StatsLineChart
                data={chartData}
                xAxisKey="measured_at"
                datasets={[
                  {
                    dataKey: "throw_distance",
                    label: "遠投(m)",
                    color: "#16a34a",
                  },
                ]}
                height={200}
                yAxisLabel="m"
              />
            </CardContent>
          </Card>
        )}

        {/* 測定履歴 */}
        {records.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">測定履歴</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">
                        日付
                      </th>
                      <th className="px-2 py-1.5 text-right font-medium text-gray-500">
                        50m
                      </th>
                      <th className="px-2 py-1.5 text-right font-medium text-gray-500">
                        遠投
                      </th>
                      <th className="px-2 py-1.5 text-right font-medium text-gray-500">
                        幅跳
                      </th>
                      <th className="px-2 py-1.5 text-right font-medium text-gray-500">
                        起こし
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...records].reverse().map((m) => (
                      <tr key={m.id} className="border-b border-gray-50">
                        <td className="px-2 py-1.5 text-gray-700">
                          {m.measured_at.slice(0, 7).replace("-", "/")}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {m.sprint_50m != null ? `${m.sprint_50m}秒` : "-"}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {m.throw_distance != null ? `${m.throw_distance}m` : "-"}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {m.standing_jump != null ? `${m.standing_jump}cm` : "-"}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {m.sit_ups != null ? `${m.sit_ups}回` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {records.length === 0 && !showForm && (
          <div className="py-12 text-center text-sm text-gray-400">
            体力測定の記録がありません
          </div>
        )}
      </div>
    </div>
  );
}
