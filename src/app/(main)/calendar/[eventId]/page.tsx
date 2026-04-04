"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { cn } from "@/lib/utils/cn";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import {
  getEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/supabase/queries/events";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { Event, EventType } from "@/types";

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  practice_game: "練習試合",
  game: "公式戦",
  joint_practice: "合同練習",
  meeting: "会議",
  other: "その他",
};

function EditEventModal({
  event,
  onClose,
  onUpdated,
}: {
  event: Event;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const startDate = new Date(event.start_at);
  const endDate = event.end_at ? new Date(event.end_at) : startDate;

  const [title, setTitle] = useState(event.title);
  const [eventType, setEventType] = useState<EventType>(event.event_type);
  const [date, setDate] = useState(
    `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, "0")}-${startDate.getDate().toString().padStart(2, "0")}`
  );
  const [startTime, setStartTime] = useState(
    `${startDate.getHours().toString().padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}`
  );
  const [endTime, setEndTime] = useState(
    `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`
  );
  const [location, setLocation] = useState(event.location || "");
  const [description, setDescription] = useState(event.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !date) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const startAt = `${date}T${startTime}:00`;
      const endAt = `${date}T${endTime}:00`;

      await updateEvent(event.id, {
        title: title.trim(),
        event_type: eventType,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        start_at: startAt,
        end_at: endAt,
      });

      onUpdated();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">イベント編集</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">タイトル</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              placeholder="例: 通常練習"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">種別</label>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">日付</label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">開始時間</label>
              <input
                type="time"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">終了時間</label>
              <input
                type="time"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">場所</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              placeholder="例: 中央公園グラウンド"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">メモ（任意）</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
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
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { hasPermission, canCreateEvents } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 編集モーダル
  const [showEditModal, setShowEditModal] = useState(false);

  // 削除確認
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = canCreateEvents();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const eventData = await getEvent(eventId);
      setEvent(eventData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!teamLoading) {
      fetchData();
    }
  }, [teamLoading, fetchData]);

  // イベント削除
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteEvent(eventId);
      router.push("/calendar");
    } catch (err) {
      alert(getErrorMessage(err));
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 編集完了
  const handleEventUpdated = () => {
    setShowEditModal(false);
    fetchData();
  };

  if (isLoading || teamLoading) {
    return <Loading text="イベント情報を読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  if (!event) {
    return <ErrorDisplay title="イベントが見つかりません" message="指定されたイベントは存在しません。" />;
  }

  const typeLabel = EVENT_TYPE_LABELS[event.event_type] || "その他";

  return (
    <div className="space-y-4 p-4">
      {/* 戻るリンク */}
      <div className="flex items-center justify-between">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          カレンダーに戻る
        </Link>
        {canEdit && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowEditModal(true)}>
              <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
              編集
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setShowDeleteConfirm(true)}>
              <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              削除
            </Button>
          </div>
        )}
      </div>

      {/* イベント情報 */}
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-center gap-2">
            {event.event_type === "game" ? (
              <Badge variant="game">{typeLabel}</Badge>
            ) : event.event_type === "practice" ? (
              <Badge variant="practice">{typeLabel}</Badge>
            ) : (
              <Badge>{typeLabel}</Badge>
            )}
            <h1 className="text-lg font-bold text-gray-900">{event.title}</h1>
          </div>

          <div className="space-y-2 text-sm text-gray-900">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <div>
                <p>{formatDateTime(event.start_at)}</p>
                {event.end_at && (
                  <p className="text-xs text-gray-900">〜 {formatDateTime(event.end_at)}</p>
                )}
              </div>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span>{event.location}</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-500 hover:text-blue-700"
                  title="Googleマップで開く"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                  </svg>
                </a>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-gray-900">{event.description}</p>
          )}
        </CardContent>
      </Card>

      {/* ナビゲーションボタン */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/calendar/${eventId}/attendance`} className="block">
          <Card className="h-full cursor-pointer transition-colors hover:bg-gray-50">
            <CardContent className="flex flex-col items-center gap-2 py-5">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
              <span className="text-sm font-semibold text-gray-700">出欠回答</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/calendar/${eventId}/members`} className="block">
          <Card className="h-full cursor-pointer transition-colors hover:bg-gray-50">
            <CardContent className="flex flex-col items-center gap-2 py-5">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
              <span className="text-sm font-semibold text-gray-700">参加者リスト</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 編集モーダル */}
      {showEditModal && event && (
        <EditEventModal
          event={event}
          onClose={() => setShowEditModal(false)}
          onUpdated={handleEventUpdated}
        />
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="text-lg font-bold text-gray-900">イベントを削除</h3>
            <p className="mt-2 text-sm text-gray-600">
              「{event.title}」を削除しますか？この操作は取り消せません。
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                キャンセル
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "削除中..." : "削除する"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
