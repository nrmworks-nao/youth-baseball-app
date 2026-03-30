"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatsLineChart } from "@/components/features/charts/LineChart";

// デモデータ
const DEMO_MEASUREMENTS = [
  { measured_at: "2025/04", height_cm: 138.5, weight_kg: 32.0 },
  { measured_at: "2025/06", height_cm: 140.2, weight_kg: 33.1 },
  { measured_at: "2025/08", height_cm: 141.8, weight_kg: 34.0 },
  { measured_at: "2025/10", height_cm: 143.0, weight_kg: 34.8 },
  { measured_at: "2025/12", height_cm: 144.5, weight_kg: 35.5 },
  { measured_at: "2026/02", height_cm: 146.0, weight_kg: 36.2 },
];

export default function MeasurementsPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    measured_at: "",
    height_cm: "",
    weight_kg: "",
  });

  const latest = DEMO_MEASUREMENTS[DEMO_MEASUREMENTS.length - 1];
  const prev = DEMO_MEASUREMENTS[DEMO_MEASUREMENTS.length - 2];
  const heightDiff = latest.height_cm - prev.height_cm;
  const weightDiff = latest.weight_kg - prev.weight_kg;

  const handleSubmit = () => {
    // TODO: createPlayerMeasurement() API呼び出し
    alert("身体測定を記録しました（デモ）");
    setShowForm(false);
    setFormData({ measured_at: "", height_cm: "", weight_kg: "" });
  };

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
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "閉じる" : "+ 記録"}
        </Button>
      </div>

      <div className="space-y-4 p-4">
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
              <Button className="w-full" onClick={handleSubmit}>
                記録する
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 最新データ */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {latest.height_cm}
                <span className="text-sm font-normal text-gray-500">cm</span>
              </div>
              <div className="text-xs text-gray-500">身長</div>
              <div
                className={`mt-1 text-xs font-medium ${heightDiff >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {heightDiff >= 0 ? "+" : ""}
                {heightDiff.toFixed(1)}cm
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {latest.weight_kg}
                <span className="text-sm font-normal text-gray-500">kg</span>
              </div>
              <div className="text-xs text-gray-500">体重</div>
              <div
                className={`mt-1 text-xs font-medium ${weightDiff >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {weightDiff >= 0 ? "+" : ""}
                {weightDiff.toFixed(1)}kg
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 身長推移 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">身長推移</CardTitle>
          </CardHeader>
          <CardContent>
            <StatsLineChart
              data={DEMO_MEASUREMENTS}
              xAxisKey="measured_at"
              datasets={[
                { dataKey: "height_cm", label: "身長(cm)", color: "#16a34a" },
              ]}
              height={200}
              yAxisLabel="cm"
            />
          </CardContent>
        </Card>

        {/* 体重推移 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">体重推移</CardTitle>
          </CardHeader>
          <CardContent>
            <StatsLineChart
              data={DEMO_MEASUREMENTS}
              xAxisKey="measured_at"
              datasets={[
                { dataKey: "weight_kg", label: "体重(kg)", color: "#2563eb" },
              ]}
              height={200}
              yAxisLabel="kg"
            />
          </CardContent>
        </Card>

        {/* 記録一覧 */}
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
                {[...DEMO_MEASUREMENTS].reverse().map((m) => (
                  <tr key={m.measured_at} className="border-b border-gray-50">
                    <td className="px-2 py-1.5 text-gray-700">
                      {m.measured_at}
                    </td>
                    <td className="px-2 py-1.5 text-right font-medium">
                      {m.height_cm} cm
                    </td>
                    <td className="px-2 py-1.5 text-right font-medium">
                      {m.weight_kg} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
