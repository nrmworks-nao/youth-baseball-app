"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { supabase } from "@/lib/supabase/client";
import { getMyInvoices, getMyPayments } from "@/lib/supabase/queries/accounting";
import type { Invoice, Payment } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; variant: "primary" | "warning" | "danger" | "default" }> = {
  paid: { label: "支払済", variant: "primary" },
  pending: { label: "未払い", variant: "warning" },
  partial: { label: "一部支払", variant: "warning" },
  overdue: { label: "未納", variant: "danger" },
  cancelled: { label: "キャンセル", variant: "default" },
};

const METHOD_LABELS: Record<string, string> = {
  cash: "現金",
  bank_transfer: "銀行振込",
  other: "その他",
};

export default function MyPaymentsPage() {
  const { currentTeam, isLoading: teamLoading } = useCurrentTeam();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teamLoading) return;

    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const [invoiceData, paymentData] = await Promise.all([
          getMyInvoices(user.id),
          getMyPayments(user.id),
        ]);

        setInvoices(invoiceData);
        setPayments(paymentData);
      } catch {
        setError("支払いデータの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [teamLoading]);

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/mypage" className="text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h2 className="text-base font-bold text-gray-900">マイ支払い</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* 請求一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>請求</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-sm text-gray-400">請求はありません</p>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => {
                  const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.pending;
                  return (
                    <div key={inv.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{inv.title}</p>
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                        <p className="text-xs text-gray-400">
                          {inv.due_date ? `期限: ${inv.due_date}` : ""}
                          {inv.paid_at ? ` · 支払日: ${inv.paid_at}` : ""}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">¥{inv.total_amount.toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 支払い履歴 */}
        <Card>
          <CardHeader>
            <CardTitle>支払い履歴</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-400">支払い記録がありません</p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => {
                  const invoiceTitle = (payment as Record<string, unknown>).invoices
                    ? ((payment as Record<string, unknown>).invoices as { title: string }).title
                    : "";
                  return (
                    <div key={payment.id} className="flex items-center justify-between rounded-lg p-2">
                      <div>
                        <p className="text-sm text-gray-900">{invoiceTitle || "直接入金"}</p>
                        <p className="text-xs text-gray-400">
                          {payment.paid_at} · {payment.payment_method ? METHOD_LABELS[payment.payment_method] ?? payment.payment_method : ""}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-green-600">
                        ¥{payment.amount.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
