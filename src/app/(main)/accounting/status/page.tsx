"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { getInvoices } from "@/lib/supabase/queries/accounting";
import { getTeamMembers } from "@/lib/supabase/queries/members";
import type { Invoice, TeamMember } from "@/types";

const STATUS_CELL: Record<string, { bg: string; text: string; label: string }> = {
  paid: { bg: "bg-green-100", text: "text-green-700", label: "済" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "未" },
  partial: { bg: "bg-orange-100", text: "text-orange-700", label: "部" },
  overdue: { bg: "bg-red-100", text: "text-red-700", label: "滞" },
  none: { bg: "bg-gray-50", text: "text-gray-400", label: "-" },
};

export default function PaymentStatusPage() {
  const router = useRouter();
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { canManageAccounting } = usePermission(currentMembership?.permission_group ?? null);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  useEffect(() => {
    if (teamLoading) return;
    if (!currentMembership || !canManageAccounting()) {
      router.replace("/");
      return;
    }
    if (!currentTeam) return;

    const load = async () => {
      try {
        const [memberData, invoiceData] = await Promise.all([
          getTeamMembers(currentTeam.id),
          getInvoices(currentTeam.id),
        ]);
        // parent ロールのメンバーのみ
        setMembers(memberData.filter((m) => m.permission_group === "parent"));
        setInvoices(invoiceData);
      } catch {
        setError("データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [currentTeam, currentMembership, teamLoading, canManageAccounting, router]);

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;

  // 直近6ヶ月を生成
  const now = new Date();
  const months: { year: number; month: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${d.getMonth() + 1}月`,
    });
  }

  // メンバー×月のステータスマトリクスを構築
  const statusMap: Record<string, Record<string, string>> = {};
  for (const member of members) {
    statusMap[member.user_id] = {};
    for (const m of months) {
      // この月に発行された請求を探す
      const monthInvoices = invoices.filter((inv) => {
        if (inv.target_user_id !== member.user_id) return false;
        const issuedDate = new Date(inv.issued_at || inv.created_at);
        return issuedDate.getFullYear() === m.year && issuedDate.getMonth() + 1 === m.month;
      });
      if (monthInvoices.length === 0) {
        statusMap[member.user_id][m.label] = "none";
      } else {
        // 最も「悪い」ステータスを採用
        const statuses = monthInvoices.map((inv) => inv.status);
        if (statuses.includes("overdue")) {
          statusMap[member.user_id][m.label] = "overdue";
        } else if (statuses.includes("pending")) {
          statusMap[member.user_id][m.label] = "pending";
        } else if (statuses.includes("partial")) {
          statusMap[member.user_id][m.label] = "partial";
        } else {
          statusMap[member.user_id][m.label] = "paid";
        }
      }
    }
  }

  // 未納者フィルタ
  const displayMembers = showOverdueOnly
    ? members.filter((m) => Object.values(statusMap[m.user_id] ?? {}).includes("overdue"))
    : members;

  const overdueMembers = members.filter((m) =>
    Object.values(statusMap[m.user_id] ?? {}).includes("overdue")
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
        <button
          onClick={() => setShowOverdueOnly(!showOverdueOnly)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            showOverdueOnly ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          未納者のみ
        </button>
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
                    <span className="text-sm text-gray-900">
                      {m.users?.display_name ?? "不明"}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="danger">未納あり</Badge>
                      <Button size="sm" variant="outline">
                        {/* TODO: LINE通知によるリマインド送信 */}
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
            {displayMembers.length === 0 ? (
              <p className="text-sm text-gray-400">
                {showOverdueOnly ? "未納者はいません" : "メンバーがいません"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                        保護者
                      </th>
                      {months.map((m) => (
                        <th
                          key={m.label}
                          className="px-2 py-2 text-center text-xs font-medium text-gray-500"
                        >
                          {m.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayMembers.map((member) => (
                      <tr key={member.id} className="border-t border-gray-100">
                        <td className="px-2 py-2 text-sm text-gray-900">
                          {member.users?.display_name ?? "不明"}
                        </td>
                        {months.map((m) => {
                          const status = statusMap[member.user_id]?.[m.label] ?? "none";
                          const cell = STATUS_CELL[status] ?? STATUS_CELL.none;
                          return (
                            <td key={m.label} className="px-2 py-2 text-center">
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
            )}
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
