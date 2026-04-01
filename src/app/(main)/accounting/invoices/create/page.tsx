"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { supabase } from "@/lib/supabase/client";
import { getTeamMembers } from "@/lib/supabase/queries/members";
import { createInvoice, getFeeSettings } from "@/lib/supabase/queries/accounting";
import type { TeamMember, FeeSetting } from "@/types";

export default function CreateInvoicePage() {
  const router = useRouter();
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { hasPermission } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);

  const canManage = hasPermission(["director", "treasurer"]);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [feeSettings, setFeeSettings] = useState<FeeSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [targetMode, setTargetMode] = useState<"all" | "individual">("all");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [items, setItems] = useState<{ description: string; amount: string; quantity: string }[]>([]);

  useEffect(() => {
    if (teamLoading) return;
    if (!currentMembership || !canManage) {
      router.replace("/");
      return;
    }
    if (!currentTeam) return;

    const load = async () => {
      try {
        const [memberData, feeData] = await Promise.all([
          getTeamMembers(currentTeam.id),
          getFeeSettings(currentTeam.id),
        ]);
        // 請求対象は parent ロールのメンバー
        const parents = memberData.filter((m) => m.permission_group === "parent");
        setMembers(parents);
        setFeeSettings(feeData.filter((f) => f.is_active));
      } catch {
        setError("データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [currentTeam, currentMembership, teamLoading, canManage, router]);

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((m) => m !== userId) : [...prev, userId]
    );
  };

  const targetMembers = targetMode === "all" ? members : members.filter((m) => selectedMembers.includes(m.user_id));
  const targetCount = targetMembers.length;

  const handleBulkMonthlyFee = () => {
    const monthlyFee = feeSettings.find((f) => f.frequency === "monthly");
    if (monthlyFee) {
      const now = new Date();
      setTitle(`${now.getMonth() + 1}月会費`);
      setAmount(String(monthlyFee.amount));
      setTargetMode("all");
      setItems([{ description: monthlyFee.name, amount: String(monthlyFee.amount), quantity: "1" }]);
    }
  };

  const addItem = () => {
    setItems([...items, { description: "", amount: "", quantity: "1" }]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.length > 0
    ? items.reduce((sum, item) => sum + (parseInt(item.amount || "0") * parseInt(item.quantity || "1")), 0)
    : parseInt(amount || "0");

  const handleSubmit = async () => {
    if (!currentTeam || targetCount === 0) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const invoiceItems = items.length > 0
        ? items.map((item) => ({
            description: item.description,
            amount: parseInt(item.amount || "0"),
            quantity: parseInt(item.quantity || "1"),
          }))
        : [{ description: title, amount: parseInt(amount || "0"), quantity: 1 }];

      // 各対象者に請求を作成
      for (const member of targetMembers) {
        await createInvoice({
          team_id: currentTeam.id,
          target_user_id: member.user_id,
          title,
          total_amount: totalAmount,
          due_date: dueDate || undefined,
          notes: notes || undefined,
          created_by: user.id,
          items: invoiceItems,
        });
      }

      router.push("/accounting/invoices");
    } catch {
      setError("請求の作成に失敗しました");
      setSubmitting(false);
    }
  };

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/accounting/invoices" className="text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h2 className="text-base font-bold text-gray-900">請求作成</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* 月会費一括請求ボタン */}
        {feeSettings.some((f) => f.frequency === "monthly") && (
          <Button variant="outline" className="w-full" onClick={handleBulkMonthlyFee}>
            月会費一括請求
          </Button>
        )}

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
            <Button size="sm" variant="outline" onClick={addItem}>+ 明細追加</Button>
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
                  <button onClick={() => removeItem(i)} className="text-xs text-red-500">削除</button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 対象者選択 */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900">対象者</h3>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setTargetMode("all")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                targetMode === "all" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              全員
            </button>
            <button
              onClick={() => setTargetMode("individual")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                targetMode === "individual" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              個別選択
            </button>
          </div>

          {targetMode === "individual" && (
            <div className="mt-3 space-y-2">
              {members.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.user_id)}
                    onChange={() => toggleMember(member.user_id)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600"
                  />
                  <span className="text-sm text-gray-900">
                    {member.users?.display_name ?? "不明"}
                  </span>
                </label>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-gray-400">対象メンバーがいません</p>
              )}
            </div>
          )}
        </Card>

        {/* サマリー */}
        {totalAmount > 0 && (
          <Card className="bg-green-50 p-4">
            <p className="text-sm text-gray-700">
              {targetCount}名 × ¥{totalAmount.toLocaleString()} ={" "}
              <span className="font-bold">
                ¥{(targetCount * totalAmount).toLocaleString()}
              </span>
            </p>
          </Card>
        )}

        <Button
          className="w-full"
          size="lg"
          disabled={!title || totalAmount === 0 || targetCount === 0 || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "作成中..." : `${targetCount}名に請求を作成`}
        </Button>
      </div>
    </div>
  );
}
