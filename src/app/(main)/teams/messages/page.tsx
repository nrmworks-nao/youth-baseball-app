"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const DEMO_THREADS = [
  {
    id: "m1",
    from_team: "東ライオンズ",
    to_team: "私たちのチーム",
    subject: "練習試合のお誘い",
    body: "4月に練習試合をお願いしたいのですが、ご都合はいかがでしょうか？",
    sender_name: "東ライオンズ 山田",
    is_read: false,
    created_at: "2026-03-28T10:00:00",
    is_incoming: true,
  },
  {
    id: "m2",
    from_team: "私たちのチーム",
    to_team: "南イーグルス",
    subject: "合同練習のご相談",
    body: "5月のGW期間に合同練習を開催したいと考えています。",
    sender_name: "山本監督",
    is_read: true,
    created_at: "2026-03-25T14:00:00",
    is_incoming: false,
  },
  {
    id: "m3",
    from_team: "北スターズ",
    to_team: "私たちのチーム",
    subject: "大会のご案内",
    body: "夏季大会のエントリーについてご連絡です。",
    sender_name: "北スターズ 佐藤",
    is_read: true,
    created_at: "2026-03-20T09:00:00",
    is_incoming: true,
  },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "今日";
  if (days === 1) return "昨日";
  return `${days}日前`;
}

export default function TeamMessagesPage() {
  const [showCompose, setShowCompose] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [toTeam, setToTeam] = useState("");

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">チーム間メッセージ</h2>
        <Button size="sm" onClick={() => setShowCompose(!showCompose)}>
          {showCompose ? "閉じる" : "+ 新規"}
        </Button>
      </div>

      <div className="space-y-4 p-4">
        {/* 新規作成フォーム */}
        {showCompose && (
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-900">新しいメッセージ</h3>
            <div className="space-y-3">
              <Input label="宛先チーム" value={toTeam} onChange={(e) => setToTeam(e.target.value)} placeholder="チーム名を入力..." />
              <Input label="件名" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="件名" />
              <Textarea label="本文" value={body} onChange={(e) => setBody(e.target.value)} placeholder="メッセージ本文..." />
              <Button className="w-full">送信</Button>
            </div>
          </Card>
        )}

        {/* スレッド一覧 */}
        {DEMO_THREADS.map((thread) => (
          <Card
            key={thread.id}
            className={`p-4 transition-colors hover:bg-gray-50 ${
              !thread.is_read ? "bg-green-50/50" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={thread.is_incoming ? "practice" : "default"}>
                    {thread.is_incoming ? "受信" : "送信"}
                  </Badge>
                  <span className="truncate text-sm font-medium text-gray-900">
                    {thread.subject}
                  </span>
                  {!thread.is_read && (
                    <span className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {thread.is_incoming ? thread.from_team : `→ ${thread.to_team}`}
                </p>
                <p className="mt-1 text-xs text-gray-400 line-clamp-1">
                  {thread.body}
                </p>
              </div>
              <span className="flex-shrink-0 text-[10px] text-gray-400">
                {timeAgo(thread.created_at)}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
