"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DEMO_INVOICES = [
  {
    id: "1",
    title: "3月会費",
    target_user_name: "田中太郎",
    total_amount: 5000,
    status: "paid",
    due_date: "2026-03-31",
    issued_at: "2026-03-01",
  },
  {
    id: "2",
    title: "3月会費",
    target_user_name: "佐藤花子",
    total_amount: 5000,
    status: "pending",
    due_date: "2026-03-31",
    issued_at: "2026-03-01",
  },
  {
    id: "3",
    title: "3月会費",
    target_user_name: "鈴木一郎",
    total_amount: 5000,
    status: "overdue",
    due_date: "2026-03-15",
    issued_at: "2026-03-01",
  },
  {
    id: "4",
    title: "春季大会参加費",
    target_user_name: "佐藤花子",
    total_amount: 3000,
    status: "pending",
    due_date: "2026-03-20",
    issued_at: "2026-03-10",
  },
  {
    id: "5",
    title: "2月会費",
    target_user_name: "田中太郎",
    total_amount: 5000,
    status: "paid",
    due_date: "2026-02-28",
    issued_at: "2026-02-01",
  },
  {
    id: "6",
    title: "3月会費",
    target_user_name: "高橋健太",
    total_amount: 5000,
    status: "cancelled",
    due_date: "2026-03-31",
    issued_at: "2026-03-01",
  },
];

type StatusFilter = "all" | "pending" | "paid" | "overdue" | "cancelled";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "primary" | "warning" | "danger" }
> = {
  pending: { label: "未払い", variant: "warning" },
  paid: { label: "支払済", variant: "primary" },
  partial: { label: "一部支払", variant: "warning" },
  overdue: { label: "未納", variant: "danger" },
  cancelled: { label: "キャンセル", variant: "default" },
};

export default function InvoicesPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filteredInvoices =
    filter === "all"
      ? DEMO_INVOICES
      : DEMO_INVOICES.filter((inv) => inv.status === filter);

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "pending", label: "未払い" },
    { key: "paid", label: "支払済" },
    { key: "overdue", label: "未納" },
    { key: "cancelled", label: "キャンセル" },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/accounting" className="text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h2 className="text-base font-bold text-gray-900">請求一覧</h2>
        </div>
        <Link href="/accounting/invoices/create">
          <Button size="sm">+ 請求作成</Button>
        </Link>
      </div>

      {/* フィルター */}
      <div className="flex gap-2 overflow-x-auto bg-white px-4 py-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 一覧 */}
      <div className="space-y-2 p-4">
        {filteredInvoices.map((invoice) => {
          const statusCfg = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.pending;
          return (
            <Card key={invoice.id} className="p-4 transition-colors hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      {invoice.title}
                    </h3>
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {invoice.target_user_name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    期限: {invoice.due_date}
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  ¥{invoice.total_amount.toLocaleString()}
                </p>
              </div>
            </Card>
          );
        })}
        {filteredInvoices.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            該当する請求がありません
          </p>
        )}
      </div>
    </div>
  );
}
