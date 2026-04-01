"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { getMonthlySummary, getOverdueCount, getLedgerEntries, getInvoices } from "@/lib/supabase/queries/accounting";
import type { LedgerEntry, Invoice, InvoiceStatus } from "@/types";

export default function AccountingPage() {
  const router = useRouter();
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { canManageAccounting } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);

  const [monthlySummary, setMonthlySummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [overdueCount, setOverdueCount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<LedgerEntry[]>([]);
  const [paymentStatus, setPaymentStatus] = useState({ paid: 0, pending: 0, overdue: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teamLoading) return;
    if (!currentMembership) return;
    if (!canManageAccounting()) {
      router.replace("/");
      return;
    }
    if (!currentTeam) return;

    const load = async () => {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const [summary, overdue, entries, invoices] = await Promise.all([
          getMonthlySummary(currentTeam.id, year, month),
          getOverdueCount(currentTeam.id),
          getLedgerEntries(currentTeam.id),
          getInvoices(currentTeam.id),
        ]);

        setMonthlySummary(summary);
        setOverdueCount(overdue);
        setRecentTransactions(entries.slice(0, 5));

        // 今月の請求から入金状況を計算
        const thisMonthInvoices = invoices.filter((inv: Invoice) => {
          const issuedDate = new Date(inv.issued_at || inv.created_at);
          return issuedDate.getFullYear() === year && issuedDate.getMonth() + 1 === month;
        });
        const paid = thisMonthInvoices.filter((inv: Invoice) => inv.status === "paid").length;
        const pending = thisMonthInvoices.filter((inv: Invoice) => (inv.status as InvoiceStatus) === "pending").length;
        const overdueInv = thisMonthInvoices.filter((inv: Invoice) => inv.status === "overdue").length;
        setPaymentStatus({ paid, pending, overdue: overdueInv, total: thisMonthInvoices.length });
      } catch {
        setError("会計データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [currentTeam, currentMembership, teamLoading, canManageAccounting, router]);

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;

  const now = new Date();
  const paidPct = paymentStatus.total > 0 ? Math.round((paymentStatus.paid / paymentStatus.total) * 100) : 0;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">会計</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* 月別収支サマリー */}
        <Card>
          <CardHeader>
            <CardTitle>
              {now.getFullYear()}年{now.getMonth() + 1}月 収支
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <p className="text-[10px] text-gray-500">収入</p>
                <p className="text-sm font-bold text-green-700">
                  ¥{monthlySummary.income.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <p className="text-[10px] text-gray-500">支出</p>
                <p className="text-sm font-bold text-red-700">
                  ¥{monthlySummary.expense.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <p className="text-[10px] text-gray-500">残高</p>
                <p className="text-sm font-bold text-blue-700">
                  ¥{monthlySummary.balance.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 未納アラート */}
        {overdueCount > 0 && (
          <Link href="/accounting/status">
            <Card className="border-l-4 border-l-orange-400 transition-colors hover:bg-gray-50">
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                    <svg
                      className="h-5 w-5 text-orange-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      未納が{overdueCount}件あります
                    </p>
                    <p className="text-xs text-gray-500">タップして確認</p>
                  </div>
                </div>
                <Badge variant="warning">{overdueCount}件</Badge>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* 入金状況グラフ（簡易円グラフ） */}
        <Card>
          <CardHeader>
            <CardTitle>今月の入金状況</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentStatus.total === 0 ? (
              <p className="text-sm text-gray-400">今月の請求はありません</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="h-full w-full">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="3"
                      strokeDasharray={`${paidPct}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-900">{paidPct}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-600">入金済み: {paymentStatus.paid}件</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="text-xs text-gray-600">未入金: {paymentStatus.pending}件</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-xs text-gray-600">未納: {paymentStatus.overdue}件</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* メニュー */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/accounting/fees", label: "会費設定", icon: "⚙️" },
            { href: "/accounting/invoices", label: "請求一覧", icon: "📋" },
            { href: "/accounting/payments", label: "入金管理", icon: "💰" },
            { href: "/accounting/status", label: "支払い状況", icon: "📊" },
            { href: "/accounting/ledger", label: "収支台帳", icon: "📒" },
            { href: "/accounting/invoices/create", label: "請求作成", icon: "➕" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="p-4 text-center transition-colors hover:bg-gray-50">
                <span className="text-2xl">{item.icon}</span>
                <p className="mt-1 text-sm font-medium text-gray-900">{item.label}</p>
              </Card>
            </Link>
          ))}
        </div>

        {/* 最近の取引 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>最近の取引</CardTitle>
              <Link href="/accounting/ledger" className="text-xs font-medium text-green-600">
                すべて見る
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-gray-400">取引データがありません</p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          tx.entry_type === "income" ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <div>
                        <p className="text-sm text-gray-900">{tx.description}</p>
                        <p className="text-xs text-gray-400">{tx.entry_date}</p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        tx.entry_type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {tx.entry_type === "income" ? "+" : "-"}¥{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
