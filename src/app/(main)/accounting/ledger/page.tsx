"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { supabase } from "@/lib/supabase/client";
import { getLedgerEntries, createLedgerEntry, getMonthlySummary } from "@/lib/supabase/queries/accounting";
import type { LedgerEntry, LedgerEntryType } from "@/types";

const INCOME_CATEGORIES = ["月会費", "大会参加費", "遠征費", "寄付", "その他"];
const EXPENSE_CATEGORIES = ["グラウンド使用料", "備品購入", "大会登録費", "交通費", "保険料", "その他"];

type ViewMode = "list" | "monthly";

export default function LedgerPage() {
  const router = useRouter();
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { canViewLedger } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);

  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("すべて");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlySummaryData, setMonthlySummaryData] = useState({ income: 0, expense: 0, balance: 0 });

  // フォーム
  const [entryType, setEntryType] = useState<LedgerEntryType>("income");
  const [category, setCategory] = useState("月会費");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);

  const categories = entryType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const allCategories = ["すべて", ...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES.filter((c) => !INCOME_CATEGORIES.includes(c))];

  const loadEntries = useCallback(async () => {
    if (!currentTeam) return;
    try {
      if (viewMode === "monthly") {
        const [data, summary] = await Promise.all([
          getLedgerEntries(currentTeam.id, { year: selectedYear, month: selectedMonth }),
          getMonthlySummary(currentTeam.id, selectedYear, selectedMonth),
        ]);
        setEntries(data);
        setMonthlySummaryData(summary);
      } else {
        const data = await getLedgerEntries(currentTeam.id);
        setEntries(data);
      }
    } catch {
      setError("収支データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam, viewMode, selectedYear, selectedMonth]);

  useEffect(() => {
    if (teamLoading) return;
    if (!currentMembership || !canViewLedger()) {
      router.replace("/");
      return;
    }
    if (!currentTeam) return;
    setIsLoading(true);
    loadEntries();
  }, [currentTeam, currentMembership, teamLoading, canViewLedger, router, loadEntries]);

  const handleSubmit = async () => {
    if (!currentTeam || !amount || !description) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // TODO: レシート画像のアップロード（Supabase Storage）

      await createLedgerEntry({
        team_id: currentTeam.id,
        entry_type: entryType,
        category,
        description,
        amount: parseInt(amount),
        entry_date: entryDate,
        recorded_by: user.id,
      });

      // フォームリセット
      setEntryType("income");
      setCategory("月会費");
      setDescription("");
      setAmount("");
      setEntryDate(new Date().toISOString().split("T")[0]);
      setShowForm(false);

      await loadEntries();
    } catch {
      setError("収支記録の作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;

  const filtered =
    filterCategory === "すべて"
      ? entries
      : entries.filter((e) => e.category === filterCategory);

  const totalIncome = filtered
    .filter((e) => e.entry_type === "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = filtered
    .filter((e) => e.entry_type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const displayIncome = viewMode === "monthly" && filterCategory === "すべて" ? monthlySummaryData.income : totalIncome;
  const displayExpense = viewMode === "monthly" && filterCategory === "すべて" ? monthlySummaryData.expense : totalExpense;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/accounting" className="text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <h2 className="text-base font-bold text-gray-900">収支台帳</h2>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "閉じる" : "+ 記入"}
        </Button>
      </div>

      <div className="space-y-4 p-4">
        {/* 新規記入フォーム */}
        {showForm && (
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-900">収支記入</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => { setEntryType("income"); setCategory(INCOME_CATEGORIES[0]); }}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                    entryType === "income" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  収入
                </button>
                <button
                  onClick={() => { setEntryType("expense"); setCategory(EXPENSE_CATEGORIES[0]); }}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                    entryType === "expense" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  支出
                </button>
              </div>
              <Select label="カテゴリ" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Textarea label="説明" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="取引の説明..." />
              <Input label="金額（円）" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Input label="日付" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">領収書画像（任意）</label>
                <input type="file" accept="image/*" className="text-sm text-gray-500" disabled />
                <p className="mt-1 text-xs text-gray-400">※ 画像アップロードは準備中です</p>
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={submitting || !amount || !description}>
                {submitting ? "記入中..." : "記入"}
              </Button>
            </div>
          </Card>
        )}

        {/* 表示切替 */}
        <div className="flex gap-2">
          {(["list", "monthly"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                viewMode === mode ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {mode === "list" ? "一覧" : "月別"}
            </button>
          ))}
        </div>

        {/* 月選択（月別ビュー） */}
        {viewMode === "monthly" && (
          <div className="flex items-center gap-2">
            <Select value={String(selectedYear)} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={String(y)}>{y}年</option>
              ))}
            </Select>
            <Select value={String(selectedMonth)} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m)}>{m}月</option>
              ))}
            </Select>
          </div>
        )}

        {/* カテゴリフィルター */}
        <div className="flex gap-2 overflow-x-auto">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                filterCategory === cat ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* サマリー */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-green-50 p-2 text-center">
            <p className="text-[10px] text-gray-500">収入</p>
            <p className="text-sm font-bold text-green-700">¥{displayIncome.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-2 text-center">
            <p className="text-[10px] text-gray-500">支出</p>
            <p className="text-sm font-bold text-red-700">¥{displayExpense.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-2 text-center">
            <p className="text-[10px] text-gray-500">差引</p>
            <p className="text-sm font-bold text-blue-700">¥{(displayIncome - displayExpense).toLocaleString()}</p>
          </div>
        </div>

        {/* エントリ一覧 */}
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">取引データがありません</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          entry.entry_type === "income" ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <div>
                        <p className="text-sm text-gray-900">{entry.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{entry.entry_date}</span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5">{entry.category}</span>
                          {entry.receipt_url && (
                            <span className="text-green-600">領収書あり</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        entry.entry_type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {entry.entry_type === "income" ? "+" : "-"}¥{entry.amount.toLocaleString()}
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
