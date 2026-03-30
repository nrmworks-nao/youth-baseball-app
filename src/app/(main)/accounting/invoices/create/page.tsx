"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

const DEMO_MEMBERS = [
  { id: "u1", name: "田中太郎" },
  { id: "u2", name: "佐藤花子" },
  { id: "u3", name: "鈴木一郎" },
  { id: "u4", name: "高橋健太" },
  { id: "u5", name: "渡辺美咲" },
];

export default function CreateInvoicePage() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [targetMode, setTargetMode] = useState<"all" | "individual">("all");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const targetCount =
    targetMode === "all" ? DEMO_MEMBERS.length : selectedMembers.length;

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
        <Card className="p-4">
          <div className="space-y-3">
            <Input
              label="件名"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 4月会費"
            />
            <Input
              label="金額（円）"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000"
            />
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

        {/* 対象者選択 */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900">対象者</h3>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setTargetMode("all")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                targetMode === "all"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              全員
            </button>
            <button
              onClick={() => setTargetMode("individual")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                targetMode === "individual"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              個別選択
            </button>
          </div>

          {targetMode === "individual" && (
            <div className="mt-3 space-y-2">
              {DEMO_MEMBERS.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => toggleMember(member.id)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600"
                  />
                  <span className="text-sm text-gray-900">{member.name}</span>
                </label>
              ))}
            </div>
          )}
        </Card>

        {/* サマリー */}
        {amount && (
          <Card className="bg-green-50 p-4">
            <p className="text-sm text-gray-700">
              {targetCount}名 × ¥{parseInt(amount || "0").toLocaleString()} ={" "}
              <span className="font-bold">
                ¥{(targetCount * parseInt(amount || "0")).toLocaleString()}
              </span>
            </p>
          </Card>
        )}

        <Button
          className="w-full"
          size="lg"
          disabled={!title || !amount || targetCount === 0}
        >
          {targetCount}名に請求を作成
        </Button>
      </div>
    </div>
  );
}
