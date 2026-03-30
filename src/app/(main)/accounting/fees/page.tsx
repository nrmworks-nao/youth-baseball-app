"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const DEMO_FEES = [
  {
    id: "1",
    name: "月会費",
    amount: 5000,
    frequency: "monthly",
    is_active: true,
    description: "毎月の基本会費",
  },
  {
    id: "2",
    name: "入会金",
    amount: 10000,
    frequency: "one_time",
    is_active: true,
    description: "入会時のみ",
  },
  {
    id: "3",
    name: "年間保険料",
    amount: 3000,
    frequency: "yearly",
    is_active: true,
    description: "スポーツ保険",
  },
];

const FREQ_LABELS: Record<string, string> = {
  monthly: "月額",
  yearly: "年額",
  one_time: "一回のみ",
};

export default function FeesPage() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [description, setDescription] = useState("");

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
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "閉じる" : "+ 追加"}
        </Button>
      </div>

      <div className="space-y-4 p-4">
        {/* 新規作成フォーム */}
        {showForm && (
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-900">新しい会費設定</h3>
            <div className="space-y-3">
              <Input label="名称" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 月会費" />
              <Input label="金額（円）" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" />
              <Select label="頻度" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="monthly">月額</option>
                <option value="yearly">年額</option>
                <option value="one_time">一回のみ</option>
              </Select>
              <Input label="説明（任意）" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="備考" />
              <Button className="w-full">保存</Button>
            </div>
          </Card>
        )}

        {/* 既存の会費設定 */}
        {DEMO_FEES.map((fee) => (
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
              <Button size="sm" variant="outline">
                編集
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
