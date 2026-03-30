"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatsLineChart } from "@/components/features/charts/LineChart";

// デモデータ
const DEMO_FITNESS = [
  {
    measured_at: "2025/04",
    sprint_50m: 8.5,
    throw_distance: 32.0,
    standing_jump: 160,
    sit_ups: 18,
  },
  {
    measured_at: "2025/07",
    sprint_50m: 8.3,
    throw_distance: 35.0,
    standing_jump: 165,
    sit_ups: 22,
  },
  {
    measured_at: "2025/10",
    sprint_50m: 8.1,
    throw_distance: 38.0,
    standing_jump: 170,
    sit_ups: 25,
  },
  {
    measured_at: "2026/01",
    sprint_50m: 7.9,
    throw_distance: 40.0,
    standing_jump: 175,
    sit_ups: 28,
  },
  {
    measured_at: "2026/03",
    sprint_50m: 7.8,
    throw_distance: 42.5,
    standing_jump: 178,
    sit_ups: 30,
  },
];

const FITNESS_FIELDS = [
  { key: "sprint_50m", label: "50m走", unit: "秒", step: "0.01" },
  { key: "throw_distance", label: "遠投", unit: "m", step: "0.1" },
  { key: "standing_jump", label: "立ち幅跳び", unit: "cm", step: "1" },
  { key: "sit_ups", label: "上体起こし", unit: "回", step: "1" },
] as const;

export default function FitnessPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  const [showForm, setShowForm] = useState(false);
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

  const latest = DEMO_FITNESS[DEMO_FITNESS.length - 1];
  const prev = DEMO_FITNESS[DEMO_FITNESS.length - 2];

  const handleSubmit = () => {
    // TODO: createPlayerFitnessRecord() API呼び出し
    alert("体力測定を記録しました（デモ）");
    setShowForm(false);
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
          <h2 className="text-base font-bold text-gray-900">体力測定</h2>
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
              <Button className="w-full" onClick={handleSubmit}>
                記録する
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 最新データカード */}
        <div className="grid grid-cols-2 gap-3">
          {FITNESS_FIELDS.map((field) => {
            const curr = latest[field.key];
            const prevVal = prev[field.key];
            // 50m走は小さいほど良い（差分を逆にする）
            const diff = field.key === "sprint_50m" ? prevVal - curr : curr - prevVal;
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
                  <div
                    className={`mt-0.5 text-[10px] font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
                  >
                    {isPositive ? "+" : ""}
                    {field.key === "sprint_50m"
                      ? (prevVal - curr).toFixed(2)
                      : (curr - prevVal).toFixed(1)}
                    {field.unit}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 50m走推移 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">50m走 推移</CardTitle>
          </CardHeader>
          <CardContent>
            <StatsLineChart
              data={DEMO_FITNESS}
              xAxisKey="measured_at"
              datasets={[
                { dataKey: "sprint_50m", label: "50m走(秒)", color: "#dc2626" },
              ]}
              height={200}
              yAxisLabel="秒"
            />
          </CardContent>
        </Card>

        {/* 遠投推移 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">遠投 推移</CardTitle>
          </CardHeader>
          <CardContent>
            <StatsLineChart
              data={DEMO_FITNESS}
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

        {/* 測定履歴 */}
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
                  {[...DEMO_FITNESS].reverse().map((m) => (
                    <tr key={m.measured_at} className="border-b border-gray-50">
                      <td className="px-2 py-1.5 text-gray-700">
                        {m.measured_at}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        {m.sprint_50m}秒
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        {m.throw_distance}m
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        {m.standing_jump}cm
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        {m.sit_ups}回
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
