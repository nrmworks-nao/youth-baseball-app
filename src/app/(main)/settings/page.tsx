"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEMO_TEAM = {
  name: "中央サンダース",
  region: "東京都",
  league: "少年野球連盟A",
  require_approval: true,
  invite_code: "THUNDER2026",
};

export default function SettingsPage() {
  const [teamName, setTeamName] = useState(DEMO_TEAM.name);
  const [region, setRegion] = useState(DEMO_TEAM.region);
  const [league, setLeague] = useState(DEMO_TEAM.league);
  const [requireApproval, setRequireApproval] = useState(DEMO_TEAM.require_approval);

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">チーム設定</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* チーム情報編集 */}
        <Card>
          <CardHeader>
            <CardTitle>チーム情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Input label="チーム名" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
              <Input label="地域" value={region} onChange={(e) => setRegion(e.target.value)} />
              <Input label="所属リーグ" value={league} onChange={(e) => setLeague(e.target.value)} />
              <Button className="w-full">保存</Button>
            </div>
          </CardContent>
        </Card>

        {/* 参加承認 */}
        <Card>
          <CardHeader>
            <CardTitle>参加設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">参加承認を必要にする</p>
                <p className="text-xs text-gray-400">
                  ONにすると、招待リンクからの参加に管理者の承認が必要になります
                </p>
              </div>
              <button
                onClick={() => setRequireApproval(!requireApproval)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  requireApproval ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    requireApproval ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 招待リンク */}
        <Card>
          <CardHeader>
            <CardTitle>招待リンク</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
                <code className="flex-1 truncate text-sm text-gray-700">
                  https://app.example.com/invite/{DEMO_TEAM.invite_code}
                </code>
                <Button size="sm" variant="outline">
                  コピー
                </Button>
              </div>
              <div className="flex items-center justify-center rounded-lg border border-gray-200 p-6">
                <div className="flex h-32 w-32 items-center justify-center bg-gray-100">
                  <span className="text-xs text-gray-400">QRコード</span>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                新しいリンクを生成
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* メニューリンク */}
        <div className="space-y-2">
          <Link href="/settings/members">
            <Card className="p-4 transition-colors hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">メンバー管理</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Card>
          </Link>
          <Link href="/settings/line">
            <Card className="p-4 transition-colors hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">LINE連携設定</span>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
