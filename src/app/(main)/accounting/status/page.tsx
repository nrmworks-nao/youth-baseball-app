"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// デモデータ: 保護者×月のマトリクス
const DEMO_MEMBERS = [
  { id: "u1", name: "田中太郎" },
  { id: "u2", name: "佐藤花子" },
  { id: "u3", name: "鈴木一郎" },
  { id: "u4", name: "高橋健太" },
  { id: "u5", name: "渡辺美咲" },
];

const MONTHS = ["1月", "2月", "3月"];

// ステータス: paid, pending, overdue, none
const STATUS_MAP: Record<string, Record<string, string>> = {
  u1: { "1月": "paid", "2月": "paid", "3月": "paid" },
  u2: { "1月": "paid", "2月": "paid", "3月": "pending" },
  u3: { "1月": "paid", "2月": "paid", "3月": "overdue" },
  u4: { "1月": "paid", "2月": "overdue", "3月": "overdue" },
  u5: { "1月": "paid", "2月": "paid", "3月": "paid" },
};

const STATUS_CELL: Record<string, { bg: string; text: string; label: string }> = {
  paid: { bg: "bg-green-100", text: "text-green-700", label: "済" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "未" },
  overdue: { bg: "bg-red-100", text: "text-red-700", label: "滞" },
  none: { bg: "bg-gray-50", text: "text-gray-400", label: "-" },
};

export default function PaymentStatusPage() {
  const overdueMembers = DEMO_MEMBERS.filter((m) =>
    Object.values(STATUS_MAP[m.id] ?? {}).includes("overdue")
  );

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/accounting" className="text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h2 className="text-base font-bold text-gray-900">支払い状況</h2>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* 未納者ハイライト */}
        {overdueMembers.length > 0 && (
          <Card className="border-l-4 border-l-red-400">
            <CardHeader>
              <CardTitle>未納者</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overdueMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">{m.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="danger">未納あり</Badge>
                      <Button size="sm" variant="outline">
                        リマインド送信
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* マトリクス表示 */}
        <Card>
          <CardHeader>
            <CardTitle>保護者 × 月 支払い状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                      保護者
                    </th>
                    {MONTHS.map((m) => (
                      <th
                        key={m}
                        className="px-2 py-2 text-center text-xs font-medium text-gray-500"
                      >
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEMO_MEMBERS.map((member) => (
                    <tr key={member.id} className="border-t border-gray-100">
                      <td className="px-2 py-2 text-sm text-gray-900">
                        {member.name}
                      </td>
                      {MONTHS.map((month) => {
                        const status = STATUS_MAP[member.id]?.[month] ?? "none";
                        const cell = STATUS_CELL[status];
                        return (
                          <td key={month} className="px-2 py-2 text-center">
                            <span
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${cell.bg} ${cell.text}`}
                            >
                              {cell.label}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* 凡例 */}
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-green-100" /> 支払済
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-yellow-100" /> 未払い
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-red-100" /> 未納
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
