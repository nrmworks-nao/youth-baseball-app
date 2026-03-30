"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const DEMO_ENTRIES = [
  { id: "1", entry_type: "income", category: "会費", description: "3月会費 - 田中家", amount: 5000, entry_date: "2026-03-28", receipt_url: null },
  { id: "2", entry_type: "income", category: "会費", description: "3月会費 - 佐藤家", amount: 5000, entry_date: "2026-03-27", receipt_url: null },
  { id: "3", entry_type: "expense", category: "備品購入", description: "練習球 ダース×2", amount: 8000, entry_date: "2026-03-25", receipt_url: "/receipts/r1.jpg" },
  { id: "4", entry_type: "income", category: "会費", description: "3月会費 - 鈴木家", amount: 5000, entry_date: "2026-03-24", receipt_url: null },
  { id: "5", entry_type: "expense", category: "遠征費", description: "バス代（春季大会）", amount: 15000, entry_date: "2026-03-20", receipt_url: "/receipts/r2.jpg" },
  { id: "6", entry_type: "income", category: "イベント費", description: "春季大会参加費 集金", amount: 18000, entry_date: "2026-03-18", receipt_url: null },
];

const CATEGORIES = ["すべて", "会費", "備品購入", "遠征費", "イベント費", "保険", "その他"];

type ViewMode = "list" | "monthly" | "yearly";

export default function LedgerPage() {
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("すべて");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [entryType, setEntryType] = useState("income");
  const [category, setCategory] = useState("会費");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);

  const filtered =
    filterCategory === "すべて"
      ? DEMO_ENTRIES
      : DEMO_ENTRIES.filter((e) => e.category === filterCategory);

  const totalIncome = filtered
    .filter((e) => e.entry_type === "income")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = filtered
    .filter((e) => e.entry_type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

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
                  onClick={() => setEntryType("income")}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                    entryType === "income" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  収入
                </button>
                <button
                  onClick={() => setEntryType("expense")}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                    entryType === "expense" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  支出
                </button>
              </div>
              <Select label="カテゴリ" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.filter((c) => c !== "すべて").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Textarea label="説明" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="取引の説明..." />
              <Input label="金額（円）" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Input label="日付" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">領収書画像（任意）</label>
                <input type="file" accept="image/*" className="text-sm text-gray-500" />
              </div>
              <Button className="w-full">記入</Button>
            </div>
          </Card>
        )}

        {/* 表示切替 */}
        <div className="flex gap-2">
          {(["list", "monthly", "yearly"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                viewMode === mode ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {mode === "list" ? "一覧" : mode === "monthly" ? "月別" : "年度別"}
            </button>
          ))}
        </div>

        {/* カテゴリフィルター */}
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORIES.map((cat) => (
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
            <p className="text-sm font-bold text-green-700">¥{totalIncome.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-2 text-center">
            <p className="text-[10px] text-gray-500">支出</p>
            <p className="text-sm font-bold text-red-700">¥{totalExpense.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-2 text-center">
            <p className="text-[10px] text-gray-500">差引</p>
            <p className="text-sm font-bold text-blue-700">¥{(totalIncome - totalExpense).toLocaleString()}</p>
          </div>
        </div>

        {/* エントリ一覧 */}
        <Card>
          <CardContent className="p-0">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
