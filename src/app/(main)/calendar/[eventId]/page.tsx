"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
} from "@/lib/supabase/queries/events";
import { supabase } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { Event } from "@/types";

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

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { hasPermission } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);

  const [event, setEvent] = useState<Event | null>(null);
  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [children, setChildren] = useState<{ player_id: string; players: { id: string; name: string; number: number | null } }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <Link
        href="/calendar"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        カレンダーに戻る
      </Link>

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
    </div>
  );
}
