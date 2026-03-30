"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const DEMO_USER = {
  display_name: "田中太郎",
  picture_url: null,
  teams: [
    { id: "t1", name: "中央サンダース", role: "保護者", is_current: true },
    { id: "t2", name: "南イーグルス", role: "コーチ", is_current: false },
  ],
  children: [
    { id: "c1", name: "田中翔太", grade: 4, number: 7 },
    { id: "c2", name: "田中美咲", grade: 2, number: 15 },
  ],
};

export default function MyPage() {
  const [displayName, setDisplayName] = useState(DEMO_USER.display_name);
  const [notifyPost, setNotifyPost] = useState(true);
  const [notifyEvent, setNotifyEvent] = useState(true);
  const [notifyPayment, setNotifyPayment] = useState(true);

  const notifyItems = [
    { key: "post", label: "投稿通知", value: notifyPost, setter: setNotifyPost },
    { key: "event", label: "イベント通知", value: notifyEvent, setter: setNotifyEvent },
    { key: "payment", label: "会費通知", value: notifyPayment, setter: setNotifyPayment },
  ];

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">マイページ</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* プロフィール */}
        <Card>
          <CardHeader>
            <CardTitle>プロフィール</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <div className="flex-1">
                <Input label="表示名" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
            </div>
            <Button className="mt-3 w-full" variant="outline">保存</Button>
          </CardContent>
        </Card>

        {/* お子さまの情報 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>お子さまの情報</CardTitle>
              <Button size="sm" variant="outline">+ 追加</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {DEMO_USER.children.map((child) => (
                <div key={child.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{child.name}</p>
                    <p className="text-xs text-gray-500">
                      {child.grade}年生 · 背番号 {child.number}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">編集</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* チーム切替 */}
        <Card>
          <CardHeader>
            <CardTitle>所属チーム</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {DEMO_USER.teams.map((team) => (
                <div
                  key={team.id}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    team.is_current ? "bg-green-50 border border-green-200" : "bg-gray-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{team.name}</p>
                      {team.is_current && <Badge variant="primary">現在</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">{team.role}</p>
                  </div>
                  {!team.is_current && (
                    <Button size="sm" variant="outline">切替</Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 通知設定 */}
        <Card>
          <CardHeader>
            <CardTitle>通知設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifyItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <button
                    onClick={() => item.setter(!item.value)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      item.value ? "bg-green-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        item.value ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* メニュー */}
        <Link href="/mypage/payments">
          <Card className="p-4 transition-colors hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">マイ支払い</span>
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
