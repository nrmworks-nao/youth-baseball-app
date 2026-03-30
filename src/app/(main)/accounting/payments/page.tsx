"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const DEMO_PENDING_INVOICES = [
  { id: "inv1", title: "3月会費", target_user_name: "佐藤花子", total_amount: 5000 },
  { id: "inv2", title: "3月会費", target_user_name: "鈴木一郎", total_amount: 5000 },
  { id: "inv3", title: "春季大会参加費", target_user_name: "佐藤花子", total_amount: 3000 },
];

const DEMO_PAYMENTS = [
  {
    id: "p1",
    payer_name: "田中太郎",
    amount: 5000,
    payment_method: "cash",
    paid_at: "2026-03-28",
    invoice_title: "3月会費",
    confirmed: true,
  },
  {
    id: "p2",
    payer_name: "佐藤花子",
    amount: 5000,
    payment_method: "bank_transfer",
    paid_at: "2026-03-27",
    invoice_title: "3月会費",
    confirmed: true,
  },
  {
    id: "p3",
    payer_name: "渡辺美咲",
    amount: 5000,
    payment_method: "cash",
    paid_at: "2026-03-26",
    invoice_title: "3月会費",
    confirmed: false,
  },
];

const METHOD_LABELS: Record<string, string> = {
  cash: "現金",
  bank_transfer: "銀行振込",
  other: "その他",
};

export default function PaymentsPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/accounting" className="text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h2 className="text-base font-bold text-gray-900">入金管理</h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "閉じる" : "+ 入金記録"}
        </Button>
      </div>

      <div className="space-y-4 p-4">
        {/* 入金記録フォーム */}
        {showForm && (
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-900">入金記録</h3>
            <div className="space-y-3">
              <Select
                label="請求を選択（消込）"
                value={selectedInvoice}
                onChange={(e) => setSelectedInvoice(e.target.value)}
              >
                <option value="">紐づけなし（直接入金）</option>
                {DEMO_PENDING_INVOICES.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.title} - {inv.target_user_name} (¥{inv.total_amount.toLocaleString()})
                  </option>
                ))}
              </Select>
              <Input label="金額（円）" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Select label="支払方法" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="cash">現金</option>
                <option value="bank_transfer">銀行振込</option>
                <option value="other">その他</option>
              </Select>
              <Input label="入金日" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
              <Input label="備考（任意）" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="" />
              <Button className="w-full">入金を記録</Button>
            </div>
          </Card>
        )}

        {/* 未消込の請求 */}
        <Card>
          <CardHeader>
            <CardTitle>消込待ち</CardTitle>
          </CardHeader>
          <CardContent>
            {DEMO_PENDING_INVOICES.length === 0 ? (
              <p className="text-sm text-gray-400">消込待ちの請求はありません</p>
            ) : (
              <div className="space-y-2">
                {DEMO_PENDING_INVOICES.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg bg-yellow-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.title}</p>
                      <p className="text-xs text-gray-500">{inv.target_user_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">¥{inv.total_amount.toLocaleString()}</p>
                      <Badge variant="warning">未払い</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 入金履歴 */}
        <Card>
          <CardHeader>
            <CardTitle>入金履歴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {DEMO_PAYMENTS.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{payment.payer_name}</p>
                      {payment.confirmed && <Badge variant="primary">確認済</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">
                      {payment.invoice_title} · {METHOD_LABELS[payment.payment_method]} · {payment.paid_at}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-green-600">
                    +¥{payment.amount.toLocaleString()}
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
