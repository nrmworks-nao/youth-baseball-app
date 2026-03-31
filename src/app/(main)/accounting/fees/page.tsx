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
import { getFeeSettings, createFeeSetting, updateFeeSetting } from "@/lib/supabase/queries/accounting";
import type { FeeSetting } from "@/types";

const FREQ_LABELS: Record<string, string> = {
  monthly: "月額",
  yearly: "年額",
  one_time: "一回のみ",
};

export default function FeesPage() {
  const router = useRouter();
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { hasPermission } = usePermission(currentMembership?.permission_group ?? null);

  const [fees, setFees] = useState<FeeSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [description, setDescription] = useState("");

  const canManage = hasPermission(["team_admin", "treasurer"]);

  const loadFees = useCallback(async () => {
    if (!currentTeam) return;
    try {
      const data = await getFeeSettings(currentTeam.id);
      setFees(data);
    } catch {
      setError("会費設定の取得に失敗しました");
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
    loadFees();
  }, [currentTeam, currentMembership, teamLoading, canManage, router, loadFees]);

  const resetForm = () => {
    setName("");
    setAmount("");
    setFrequency("monthly");
    setDescription("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!currentTeam || !name || !amount) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingId) {
        await updateFeeSetting(editingId, {
          name,
          amount: parseInt(amount),
          description: description || undefined,
        });
      } else {
        await createFeeSetting({
          team_id: currentTeam.id,
          name,
          amount: parseInt(amount),
          frequency,
          description: description || undefined,
          created_by: user.id,
        });
      }
      resetForm();
      await loadFees();
    } catch {
      setError(editingId ? "会費設定の更新に失敗しました" : "会費設定の作成に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (fee: FeeSetting) => {
    setEditingId(fee.id);
    setName(fee.name);
    setAmount(String(fee.amount));
    setFrequency(fee.frequency);
    setDescription(fee.description ?? "");
    setShowForm(true);
  };

  const handleToggleActive = async (fee: FeeSetting) => {
    try {
      await updateFeeSetting(fee.id, { is_active: !fee.is_active });
      await loadFees();
    } catch {
      setError("有効/無効の切替に失敗しました");
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
          <h2 className="text-base font-bold text-gray-900">会費設定</h2>
        </div>
        <Button size="sm" onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}>
          {showForm ? "閉じる" : "+ 追加"}
        </Button>
      </div>

      <div className="space-y-4 p-4">
        {showForm && (
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-900">
              {editingId ? "会費設定を編集" : "新しい会費設定"}
            </h3>
            <div className="space-y-3">
              <Input label="名称" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 月会費" />
              <Input label="金額（円）" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" />
              {!editingId && (
                <Select label="頻度" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                  <option value="monthly">月額</option>
                  <option value="yearly">年額</option>
                  <option value="one_time">一回のみ</option>
                </Select>
              )}
              <Input label="説明（任意）" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="備考" />
              <Button className="w-full" onClick={handleSave} disabled={saving || !name || !amount}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </Card>
        )}

        {fees.length === 0 && !showForm && (
          <p className="py-8 text-center text-sm text-gray-400">会費設定がありません</p>
        )}

        {fees.map((fee) => (
          <Card key={fee.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-900">{fee.name}</h3>
                  <Badge variant={fee.is_active ? "primary" : "default"}>
                    {fee.is_active ? "有効" : "無効"}
                  </Badge>
                </div>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  ¥{fee.amount.toLocaleString()}
                  <span className="ml-1 text-xs font-normal text-gray-500">
                    / {FREQ_LABELS[fee.frequency]}
                  </span>
                </p>
                {fee.description && (
                  <p className="mt-1 text-xs text-gray-500">{fee.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleToggleActive(fee)}>
                  {fee.is_active ? "無効化" : "有効化"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(fee)}>
                  編集
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
