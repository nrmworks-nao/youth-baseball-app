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
  getPlayerMeasurements,
  createPlayerMeasurement,
} from "@/lib/supabase/queries/players";
import { getMyChildren } from "@/lib/supabase/queries/players";
import type { PlayerMeasurement } from "@/types";

export default function MeasurementsPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { hasPermission } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);
  const [records, setRecords] = useState<PlayerMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    measured_at: "",
    height_cm: "",
    weight_kg: "",
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

        const data = await getPlayerMeasurements(playerId);
        setRecords(data);

        // 権限チェック
        const isAdmin = hasPermission(["director", "coach"]);
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

      await createPlayerMeasurement({
        team_id: currentTeam.id,
        player_id: playerId,
        measured_at: formData.measured_at,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : undefined,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        recorded_by: user.id,
      });

      const data = await getPlayerMeasurements(playerId);
      setRecords(data);
      setShowForm(false);
      setFormData({ measured_at: "", height_cm: "", weight_kg: "" });
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
  const heightDiff = latest && prev && latest.height_cm != null && prev.height_cm != null
    ? latest.height_cm - prev.height_cm
    : null;
  const weightDiff = latest && prev && latest.weight_kg != null && prev.weight_kg != null
    ? latest.weight_kg - prev.weight_kg
    : null;

  const chartData = records.map((r) => ({
    measured_at: r.measured_at.slice(0, 7).replace("-", "/"),
    height_cm: r.height_cm ?? null,
    weight_kg: r.weight_kg ?? null,
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
          <h2 className="text-base font-bold text-gray-900">身体測定</h2>
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
                  label="身長（cm）"
                  type="number"
                  step="0.1"
                  placeholder="例: 146.0"
                  value={formData.height_cm}
                  onChange={(e) =>
                    setFormData({ ...formData, height_cm: e.target.value })
                  }
                />
                <Input
                  label="体重（kg）"
                  type="number"
                  step="0.1"
                  placeholder="例: 36.2"
                  value={formData.weight_kg}
                  onChange={(e) =>
                    setFormData({ ...formData, weight_kg: e.target.value })
                  }
                />
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? "保存中..." : "記録する"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 最新データ */}
        {latest && (
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {latest.height_cm ?? "-"}
                  <span className="text-sm font-normal text-gray-500">cm</span>
                </div>
                <div className="text-xs text-gray-500">身長</div>
                {heightDiff != null && (
                  <div
                    className={`mt-1 text-xs font-medium ${heightDiff >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {heightDiff >= 0 ? "+" : ""}
                    {heightDiff.toFixed(1)}cm
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {latest.weight_kg ?? "-"}
                  <span className="text-sm font-normal text-gray-500">kg</span>
                </div>
                <div className="text-xs text-gray-500">体重</div>
                {weightDiff != null && (
                  <div
                    className={`mt-1 text-xs font-medium ${weightDiff >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {weightDiff >= 0 ? "+" : ""}
                    {weightDiff.toFixed(1)}kg
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 身長推移 */}
        {chartData.length > 0 && chartData.some((d) => d.height_cm != null) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">身長推移</CardTitle>
            </CardHeader>
            <CardContent>
              <StatsLineChart
                data={chartData}
                xAxisKey="measured_at"
                datasets={[
                  { dataKey: "height_cm", label: "身長(cm)", color: "#16a34a" },
                ]}
                height={200}
                yAxisLabel="cm"
              />
            </CardContent>
          </Card>
        )}

        {/* 体重推移 */}
        {chartData.length > 0 && chartData.some((d) => d.weight_kg != null) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">体重推移</CardTitle>
            </CardHeader>
            <CardContent>
              <StatsLineChart
                data={chartData}
                xAxisKey="measured_at"
                datasets={[
                  { dataKey: "weight_kg", label: "体重(kg)", color: "#2563eb" },
                ]}
                height={200}
                yAxisLabel="kg"
              />
            </CardContent>
          </Card>
        )}

        {/* 記録一覧 */}
        {records.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">測定履歴</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500">
                      測定日
                    </th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500">
                      身長
                    </th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500">
                      体重
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...records].reverse().map((m) => (
                    <tr key={m.id} className="border-b border-gray-50">
                      <td className="px-2 py-1.5 text-gray-700">
                        {m.measured_at.slice(0, 7).replace("-", "/")}
                      </td>
                      <td className="px-2 py-1.5 text-right font-medium">
                        {m.height_cm != null ? `${m.height_cm} cm` : "-"}
                      </td>
                      <td className="px-2 py-1.5 text-right font-medium">
                        {m.weight_kg != null ? `${m.weight_kg} kg` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {records.length === 0 && !showForm && (
          <div className="py-12 text-center text-sm text-gray-400">
            身体測定の記録がありません
          </div>
        )}
      </div>
    </div>
  );
}
