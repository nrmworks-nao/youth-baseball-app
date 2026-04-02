"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// デモデータ
const UPCOMING_EVENTS = [
  {
    id: "1",
    title: "通常練習",
    event_type: "practice" as const,
    start_at: "2026-04-05T09:00:00",
    location: "中央公園グラウンド",
  },
  {
    id: "2",
    title: "練習試合 vs 東チーム",
    event_type: "game" as const,
    start_at: "2026-04-06T10:00:00",
    location: "市民球場",
  },
  {
    id: "3",
    title: "通常練習",
    event_type: "practice" as const,
    start_at: "2026-04-12T09:00:00",
    location: "中央公園グラウンド",
  },
];

const TEAM_CHALLENGE = {
  title: "チーム全員で100本ノック達成！",
  current: 67,
  target: 100,
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[date.getDay()];
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month}/${day}（${weekday}）${hours}:${minutes}`;
}

function EventTypeBadge({ type }: { type: string }) {
  if (type === "game") return <Badge variant="game">試合</Badge>;
  if (type === "practice") return <Badge variant="practice">練習</Badge>;
  return <Badge>その他</Badge>;
}

export default function HomePage() {
  const unreadCount = 5;

  return (
    <div className="space-y-4 p-4">
      {/* 直近の予定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>直近の予定</CardTitle>
            <Link
              href="/calendar"
              className="text-xs font-medium text-green-600"
            >
              すべて見る
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {UPCOMING_EVENTS.map((event) => (
              <Link
                key={event.id}
                href={`/calendar/${event.id}`}
                className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
              >
                <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-50">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <EventTypeBadge type={event.event_type} />
                    <span className="truncate text-sm font-medium text-gray-900">
                      {event.title}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {formatDate(event.start_at)}
                  </p>
                  {event.location && (
                    <p className="text-xs text-gray-400">{event.location}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 未読連絡 */}
      <Link href="/posts">
        <Card className="transition-colors hover:bg-gray-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                <svg
                  className="h-5 w-5 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">未読の連絡</p>
                <p className="text-xs text-gray-500">確認してください</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* チームチャレンジ */}
      <Card>
        <CardHeader>
          <CardTitle>チームチャレンジ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">{TEAM_CHALLENGE.title}</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {TEAM_CHALLENGE.current} / {TEAM_CHALLENGE.target}
              </span>
              <span>
                {Math.round(
                  (TEAM_CHALLENGE.current / TEAM_CHALLENGE.target) * 100
                )}
                %
              </span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{
                  width: `${(TEAM_CHALLENGE.current / TEAM_CHALLENGE.target) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
