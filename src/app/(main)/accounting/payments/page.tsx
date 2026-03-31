"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { supabase } from "@/lib/supabase/client";
import { getPayments, getInvoices, createPayment, updateInvoiceStatus } from "@/lib/supabase/queries/accounting";
import type { Payment, Invoice } from "@/types";

type InvoiceWithUser = Invoice & { users?: { display_name: string } };
type PaymentWithUser = Payment & { users?: { display_name: string } };

const METHOD_LABELS: Record<string, string> = {
  cash: "現金",
  bank_transfer: "銀行振込",
  other: "その他",
};

export default function PaymentsPage() {
  const router = useRouter();
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { hasPermission } = usePermission(currentMembership?.permission_group ?? null);

  const canManage = hasPermission(["team_admin", "treasurer"]);

  const [payments, setPayments] = useState<PaymentWithUser[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<InvoiceWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async () => {
    if (!currentTeam) return;
    try {
      const [paymentData, invoiceData] = await Promise.all([
        getPayments(currentTeam.id),
        getInvoices(currentTeam.id),
      ]);
      setPayments(paymentData as PaymentWithUser[]);
      setPendingInvoices((invoiceData as InvoiceWithUser[]).filter((inv) => inv.status === "pending" || inv.status === "overdue"));
    } catch {
      setError("データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (teamLoading) return;
    if (!currentMembership || !canManage) {
      router.replace("/");
      return;
    }
    if (!currentTeam) return;
    loadData();
  }, [currentTeam, currentMembership, teamLoading, canManage, router, loadData]);

  const handleSubmit = async () => {
    if (!currentTeam || !amount) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 請求が選択されている場合、その請求のtarget_user_idを使用
      const invoice = selectedInvoice
        ? pendingInvoices.find((inv) => inv.id === selectedInvoice)
        : null;
      const payerUserId = invoice ? invoice.target_user_id : user.id;

      await createPayment({
        team_id: currentTeam.id,
        invoice_id: selectedInvoice || undefined,
        payer_user_id: payerUserId,
        amount: parseInt(amount),
        payment_method: method,
        paid_at: paidAt,
        confirmed_by: user.id,
        notes: notes || undefined,
      });

      // 消込処理: 請求に紐づけた場合、ステータスを更新
      if (invoice) {
        const paidAmount = parseInt(amount);
        if (paidAmount >= invoice.total_amount) {
          await updateInvoiceStatus(invoice.id, "paid");
        } else {
          await updateInvoiceStatus(invoice.id, "partial");
        }
      }

      // フォームリセット
      setSelectedInvoice("");
      setAmount("");
      setMethod("cash");
      setPaidAt(new Date().toISOString().split("T")[0]);
      setNotes("");
      setShowForm(false);

      await loadData();
    } catch {
      setError("入金記録の作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  // 請求選択時に金額を自動入力
  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoice(invoiceId);
    if (invoiceId) {
      const inv = pendingInvoices.find((i) => i.id === invoiceId);
      if (inv) setAmount(String(inv.total_amount));
    }
  };

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;

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
                onChange={(e) => handleInvoiceSelect(e.target.value)}
              >
                <option value="">紐づけなし（直接入金）</option>
                {pendingInvoices.map((inv) => {
                  const userName = inv.users?.display_name ?? "";
                  return (
                    <option key={inv.id} value={inv.id}>
                      {inv.title} - {userName} (¥{inv.total_amount.toLocaleString()})
                    </option>
                  );
                })}
              </Select>
              <Input label="金額（円）" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Select label="支払方法" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="cash">現金</option>
                <option value="bank_transfer">銀行振込</option>
                <option value="other">その他</option>
              </Select>
              <Input label="入金日" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
              <Input label="備考（任意）" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="" />
              <Button className="w-full" onClick={handleSubmit} disabled={submitting || !amount}>
                {submitting ? "記録中..." : "入金を記録"}
              </Button>
            </div>
          </Card>
        )}

        {/* 未消込の請求 */}
        <Card>
          <CardHeader>
            <CardTitle>消込待ち</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingInvoices.length === 0 ? (
              <p className="text-sm text-gray-400">消込待ちの請求はありません</p>
            ) : (
              <div className="space-y-2">
                {pendingInvoices.map((inv) => {
                  const userName = inv.users?.display_name ?? "";
                  return (
                    <div key={inv.id} className="flex items-center justify-between rounded-lg bg-yellow-50 p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{inv.title}</p>
                        <p className="text-xs text-gray-500">{userName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">¥{inv.total_amount.toLocaleString()}</p>
                        <Badge variant={inv.status === "overdue" ? "danger" : "warning"}>
                          {inv.status === "overdue" ? "未納" : "未払い"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
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
            {payments.length === 0 ? (
              <p className="text-sm text-gray-400">入金記録がありません</p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => {
                  const payerName = payment.users?.display_name ?? "";
                  return (
                    <div key={payment.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{payerName}</p>
                          {payment.confirmed_by && <Badge variant="primary">確認済</Badge>}
                        </div>
                        <p className="text-xs text-gray-500">
                          {payment.payment_method ? METHOD_LABELS[payment.payment_method] ?? payment.payment_method : ""} · {payment.paid_at}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-green-600">
                        +¥{payment.amount.toLocaleString()}
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
