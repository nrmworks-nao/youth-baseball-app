"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { cn } from "@/lib/utils/cn";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import {
  getEvent,
  getAttendances,
  getMyChildren,
  upsertPlayerAttendance,
  upsertUserAttendance,
  updateEvent,
  deleteEvent,
} from "@/lib/supabase/queries/events";
import { supabase } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { Event, EventType } from "@/types";

// DB status mapping: DB uses present/absent/pending, UI uses attending/absent/undecided
const STATUS_MAP_TO_DB: Record<string, string> = {
  attending: "present",
  absent: "absent",
  undecided: "pending",
};

const STATUS_MAP_FROM_DB: Record<string, string> = {
  present: "attending",
  absent: "absent",
  pending: "undecided",
  late: "undecided",
};

type UIAttendanceStatus = "attending" | "absent" | "undecided";

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

const STATUS_CONFIG: Record<UIAttendanceStatus, { label: string; color: string; bgColor: string }> = {
  attending: { label: "参加", color: "text-green-700", bgColor: "bg-green-100" },
  absent: { label: "欠席", color: "text-red-700", bgColor: "bg-red-100" },
  undecided: { label: "未定", color: "text-yellow-700", bgColor: "bg-yellow-100" },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  practice: "練習",
  practice_game: "練習試合",
  game: "公式戦",
  joint_practice: "合同練習",
  meeting: "会議",
  other: "その他",
};

interface AttendanceRow {
  id: string;
  event_id: string;
  player_id: string | null;
  user_id: string | null;
  status: string;
  note: string | null;
  can_drive: boolean | null;
  car_capacity: number | null;
  players: { name: string; number: number | null } | null;
  users: { display_name: string; avatar_url: string | null } | null;
}

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
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 sm:rounded-2xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">イベント編集</h2>
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
  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [children, setChildren] = useState<{ player_id: string; players: { id: string; name: string; number: number | null } }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 編集モーダル
  const [showEditModal, setShowEditModal] = useState(false);

  // 削除確認
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 保護者自身の出欠（ローカルstate）
  const [myLocalStatus, setMyLocalStatus] = useState<UIAttendanceStatus | null>(null);
  const [myNote, setMyNote] = useState("");
  const [myCanDrive, setMyCanDrive] = useState(false);
  const [myCarCapacity, setMyCarCapacity] = useState(0);

  // 子供の出欠（ローカルstate）
  const [childLocalStatuses, setChildLocalStatuses] = useState<Record<string, UIAttendanceStatus | null>>({});

  // 送信状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const canViewAll = hasPermission(["director", "vice_president", "coach"]);
  const canEdit = canCreateEvents();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");
      setUserId(user.id);

      const [eventData, attendanceData] = await Promise.all([
        getEvent(eventId),
        getAttendances(eventId),
      ]);

      setEvent(eventData);
      setAttendances(attendanceData as AttendanceRow[]);

      let childData: typeof children = [];
      if (currentTeam) {
        childData = await getMyChildren(user.id, currentTeam.id) as typeof children;
        setChildren(childData);
      }

      // 保護者自身の既存出欠情報を復元
      const myAttendance = (attendanceData as AttendanceRow[]).find(
        (a) => a.user_id === user.id && !a.player_id
      );
      if (myAttendance) {
        setMyLocalStatus((STATUS_MAP_FROM_DB[myAttendance.status] || "undecided") as UIAttendanceStatus);
        setMyNote(myAttendance.note || "");
        setMyCanDrive(myAttendance.can_drive || false);
        setMyCarCapacity(myAttendance.car_capacity || 0);
      } else {
        setMyLocalStatus(null);
      }

      // 子供の既存出欠情報を復元
      if (childData.length > 0) {
        const statuses: Record<string, UIAttendanceStatus | null> = {};
        for (const child of childData) {
          if (!child.players) continue;
          const att = (attendanceData as AttendanceRow[]).find(
            (a) => a.player_id === child.players.id
          );
          statuses[child.players.id] = att
            ? (STATUS_MAP_FROM_DB[att.status] || "undecided") as UIAttendanceStatus
            : null;
        }
        setChildLocalStatuses(statuses);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [eventId, currentTeam]);

  useEffect(() => {
    if (!teamLoading) {
      fetchData();
    }
  }, [teamLoading, fetchData]);

  // 出欠回答の締切チェック
  const isRsvpClosed = event && (event as Event & { rsvp_deadline?: string }).rsvp_deadline
    ? new Date((event as Event & { rsvp_deadline?: string }).rsvp_deadline!) < new Date()
    : false;

  // まとめて回答を登録
  const handleSubmitAll = async () => {
    if (!userId || !currentTeam || isRsvpClosed) return;
    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      const promises: Promise<unknown>[] = [];

      // 保護者自身の出欠
      if (myLocalStatus) {
        promises.push(
          upsertUserAttendance({
            event_id: eventId,
            team_id: currentTeam.id,
            user_id: userId,
            status: STATUS_MAP_TO_DB[myLocalStatus],
            note: myNote.trim() || undefined,
            can_drive: myCanDrive,
            car_capacity: myCanDrive ? myCarCapacity : 0,
          })
        );
      }

      // 子供の出欠
      for (const [playerId, status] of Object.entries(childLocalStatuses) as [string, UIAttendanceStatus | null][]) {
        if (status) {
          promises.push(
            upsertPlayerAttendance({
              event_id: eventId,
              team_id: currentTeam.id,
              player_id: playerId,
              status: STATUS_MAP_TO_DB[status],
              responded_by: userId,
            })
          );
        }
      }

      await Promise.all(promises);
      setSubmitMessage("回答を登録しました");
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // 集計
  const attendingCount = attendances.filter((a) => a.status === "present").length;
  const absentCount = attendances.filter((a) => a.status === "absent").length;
  const undecidedCount = attendances.filter((a) => a.status === "pending" || a.status === "late").length;

  // 回答が1つでも選択されているかチェック
  const hasAnySelection = myLocalStatus !== null || Object.values(childLocalStatuses).some((s) => s !== null);

  // 表示する出欠一覧（権限に応じてフィルタ）
  const visibleAttendances = canViewAll
    ? attendances
    : attendances.filter((a) =>
        a.user_id === userId || children.some((c) => c.player_id === a.player_id)
      );

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
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{event.title}</h1>
          </div>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <div>
                <p>{formatDateTime(event.start_at)}</p>
                {event.end_at && (
                  <p className="text-xs text-gray-400">〜 {formatDateTime(event.end_at)}</p>
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
            <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
          )}

          {isRsvpClosed && (
            <div className="rounded-lg bg-yellow-50 p-2 text-center text-sm font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
              出欠回答は締め切りました
            </div>
          )}
        </CardContent>
      </Card>

      {/* 出欠回答フォーム */}
      <Card>
        <CardContent className="space-y-5 pt-4">
          {/* 保護者自身の出欠 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">保護者の出欠回答</h3>
            <div className="flex gap-2">
              {(["attending", "absent", "undecided"] as const).map((status) => (
                <Button
                  key={status}
                  variant={myLocalStatus === status ? "default" : "outline"}
                  className={cn(
                    "flex-1",
                    myLocalStatus === status && status === "attending" && "bg-green-600 hover:bg-green-700",
                    myLocalStatus === status && status === "absent" && "bg-red-600 hover:bg-red-700",
                    myLocalStatus === status && status === "undecided" && "bg-yellow-500 hover:bg-yellow-600"
                  )}
                  onClick={() => setMyLocalStatus(status)}
                  disabled={isRsvpClosed}
                >
                  {STATUS_CONFIG[status].label}
                </Button>
              ))}
            </div>

            {/* 車出し */}
            <div className="space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={myCanDrive}
                  onChange={(e) => setMyCanDrive(e.target.checked)}
                  disabled={isRsvpClosed}
                />
                車出し可能
              </label>
              {myCanDrive && (
                <div className="flex items-center gap-2 pl-6">
                  <label className="text-xs text-gray-500">乗車可能人数:</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    className="w-16 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    value={myCarCapacity}
                    onChange={(e) => setMyCarCapacity(Number(e.target.value))}
                    disabled={isRsvpClosed}
                  />
                  <span className="text-xs text-gray-500">人</span>
                </div>
              )}
            </div>

            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              rows={2}
              placeholder="コメント（任意）"
              value={myNote}
              onChange={(e) => setMyNote(e.target.value)}
              disabled={isRsvpClosed}
            />
          </div>

          {/* 子供の出欠登録 */}
          {children.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">お子さんの出欠回答</h3>
              {children.map((child) => {
                const player = child.players;
                if (!player) return null;
                const childStatus = childLocalStatuses[player.id] ?? null;
                return (
                  <div key={player.id} className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {player.name}
                      {player.number != null && (
                        <span className="ml-1 text-xs text-gray-400">（背番号{player.number}）</span>
                      )}
                    </p>
                    <div className="flex gap-2">
                      {(["attending", "absent", "undecided"] as const).map((status) => (
                        <Button
                          key={status}
                          variant={childStatus === status ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "flex-1",
                            childStatus === status && status === "attending" && "bg-green-600 hover:bg-green-700",
                            childStatus === status && status === "absent" && "bg-red-600 hover:bg-red-700",
                            childStatus === status && status === "undecided" && "bg-yellow-500 hover:bg-yellow-600"
                          )}
                          onClick={() =>
                            setChildLocalStatuses((prev) => ({ ...prev, [player.id]: status }))
                          }
                          disabled={isRsvpClosed}
                        >
                          {STATUS_CONFIG[status].label}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 登録ボタン */}
          {!isRsvpClosed && (
            <div className="space-y-2">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleSubmitAll}
                disabled={isSubmitting || !hasAnySelection}
              >
                {isSubmitting ? "登録中..." : "回答を登録"}
              </Button>
              {submitMessage && (
                <p className="text-center text-sm font-medium text-green-600 dark:text-green-400">
                  {submitMessage}
                </p>
              )}
            </div>
          )}
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
          {visibleAttendances.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">まだ回答がありません</p>
          ) : (
            <div className="space-y-2">
              {visibleAttendances.map((attendance) => {
                const uiStatus = (STATUS_MAP_FROM_DB[attendance.status] || "undecided") as UIAttendanceStatus;
                const config = STATUS_CONFIG[uiStatus];
                const displayName = attendance.players?.name
                  || attendance.users?.display_name
                  || "不明";
                return (
                  <div
                    key={attendance.id}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {displayName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{displayName}</span>
                        {attendance.player_id && (
                          <span className="ml-1 text-xs text-gray-400">（選手）</span>
                        )}
                        {!attendance.player_id && attendance.user_id && (
                          <span className="ml-1 text-xs text-gray-400">（保護者）</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {attendance.can_drive && (
                        <span className="text-xs text-blue-600" title={`乗車${attendance.car_capacity}人`}>
                          🚗{attendance.car_capacity}人
                        </span>
                      )}
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
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-gray-900">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">イベントを削除</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
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
