"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type ViewMode = "month" | "week" | "list";

// デモデータ
const DEMO_EVENTS = [
  {
    id: "1",
    title: "通常練習",
    event_type: "practice" as const,
    start_at: "2026-04-05T09:00:00",
    end_at: "2026-04-05T12:00:00",
    location: "中央公園グラウンド",
  },
  {
    id: "2",
    title: "練習試合 vs 東チーム",
    event_type: "game" as const,
    start_at: "2026-04-06T10:00:00",
    end_at: "2026-04-06T15:00:00",
    location: "市民球場",
  },
  {
    id: "3",
    title: "通常練習",
    event_type: "practice" as const,
    start_at: "2026-04-12T09:00:00",
    end_at: "2026-04-12T12:00:00",
    location: "中央公園グラウンド",
  },
  {
    id: "4",
    title: "公式戦 vs 南チーム",
    event_type: "game" as const,
    start_at: "2026-04-19T09:00:00",
    end_at: "2026-04-19T16:00:00",
    location: "市民球場",
  },
  {
    id: "5",
    title: "春季合宿",
    event_type: "other" as const,
    start_at: "2026-04-29T08:00:00",
    end_at: "2026-04-30T17:00:00",
    location: "スポーツセンター",
  },
];

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAYS[d.getDay()]}）`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function EventTypeBadge({ type }: { type: string }) {
  if (type === "game") return <Badge variant="game">試合</Badge>;
  if (type === "practice") return <Badge variant="practice">練習</Badge>;
  return <Badge>その他</Badge>;
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1)); // 2026年4月
  const [showCreateModal, setShowCreateModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // 月のイベントをフィルタ
  const monthEvents = DEMO_EVENTS.filter((e) => {
    const d = new Date(e.start_at);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  // 日付にイベントがあるか
  const getEventsForDay = (day: number) => {
    return monthEvents.filter((e) => new Date(e.start_at).getDate() === day);
  };

  return (
    <div className="flex flex-col">
      {/* ビュー切り替え + 新規作成 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex rounded-lg bg-gray-100 p-0.5">
          {(["month", "week", "list"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                viewMode === mode
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              )}
              onClick={() => setViewMode(mode)}
            >
              {mode === "month" ? "月" : mode === "week" ? "週" : "リスト"}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          + 新規
        </Button>
      </div>

      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between bg-white px-4 py-3">
        <button onClick={prevMonth} className="p-1 text-gray-600">
          <svg
            className="h-5 w-5"
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
        </button>
        <h2 className="text-base font-bold text-gray-900">
          {year}年{month + 1}月
        </h2>
        <button onClick={nextMonth} className="p-1 text-gray-600">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>

      {/* 月表示 */}
      {viewMode === "month" && (
        <div className="bg-white px-2 pb-4">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 text-center">
            {WEEKDAYS.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "py-2 text-xs font-medium",
                  i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
                )}
              >
                {day}
              </div>
            ))}
          </div>
          {/* 日付グリッド */}
          <div className="grid grid-cols-7">
            {/* 空白セル */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-1" />
            ))}
            {/* 日付セル */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const dayOfWeek = (firstDay + i) % 7;
              return (
                <div
                  key={day}
                  className="aspect-square border-t border-gray-100 p-1"
                >
                  <div
                    className={cn(
                      "text-xs font-medium",
                      dayOfWeek === 0 ? "text-red-500" : dayOfWeek === 6 ? "text-blue-500" : "text-gray-700"
                    )}
                  >
                    {day}
                  </div>
                  {dayEvents.slice(0, 2).map((event) => (
                    <Link
                      key={event.id}
                      href={`/calendar/${event.id}`}
                      className={cn(
                        "mt-0.5 block truncate rounded px-1 text-[10px] leading-4",
                        event.event_type === "game"
                          ? "bg-red-100 text-red-700"
                          : event.event_type === "practice"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {event.title}
                    </Link>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-[10px] text-gray-400">
                      +{dayEvents.length - 2}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* リスト表示 */}
      {(viewMode === "list" || viewMode === "week") && (
        <div className="space-y-2 p-4">
          {monthEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              予定はありません
            </p>
          ) : (
            monthEvents.map((event) => (
              <Link key={event.id} href={`/calendar/${event.id}`}>
                <Card className="p-3 transition-colors hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 h-2 w-2 flex-shrink-0 rounded-full",
                        event.event_type === "game"
                          ? "bg-red-500"
                          : event.event_type === "practice"
                            ? "bg-blue-500"
                            : "bg-gray-400"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <EventTypeBadge type={event.event_type} />
                        <span className="truncate text-sm font-medium text-gray-900">
                          {event.title}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDateFull(event.start_at)} {formatTime(event.start_at)} -{" "}
                        {formatTime(event.end_at)}
                      </p>
                      {event.location && (
                        <p className="text-xs text-gray-400">
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {/* イベント作成モーダル */}
      {showCreateModal && (
        <CreateEventModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function CreateEventModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("practice");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    // TODO: createEvent API呼び出し
    console.log("イベント作成:", {
      title,
      eventType,
      date,
      startTime,
      endTime,
      location,
      description,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">イベント作成</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              タイトル
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              placeholder="例: 通常練習"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              種別
            </label>
            <div className="flex gap-2">
              {[
                { value: "practice", label: "練習" },
                { value: "game", label: "試合" },
                { value: "other", label: "その他" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    eventType === opt.value
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  )}
                  onClick={() => setEventType(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              日付
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                開始時間
              </label>
              <input
                type="time"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                終了時間
              </label>
              <input
                type="time"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              場所
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              placeholder="例: 中央公園グラウンド"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              メモ（任意）
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              rows={2}
              placeholder="補足事項があれば入力"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!title.trim() || !date}
            >
              作成
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
