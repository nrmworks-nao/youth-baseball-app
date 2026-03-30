"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DEMO_MY_INVOICES = [
  { id: "1", title: "3月会費", amount: 5000, status: "paid", due_date: "2026-03-31", paid_at: "2026-03-15" },
  { id: "2", title: "春季大会参加費", amount: 3000, status: "pending", due_date: "2026-04-10", paid_at: null },
  { id: "3", title: "2月会費", amount: 5000, status: "paid", due_date: "2026-02-28", paid_at: "2026-02-10" },
  { id: "4", title: "1月会費", amount: 5000, status: "paid", due_date: "2026-01-31", paid_at: "2026-01-08" },
];

const DEMO_MY_PAYMENTS = [
  { id: "p1", amount: 5000, method: "現金", paid_at: "2026-03-15", invoice_title: "3月会費" },
  { id: "p2", amount: 5000, method: "銀行振込", paid_at: "2026-02-10", invoice_title: "2月会費" },
  { id: "p3", amount: 5000, method: "現金", paid_at: "2026-01-08", invoice_title: "1月会費" },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "primary" | "warning" | "danger" | "default" }> = {
  paid: { label: "支払済", variant: "primary" },
  pending: { label: "未払い", variant: "warning" },
  overdue: { label: "未納", variant: "danger" },
  cancelled: { label: "キャンセル", variant: "default" },
};

export default function MyPaymentsPage() {
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
            <div className="space-y-2">
              {DEMO_MY_INVOICES.map((inv) => {
                const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.pending;
                return (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{inv.title}</p>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                      <p className="text-xs text-gray-400">
                        期限: {inv.due_date}
                        {inv.paid_at && ` · 支払日: ${inv.paid_at}`}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">¥{inv.amount.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 支払い履歴 */}
        <Card>
          <CardHeader>
            <CardTitle>支払い履歴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {DEMO_MY_PAYMENTS.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-lg p-2">
                  <div>
                    <p className="text-sm text-gray-900">{payment.invoice_title}</p>
                    <p className="text-xs text-gray-400">
                      {payment.paid_at} · {payment.method}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-green-600">
                    ¥{payment.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
