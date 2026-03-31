"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { getMatchRequests, updateMatchRequestStatus } from "@/lib/supabase/queries/inter-team";
import { supabase } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { MatchRequest, MatchRequestDate } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; variant: "primary" | "warning" | "danger" | "default" }> = {
  pending: { label: "申込中", variant: "warning" },
  accepted: { label: "承認", variant: "primary" },
  declined: { label: "拒否", variant: "danger" },
  cancelled: { label: "キャンセル", variant: "default" },
};

export default function MatchesPage() {
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { canRequestMatch } = usePermission(currentMembership?.permission_group ?? null);

  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentTeam) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMatchRequests(currentTeam.id);
      setRequests(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (!teamLoading && currentTeam) {
      fetchData();
    }
  }, [teamLoading, currentTeam, fetchData]);

  const handleRespond = async (requestId: string, status: string, selectedDateId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await updateMatchRequestStatus(requestId, status, user.id, selectedDateId);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (teamLoading || isLoading) {
    return <Loading text="練習試合を読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  if (!currentTeam) {
    return <ErrorDisplay title="チーム未選択" message="チームを選択してください。" />;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">練習試合管理</h2>
        {canRequestMatch() && (
          <Link href="/teams/matches/request">
            <Button size="sm">+ 申し込み</Button>
          </Link>
        )}
      </div>

      <div className="space-y-2 p-4">
        {requests.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">練習試合の申し込みはありません</p>
        ) : (
          requests.map((match) => {
            const cfg = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.pending;
            const isOutgoing = match.from_team_id === currentTeam.id;
            const fromTeamName = (match as unknown as { from_team?: { name: string } }).from_team?.name ?? "不明";
            const toTeamName = (match as unknown as { to_team?: { name: string } }).to_team?.name ?? "不明";
            const dates: MatchRequestDate[] = (match as unknown as { match_request_dates?: MatchRequestDate[] }).match_request_dates ?? [];

            return (
              <Card key={match.id} className="p-4 transition-colors hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isOutgoing ? "default" : "practice"}>
                        {isOutgoing ? "送信" : "受信"}
                      </Badge>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-900">
                      vs {isOutgoing ? toTeamName : fromTeamName}
                    </p>
                    {match.preferred_venue && (
                      <p className="mt-0.5 text-xs text-gray-500">会場: {match.preferred_venue}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {dates.map((d) => (
                        <span
                          key={d.id}
                          className={`rounded bg-gray-100 px-1.5 py-0.5 text-xs ${
                            d.is_selected
                              ? "bg-green-100 font-medium text-green-700"
                              : "text-gray-600"
                          }`}
                        >
                          {d.proposed_date}
                          {d.start_time ? ` ${d.start_time}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(match.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                {/* 受信側でpendingの場合、承認/拒否ボタン */}
                {!isOutgoing && match.status === "pending" && canRequestMatch() && (
                  <div className="mt-3 space-y-2">
                    {dates.length > 1 && (
                      <p className="text-xs text-gray-500">承認する日程を選択:</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {dates.map((d) => (
                        <Button
                          key={d.id}
                          size="sm"
                          variant="outline"
                          onClick={() => handleRespond(match.id, "accepted", d.id)}
                        >
                          {d.proposed_date} で承認
                        </Button>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleRespond(match.id, "declined")}
                    >
                      拒否
                    </Button>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
