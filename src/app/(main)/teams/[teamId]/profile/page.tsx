"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DEMO_PROFILE = {
  team_name: "東ライオンズ",
  region: "東京都",
  league: "少年野球連盟A",
  introduction: "東京都で活動している少年野球チームです。小学1年生〜6年生まで、約20名で楽しく活動しています。初心者大歓迎！まずは体験からどうぞ。",
  home_ground: "東公園グラウンド",
  practice_schedule: "毎週土曜 9:00〜12:00、日曜 9:00〜15:00（試合日を除く）",
  member_count: 18,
  founded_year: 2015,
  contact_email: "east-lions@example.com",
  is_public: true,
};

export default function TeamProfilePage() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/teams/search" className="text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h2 className="text-base font-bold text-gray-900">チームプロフィール</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* チーム名・基本情報 */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <span className="text-3xl">⚾</span>
              </div>
            </div>
            <h1 className="mt-3 text-center text-xl font-bold text-gray-900">
              {DEMO_PROFILE.team_name}
            </h1>
            <div className="mt-2 flex justify-center gap-2">
              <Badge variant="default">{DEMO_PROFILE.region}</Badge>
              <Badge variant="practice">{DEMO_PROFILE.league}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 紹介文 */}
        <Card>
          <CardContent className="py-3">
            <h3 className="text-sm font-medium text-gray-900">チーム紹介</h3>
            <p className="mt-2 text-sm text-gray-700">{DEMO_PROFILE.introduction}</p>
          </CardContent>
        </Card>

        {/* 詳細情報 */}
        <Card>
          <CardContent className="py-3">
            <div className="space-y-3">
              <InfoRow label="ホームグラウンド" value={DEMO_PROFILE.home_ground} />
              <InfoRow label="活動日" value={DEMO_PROFILE.practice_schedule} />
              <InfoRow label="部員数" value={`${DEMO_PROFILE.member_count}名`} />
              <InfoRow label="設立" value={`${DEMO_PROFILE.founded_year}年`} />
              {DEMO_PROFILE.contact_email && (
                <InfoRow label="連絡先" value={DEMO_PROFILE.contact_email} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* アクション */}
        <div className="space-y-2">
          <Link href="/teams/messages">
            <Button className="w-full" variant="outline">
              メッセージを送る
            </Button>
          </Link>
          <Link href="/teams/matches/request">
            <Button className="w-full">
              練習試合を申し込む
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-28 flex-shrink-0 text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
