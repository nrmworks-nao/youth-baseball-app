"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { getInvoice, getInvoicePayments, cancelInvoice } from "@/lib/supabase/queries/accounting";
import type { Invoice, Payment, InvoiceItem } from "@/types";

type InvoiceWithUser = Invoice & {
  users?: { display_name: string };
  invoice_items?: InvoiceItem[];
};
type PaymentWithUser = Payment & { users?: { display_name: string } };

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

const METHOD_LABELS: Record<string, string> = {
  cash: "現金",
  bank_transfer: "銀行振込",
  other: "その他",
};

/** タイムスタンプや日付文字列を YYYY/MM/DD 形式にフォーマット */
function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.invoiceId as string;
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { canManageAccounting, hasPermission } = usePermission(
    currentMembership?.permission_group ?? null,
    currentMembership?.is_admin ?? false
  );

  const canEdit = hasPermission(["president", "vice_president", "treasurer"]);

  const [invoice, setInvoice] = useState<InvoiceWithUser | null>(null);
  const [payments, setPayments] = useState<PaymentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [invoiceData, paymentData] = await Promise.all([
        getInvoice(invoiceId),
        getInvoicePayments(invoiceId),
      ]);
      setInvoice(invoiceData as InvoiceWithUser);
      setPayments(paymentData as PaymentWithUser[]);
    } catch {
      setError("請求データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (teamLoading) return;
    if (!currentMembership || !canManageAccounting()) {
      router.replace("/");
      return;
    }
    loadData();
  }, [currentMembership, teamLoading, canManageAccounting, router, loadData]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelInvoice(invoiceId);
      await loadData();
      setShowCancelDialog(false);
    } catch {
      setError("キャンセルに失敗しました");
    } finally {
      setCancelling(false);
    }
  };

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;
  if (!invoice) return <ErrorDisplay message="請求が見つかりません" />;

  const statusCfg = STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG.pending;
  const userName = invoice.users?.display_name ?? "不明";
  const items = invoice.invoice_items ?? [];

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/accounting/invoices" className="text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h2 className="text-base font-bold text-gray-900">請求詳細</h2>
        </div>
        {canEdit && invoice.status !== "paid" && invoice.status !== "cancelled" && (
          <Link href={`/accounting/invoices/${invoiceId}/edit`}>
            <Button size="sm" variant="outline">編集</Button>
          </Link>
        )}
      </div>

      <div className="space-y-4 p-4">
        {/* 基本情報 */}
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-gray-900">{invoice.title}</h3>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ¥{invoice.total_amount.toLocaleString()}
            </p>
            <div className="space-y-1 text-sm text-gray-600">
              <p>対象者: {userName}</p>
              {invoice.due_date && <p>支払期限: {formatDate(invoice.due_date)}</p>}
              <p>発行日: {formatDate(invoice.issued_at ?? invoice.created_at)}</p>
              {invoice.paid_at && <p>支払日: {formatDate(invoice.paid_at)}</p>}
            </div>
            {invoice.notes && (
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500">備考</p>
                <p className="mt-1 text-sm text-gray-700">{invoice.notes}</p>
              </div>
            )}
          </div>
        </Card>

        {/* 明細 */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>明細</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-500">
                        ¥{item.amount.toLocaleString()} × {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      ¥{(item.amount * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                          {payment.payment_method ? METHOD_LABELS[payment.payment_method] ?? payment.payment_method : ""} · {formatDate(payment.paid_at)}
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

        {/* キャンセルボタン */}
        {canEdit && invoice.status !== "paid" && invoice.status !== "cancelled" && (
          <>
            <Button
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => setShowCancelDialog(true)}
            >
              この請求をキャンセル
            </Button>

            {/* キャンセル確認ダイアログ */}
            {showCancelDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <Card className="w-full max-w-sm p-6">
                  <h3 className="text-base font-bold text-gray-900">請求をキャンセルしますか？</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    「{invoice.title}」（¥{invoice.total_amount.toLocaleString()}）をキャンセルします。この操作は元に戻せません。
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowCancelDialog(false)}
                      disabled={cancelling}
                    >
                      戻る
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={handleCancel}
                      disabled={cancelling}
                    >
                      {cancelling ? "処理中..." : "キャンセルする"}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
