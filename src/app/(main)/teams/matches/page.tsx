"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DEMO_MATCHES = [
  {
    id: "mr1",
    from_team: "私たちのチーム",
    to_team: "東ライオンズ",
    status: "pending",
    message: "4月の練習試合をお願いしたいです。",
    venue: "東公園グラウンド",
    dates: ["2026-04-12", "2026-04-19"],
    is_outgoing: true,
    created_at: "2026-03-28",
  },
  {
    id: "mr2",
    from_team: "南イーグルス",
    to_team: "私たちのチーム",
    status: "pending",
    message: "合同練習のお誘いです。",
    venue: "南河川敷グラウンド",
    dates: ["2026-04-20"],
    is_outgoing: false,
    created_at: "2026-03-25",
  },
  {
    id: "mr3",
    from_team: "私たちのチーム",
    to_team: "北スターズ",
    status: "accepted",
    message: "練習試合ありがとうございます！",
    venue: "北市民球場",
    dates: ["2026-05-03"],
    confirmed_date: "2026-05-03",
    is_outgoing: true,
    created_at: "2026-03-20",
  },
  {
    id: "mr4",
    from_team: "西ドラゴンズ",
    to_team: "私たちのチーム",
    status: "declined",
    message: "スケジュールが合わず...",
    venue: "",
    dates: ["2026-04-06"],
    is_outgoing: false,
    created_at: "2026-03-15",
  },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "primary" | "warning" | "danger" | "default" }> = {
  pending: { label: "申込中", variant: "warning" },
  accepted: { label: "承認", variant: "primary" },
  declined: { label: "拒否", variant: "danger" },
  cancelled: { label: "キャンセル", variant: "default" },
};

export default function MatchesPage() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">練習試合管理</h2>
        <Link href="/teams/matches/request">
          <Button size="sm">+ 申し込み</Button>
        </Link>
      </div>

      <div className="space-y-2 p-4">
        {DEMO_MATCHES.map((match) => {
          const cfg = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.pending;
          return (
            <Card key={match.id} className="p-4 transition-colors hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={match.is_outgoing ? "default" : "practice"}>
                      {match.is_outgoing ? "送信" : "受信"}
                    </Badge>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    vs {match.is_outgoing ? match.to_team : match.from_team}
                  </p>
                  {match.venue && (
                    <p className="mt-0.5 text-xs text-gray-500">会場: {match.venue}</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {match.dates.map((d) => (
                      <span
                        key={d}
                        className={`rounded bg-gray-100 px-1.5 py-0.5 text-xs ${
                          d === (match as { confirmed_date?: string }).confirmed_date
                            ? "bg-green-100 font-medium text-green-700"
                            : "text-gray-600"
                        }`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-gray-400">{match.created_at}</span>
              </div>
              {/* 受信側でpendingの場合、承認/拒否ボタン */}
              {!match.is_outgoing && match.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1">承認</Button>
                  <Button size="sm" variant="outline" className="flex-1">拒否</Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
