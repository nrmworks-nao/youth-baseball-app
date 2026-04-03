"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { getInvoice, updateInvoice } from "@/lib/supabase/queries/accounting";
import type { Invoice, InvoiceItem } from "@/types";

type InvoiceWithUser = Invoice & {
  users?: { display_name: string };
  invoice_items?: InvoiceItem[];
};

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.invoiceId as string;
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { hasPermission } = usePermission(
    currentMembership?.permission_group ?? null,
    currentMembership?.is_admin ?? false
  );

  const canEdit = hasPermission(["president", "vice_president", "treasurer"]);

  const [invoice, setInvoice] = useState<InvoiceWithUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ description: string; amount: string; quantity: string }[]>([]);

  useEffect(() => {
    if (teamLoading) return;
    if (!currentMembership || !canEdit) {
      router.replace("/");
      return;
    }

    const load = async () => {
      try {
        const data = await getInvoice(invoiceId);
        const inv = data as InvoiceWithUser;
        setInvoice(inv);

        // 支払済の場合は編集不可
        if (inv.status === "paid") {
          setIsLoading(false);
          return;
        }

        // フォームに初期値をセット
        setTitle(inv.title);
        setDueDate(inv.due_date ?? "");
        setNotes(inv.notes ?? "");

        const invoiceItems = inv.invoice_items ?? [];
        if (invoiceItems.length > 0) {
          setItems(
            invoiceItems.map((item) => ({
              description: item.description,
              amount: String(item.amount),
              quantity: String(item.quantity),
            }))
          );
        } else {
          setAmount(String(inv.total_amount));
        }
      } catch {
        setError("請求データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [invoiceId, currentMembership, teamLoading, canEdit, router]);

  const addItem = () => {
    setItems([...items, { description: "", amount: "", quantity: "1" }]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount =
    items.length > 0
      ? items.reduce(
          (sum, item) => sum + parseInt(item.amount || "0") * parseInt(item.quantity || "1"),
          0
        )
      : parseInt(amount || "0");

  const handleSubmit = async () => {
    if (!currentTeam) return;
    setSubmitting(true);
    try {
      const invoiceItems =
        items.length > 0
          ? items.map((item) => ({
              description: item.description,
              amount: parseInt(item.amount || "0"),
              quantity: parseInt(item.quantity || "1"),
            }))
          : [{ description: title, amount: parseInt(amount || "0"), quantity: 1 }];

      await updateInvoice(invoiceId, {
        title,
        total_amount: totalAmount,
        due_date: dueDate || null,
        notes: notes || null,
        items: invoiceItems,
      });

      router.push(`/accounting/invoices/${invoiceId}`);
    } catch {
      setError("請求の更新に失敗しました");
      setSubmitting(false);
    }
  };

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;
  if (!invoice) return <ErrorDisplay message="請求が見つかりません" />;

  // 支払済の場合は編集不可メッセージ
  if (invoice.status === "paid") {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
          <Link href={`/accounting/invoices/${invoiceId}`} className="text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h2 className="text-base font-bold text-gray-900">請求編集</h2>
        </div>
        <div className="p-4">
          <Card className="p-6 text-center">
            <p className="text-sm text-gray-600">この請求は支払済のため編集できません。</p>
            <Link href={`/accounting/invoices/${invoiceId}`}>
              <Button variant="outline" className="mt-4">
                詳細に戻る
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const userName = invoice.users?.display_name ?? "不明";

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href={`/accounting/invoices/${invoiceId}`} className="text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h2 className="text-base font-bold text-gray-900">請求編集</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* 対象者（変更不可） */}
        <Card className="bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-500">対象者</p>
          <p className="mt-1 text-sm font-medium text-gray-900">{userName}</p>
        </Card>

        <Card className="p-4">
          <div className="space-y-3">
            <Input
              label="件名"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 4月会費"
            />
            {items.length === 0 && (
              <Input
                label="金額（円）"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
              />
            )}
            <Input
              label="支払期限"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <Textarea
              label="備考（任意）"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="補足説明があれば..."
            />
          </div>
        </Card>

        {/* 明細 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">明細</h3>
            <Button size="sm" variant="outline" onClick={addItem}>
              + 明細追加
            </Button>
          </div>
          {items.length > 0 && (
            <div className="mt-3 space-y-3">
              {items.map((item, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-gray-200 p-3">
                  <Input
                    label="明細名"
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    placeholder="例: 月会費"
                  />
                  <div className="flex gap-2">
                    <Input
                      label="金額"
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateItem(i, "amount", e.target.value)}
                    />
                    <Input
                      label="数量"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", e.target.value)}
                    />
                  </div>
                  <button onClick={() => removeItem(i)} className="text-xs text-red-500">
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* サマリー */}
        {totalAmount > 0 && (
          <Card className="bg-green-50 p-4">
            <p className="text-sm text-gray-700">
              合計: <span className="font-bold">¥{totalAmount.toLocaleString()}</span>
            </p>
          </Card>
        )}

        <Button
          className="w-full"
          size="lg"
          disabled={!title || totalAmount === 0 || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "更新中..." : "請求を更新"}
        </Button>
      </div>
    </div>
  );
}
