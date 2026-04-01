"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { cn } from "@/lib/utils/cn";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { getEvents, createEvent, getEventAttendanceCounts } from "@/lib/supabase/queries/events";
import { supabase } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import { sendNotification } from "@/lib/notifications/send";
import type { Event, EventType } from "@/types";

type ViewMode = "month" | "week" | "list";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  practice: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  practice_game: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  game: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  joint_practice: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  other: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  meeting: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  practice_game: "練習試合",
  game: "公式戦",
  joint_practice: "合同練習",
  meeting: "会議",
  other: "その他",
};

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

function isPastEvent(startAt: string) {
  return new Date(startAt) < new Date();
}

function EventTypeBadge({ type }: { type: string }) {
  const label = EVENT_TYPE_LABELS[type] || "その他";
  const colors = EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS.other;
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", colors.bg, colors.text)}>
      {label}
    </span>
  );
}

export default function CalendarPage() {
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { canCreateEvent } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, { players: number; parents: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = useCallback(async () => {
    if (!currentTeam) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEvents(currentTeam.id);
      setEvents(data);
      // 参加人数を一括取得
      if (data.length > 0) {
        const counts = await getEventAttendanceCounts(data.map((e) => e.id));
        setAttendanceCounts(counts);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (!teamLoading && currentTeam) {
      fetchEvents();
    }
  }, [teamLoading, currentTeam, fetchEvents]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthEvents = events.filter((e) => {
    const d = new Date(e.start_at);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const getEventsForDay = (day: number) => {
    return monthEvents.filter((e) => new Date(e.start_at).getDate() === day);
  };

  const handleEventCreated = () => {
    setShowCreateModal(false);
    fetchEvents();
  };

  if (teamLoading || isLoading) {
    return <Loading text="カレンダーを読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchEvents} />;
  }

  if (!currentTeam) {
    return <ErrorDisplay title="チーム未選択" message="チームを選択してください。" />;
  }

  return (
    <div className="flex flex-col">
      {/* ビュー切り替え + 新規作成 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
          {(["month", "week", "list"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                viewMode === mode
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                  : "text-gray-500"
              )}
              onClick={() => setViewMode(mode)}
            >
              {mode === "month" ? "月" : mode === "week" ? "週" : "リスト"}
            </button>
          ))}
        </div>
        {canCreateEvent() && (
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            + 新規
          </Button>
        )}
      </div>

      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between bg-white px-4 py-3 dark:bg-gray-900">
        <button onClick={prevMonth} className="p-1 text-gray-600 dark:text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
          {year}年{month + 1}月
        </h2>
        <button onClick={nextMonth} className="p-1 text-gray-600 dark:text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* 月表示 */}
      {viewMode === "month" && (
        <div className="bg-white px-2 pb-4 dark:bg-gray-900">
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
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] p-1" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const dayOfWeek = (firstDay + i) % 7;
              return (
                <div key={day} className="min-h-[80px] border-t border-gray-100 p-1 dark:border-gray-800">
                  <div
                    className={cn(
                      "text-xs font-medium",
                      dayOfWeek === 0 ? "text-red-500" : dayOfWeek === 6 ? "text-blue-500" : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {day}
                  </div>
                  {dayEvents.slice(0, 2).map((event) => {
                    const colors = EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.other;
                    const past = isPastEvent(event.start_at);
                    const counts = attendanceCounts[event.id];
                    return (
                      <Link
                        key={event.id}
                        href={`/calendar/${event.id}`}
                        className={cn(
                          "mt-0.5 block rounded px-1 text-[10px] leading-4",
                          past ? "bg-gray-100 text-gray-400" : `${colors.bg} ${colors.text}`
                        )}
                      >
                        <span className="block truncate">{event.title}</span>
                        {counts && counts.players > 0 && (
                          <span className="block leading-4 opacity-75">部員{counts.players}</span>
                        )}
                        {counts && counts.parents > 0 && (
                          <span className="block leading-4 opacity-75">保護者{counts.parents}</span>
                        )}
                      </Link>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <p className="text-[10px] text-gray-400">+{dayEvents.length - 2}</p>
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
            <p className="py-8 text-center text-sm text-gray-400">予定はありません</p>
          ) : (
            monthEvents.map((event) => {
              const colors = EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.other;
              const past = isPastEvent(event.start_at);
              const counts = attendanceCounts[event.id];
              return (
                <Link key={event.id} href={`/calendar/${event.id}`}>
                  <Card className={cn("p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800", past && "opacity-50")}>
                    <div className="flex items-start gap-3">
                      <div className={cn("mt-0.5 h-2 w-2 flex-shrink-0 rounded-full", colors.dot)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <EventTypeBadge type={event.event_type} />
                          <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {event.title}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDateFull(event.start_at)} {formatTime(event.start_at)}
                          {event.end_at && ` - ${formatTime(event.end_at)}`}
                        </p>
                        {event.location && (
                          <p className="text-xs text-gray-400">{event.location}</p>
                        )}
                        {counts && (counts.players > 0 || counts.parents > 0) && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {counts.players > 0 && <span>部員{counts.players}</span>}
                            {counts.parents > 0 && <span className="ml-1">保護者{counts.parents}</span>}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* イベント作成モーダル */}
      {showCreateModal && currentTeam && (
        <CreateEventModal
          teamId={currentTeam.id}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleEventCreated}
        />
      )}
    </div>
  );
}

function CreateEventModal({
  teamId,
  onClose,
  onCreated,
}: {
  teamId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<EventType>("practice");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !date) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      const startAt = `${date}T${startTime}:00`;
      const endAt = `${date}T${endTime}:00`;

      await createEvent({
        team_id: teamId,
        title: title.trim(),
        event_type: eventType,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        start_at: startAt,
        end_at: endAt,
        created_by: user.id,
      });

      // LINE通知 + アプリ内通知（非同期・失敗許容）
      sendNotification({
        team_id: teamId,
        notification_type: "event",
        title: `新しい予定: ${title.trim()}`,
        message_body: `${date} ${startTime}〜${endTime} ${location.trim() ? `場所: ${location.trim()}` : ""}`,
        link: "/calendar",
        meta: { author_name: user.user_metadata?.display_name ?? "", event_title: title.trim() },
      });

      onCreated();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 sm:rounded-2xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">イベント作成</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">タイトル</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              placeholder="例: 通常練習"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">種別</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "practice" as EventType, label: "練習" },
                { value: "practice_game" as EventType, label: "練習試合" },
                { value: "game" as EventType, label: "公式戦" },
                { value: "joint_practice" as EventType, label: "合同練習" },
                { value: "other" as EventType, label: "その他" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    eventType === opt.value
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  )}
                  onClick={() => setEventType(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">日付</label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">開始時間</label>
              <input
                type="time"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">終了時間</label>
              <input
                type="time"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">場所</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              placeholder="例: 中央公園グラウンド"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">メモ（任意）</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              rows={2}
              placeholder="補足事項があれば入力"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-600">{submitError}</p>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!title.trim() || !date || isSubmitting}
            >
              {isSubmitting ? "作成中..." : "作成"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
