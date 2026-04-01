"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { PlayerAvatar } from "@/components/features/PlayerAvatar";
import { cn } from "@/lib/utils/cn";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import {
  getEvent,
  getAttendances,
} from "@/lib/supabase/queries/events";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { Event } from "@/types";

const STATUS_MAP_FROM_DB: Record<string, string> = {
  present: "attending",
  absent: "absent",
  pending: "undecided",
  late: "undecided",
};

type UIAttendanceStatus = "attending" | "absent" | "undecided";

const STATUS_CONFIG: Record<UIAttendanceStatus, { label: string; color: string; bgColor: string }> = {
  attending: { label: "参加", color: "text-green-700", bgColor: "bg-green-100" },
  absent: { label: "欠席", color: "text-red-700", bgColor: "bg-red-100" },
  undecided: { label: "未定", color: "text-yellow-700", bgColor: "bg-yellow-100" },
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
  players: { name: string; number: number | null; card_photo_url?: string | null } | null;
  users: { display_name: string; avatar_url: string | null } | null;
}

function StatusBadge({ status }: { status: UIAttendanceStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", config.bgColor, config.color)}>
      {config.label}
    </span>
  );
}

function SummaryBar({ attending, absent, undecided, noResponse }: { attending: number; absent: number; undecided: number; noResponse: number }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="font-medium text-green-600">参加 {attending}</span>
      <span className="font-medium text-red-600">欠席 {absent}</span>
      <span className="font-medium text-yellow-600">未定 {undecided}</span>
      {noResponse > 0 && <span className="font-medium text-gray-400">未回答 {noResponse}</span>}
    </div>
  );
}

export default function MembersPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { isLoading: teamLoading } = useCurrentTeam();

  const [event, setEvent] = useState<Event | null>(null);
  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [eventData, attendanceData] = await Promise.all([
        getEvent(eventId),
        getAttendances(eventId),
      ]);
      setEvent(eventData);
      setAttendances(attendanceData as AttendanceRow[]);
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

  if (isLoading || teamLoading) {
    return <Loading text="参加者情報を読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  if (!event) {
    return <ErrorDisplay title="イベントが見つかりません" message="指定されたイベントは存在しません。" />;
  }

  // 部員（player_id あり）と保護者（player_id なし）に分割
  const playerAttendances = attendances.filter((a) => a.player_id !== null);
  const parentAttendances = attendances.filter((a) => a.player_id === null && a.user_id !== null);

  // ステータス別に分類する関数
  const groupByStatus = (rows: AttendanceRow[]) => {
    const attending: AttendanceRow[] = [];
    const absent: AttendanceRow[] = [];
    const undecided: AttendanceRow[] = [];
    for (const row of rows) {
      const uiStatus = (STATUS_MAP_FROM_DB[row.status] || "undecided") as UIAttendanceStatus;
      if (uiStatus === "attending") attending.push(row);
      else if (uiStatus === "absent") absent.push(row);
      else undecided.push(row);
    }
    return { attending, absent, undecided };
  };

  const playerGroups = groupByStatus(playerAttendances);
  const parentGroups = groupByStatus(parentAttendances);

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

      <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">参加者リスト</h1>

      {/* 部員セクション */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">部員</CardTitle>
            <SummaryBar
              attending={playerGroups.attending.length}
              absent={playerGroups.absent.length}
              undecided={playerGroups.undecided.length}
              noResponse={0}
            />
          </div>
        </CardHeader>
        <CardContent>
          {playerAttendances.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">まだ回答がありません</p>
          ) : (
            <div className="space-y-2">
              {/* 参加 */}
              {playerGroups.attending.map((a) => (
                <PlayerRow key={a.id} attendance={a} status="attending" />
              ))}
              {/* 欠席 */}
              {playerGroups.absent.map((a) => (
                <PlayerRow key={a.id} attendance={a} status="absent" />
              ))}
              {/* 未定 */}
              {playerGroups.undecided.map((a) => (
                <PlayerRow key={a.id} attendance={a} status="undecided" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 保護者セクション */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">保護者</CardTitle>
            <SummaryBar
              attending={parentGroups.attending.length}
              absent={parentGroups.absent.length}
              undecided={parentGroups.undecided.length}
              noResponse={0}
            />
          </div>
        </CardHeader>
        <CardContent>
          {parentAttendances.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">まだ回答がありません</p>
          ) : (
            <div className="space-y-2">
              {/* 参加 */}
              {parentGroups.attending.map((a) => (
                <ParentRow key={a.id} attendance={a} status="attending" />
              ))}
              {/* 欠席 */}
              {parentGroups.absent.map((a) => (
                <ParentRow key={a.id} attendance={a} status="absent" />
              ))}
              {/* 未定 */}
              {parentGroups.undecided.map((a) => (
                <ParentRow key={a.id} attendance={a} status="undecided" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlayerRow({ attendance, status }: { attendance: AttendanceRow; status: UIAttendanceStatus }) {
  const isInactive = status !== "attending";
  const player = attendance.players;
  const displayName = player?.name || "不明";

  return (
    <div className={cn("flex items-center justify-between rounded-lg px-2 py-1.5", isInactive && "opacity-50")}>
      <div className="flex items-center gap-2">
        <PlayerAvatar
          player={{
            name: displayName,
            card_photo_url: player?.card_photo_url,
            number: player?.number ?? undefined,
          }}
          size="sm"
          showNumber
        />
        <div>
          <span className="text-sm text-gray-700 dark:text-gray-300">{displayName}</span>
          {player?.number != null && (
            <span className="ml-1 text-xs text-gray-400">#{player.number}</span>
          )}
        </div>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}

function ParentRow({ attendance, status }: { attendance: AttendanceRow; status: UIAttendanceStatus }) {
  const isInactive = status !== "attending";
  const displayName = attendance.users?.display_name || "不明";

  return (
    <div className={cn("flex items-center justify-between rounded-lg px-2 py-1.5", isInactive && "opacity-50")}>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {displayName.charAt(0)}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-700 dark:text-gray-300">{displayName}</span>
          {attendance.can_drive && (
            <span className="text-xs text-blue-600" title={`乗車${attendance.car_capacity}人`}>
              🚗{attendance.car_capacity}人
            </span>
          )}
        </div>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}
