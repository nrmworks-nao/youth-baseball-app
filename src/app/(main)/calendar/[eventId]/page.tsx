"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { AttendanceStatus } from "@/types";

// デモデータ
const DEMO_EVENT: {
  id: string;
  title: string;
  event_type: string;
  description: string;
  location: string;
  start_at: string;
  end_at: string;
  created_by: string;
} = {
  id: "1",
  title: "通常練習",
  event_type: "practice",
  description: "通常練習です。バッティング練習と守備練習を行います。",
  location: "中央公園グラウンド",
  start_at: "2026-04-05T09:00:00",
  end_at: "2026-04-05T12:00:00",
  created_by: "user1",
};

const DEMO_ATTENDANCES = [
  { id: "1", player_name: "山田一郎", status: "attending" as const },
  { id: "2", player_name: "鈴木次郎", status: "attending" as const },
  { id: "3", player_name: "佐藤三郎", status: "absent" as const },
  { id: "4", player_name: "田中四郎", status: "undecided" as const },
  { id: "5", player_name: "伊藤五郎", status: "attending" as const },
];

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: string; bgColor: string }
> = {
  attending: {
    label: "参加",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  absent: { label: "欠席", color: "text-red-700", bgColor: "bg-red-100" },
  undecided: {
    label: "未定",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
};

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const event = DEMO_EVENT; // TODO: getEvent(eventId)

  const [myStatus, setMyStatus] = useState<AttendanceStatus | null>(null);
  const [note, setNote] = useState("");

  const attendingCount = DEMO_ATTENDANCES.filter(
    (a) => a.status === "attending"
  ).length;
  const absentCount = DEMO_ATTENDANCES.filter(
    (a) => a.status === "absent"
  ).length;
  const undecidedCount = DEMO_ATTENDANCES.filter(
    (a) => a.status === "undecided"
  ).length;

  const handleAttendance = async (status: AttendanceStatus) => {
    setMyStatus(status);
    // TODO: upsertAttendance({ event_id: eventId, user_id: ..., status, note })
  };

  return (
    <div className="space-y-4 p-4">
      {/* 戻るリンク */}
      <Link
        href="/calendar"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5 8.25 12l7.5-7.5"
          />
        </svg>
        カレンダーに戻る
      </Link>

      {/* イベント情報 */}
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-center gap-2">
            {event.event_type === "game" ? (
              <Badge variant="game">試合</Badge>
            ) : event.event_type === "practice" ? (
              <Badge variant="practice">練習</Badge>
            ) : (
              <Badge>その他</Badge>
            )}
            <h1 className="text-lg font-bold text-gray-900">{event.title}</h1>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <div>
                <p>{formatDateTime(event.start_at)}</p>
                <p className="text-xs text-gray-400">
                  〜 {formatDateTime(event.end_at)}
                </p>
              </div>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                  />
                </svg>
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-gray-600">{event.description}</p>
          )}
        </CardContent>
      </Card>

      {/* 出欠登録 */}
      <Card>
        <CardHeader>
          <CardTitle>出欠回答</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(
              [
                { status: "attending" as const, label: "参加" },
                { status: "absent" as const, label: "欠席" },
                { status: "undecided" as const, label: "未定" },
              ] as const
            ).map(({ status, label }) => (
              <Button
                key={status}
                variant={myStatus === status ? "default" : "outline"}
                className={cn(
                  "flex-1",
                  myStatus === status &&
                    status === "attending" &&
                    "bg-green-600 hover:bg-green-700",
                  myStatus === status &&
                    status === "absent" &&
                    "bg-red-600 hover:bg-red-700",
                  myStatus === status &&
                    status === "undecided" &&
                    "bg-yellow-500 hover:bg-yellow-600"
                )}
                onClick={() => handleAttendance(status)}
              >
                {label}
              </Button>
            ))}
          </div>
          <textarea
            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            rows={2}
            placeholder="コメント（任意）"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* 出欠一覧 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>出欠一覧</CardTitle>
            <div className="flex gap-2 text-xs">
              <span className="text-green-600">参加 {attendingCount}</span>
              <span className="text-red-600">欠席 {absentCount}</span>
              <span className="text-yellow-600">未定 {undecidedCount}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {DEMO_ATTENDANCES.map((attendance) => {
              const config = STATUS_CONFIG[attendance.status];
              return (
                <div
                  key={attendance.id}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                      {attendance.player_name.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-700">
                      {attendance.player_name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      config.bgColor,
                      config.color
                    )}
                  >
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
