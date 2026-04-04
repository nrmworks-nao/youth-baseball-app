"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { cn } from "@/lib/utils/cn";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
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

const STATUS_CONFIG: Record<UIAttendanceStatus, { label: string }> = {
  attending: { label: "参加" },
  absent: { label: "欠席" },
  undecided: { label: "未定" },
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

export default function AttendancePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { currentTeam, isLoading: teamLoading } = useCurrentTeam();

  const [event, setEvent] = useState<Event | null>(null);
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

  // 回答が1つでも選択されているかチェック
  const hasAnySelection = myLocalStatus !== null || Object.values(childLocalStatuses).some((s) => s !== null);

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
    return <Loading text="出欠情報を読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  if (!event) {
    return <ErrorDisplay title="イベントが見つかりません" message="指定されたイベントは存在しません。" />;
  }

  return (
    <div className="space-y-4 p-4">
      {/* 戻るリンク */}
      <Link
        href={`/calendar/${eventId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        イベント詳細に戻る
      </Link>

      <h1 className="text-lg font-bold text-gray-900">出欠回答</h1>

      {isRsvpClosed && (
        <div className="rounded-lg bg-yellow-50 p-2 text-center text-sm font-medium text-yellow-700">
          出欠回答は締め切りました
        </div>
      )}

      {/* 出欠回答フォーム */}
      <Card>
        <CardContent className="space-y-5 pt-4">
          {/* 保護者自身の出欠 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">保護者の出欠回答</h3>
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
            <div className="space-y-2 rounded-lg bg-gray-50 p-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
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
                    className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                    value={myCarCapacity}
                    onChange={(e) => setMyCarCapacity(Number(e.target.value))}
                    disabled={isRsvpClosed}
                  />
                  <span className="text-xs text-gray-500">人</span>
                </div>
              )}
            </div>

            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
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
              <h3 className="text-sm font-semibold text-gray-900">お子さんの出欠回答</h3>
              {children.map((child) => {
                const player = child.players;
                if (!player) return null;
                const childStatus = childLocalStatuses[player.id] ?? null;
                return (
                  <div key={player.id} className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
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
                <p className="text-center text-sm font-medium text-green-600">
                  {submitMessage}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
