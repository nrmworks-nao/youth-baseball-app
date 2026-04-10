"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { searchTeams, createMatchRequest } from "@/lib/supabase/queries/inter-team";
import { supabase } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { TeamProfile } from "@/types";

export default function MatchRequestPage() {
  return (
    <Suspense fallback={<Loading text="読み込み中..." />}>
      <MatchRequestContent />
    </Suspense>
  );
}

function MatchRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramToTeamId = searchParams.get("toTeamId");
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { canManageInterTeam } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);

  const [teams, setTeams] = useState<TeamProfile[]>([]);
  const [toTeam, setToTeam] = useState(paramToTeamId ?? "");
  const [format, setFormat] = useState("practice_match");
  const [venue, setVenue] = useState("");
  const [message, setMessage] = useState("");
  const [dates, setDates] = useState([{ date: "", startTime: "", endTime: "" }]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function loadTeams() {
      try {
        const data = await searchTeams();
        setTeams(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }
    if (!teamLoading) {
      loadTeams();
    }
  }, [teamLoading]);

  const addDate = () => {
    if (dates.length < 5) {
      setDates([...dates, { date: "", startTime: "", endTime: "" }]);
    }
  };

  const removeDate = (index: number) => {
    setDates(dates.filter((_, i) => i !== index));
  };

  const updateDate = (index: number, field: string, value: string) => {
    setDates(dates.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const handleSubmit = async () => {
    if (!currentTeam || !toTeam) return;
    const validDates = dates.filter((d) => d.date);
    if (validDates.length === 0) return;

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await createMatchRequest({
        from_team_id: currentTeam.id,
        to_team_id: toTeam,
        requested_by: user.id,
        message: message.trim() || undefined,
        preferred_venue: venue.trim() || undefined,
        dates: validDates.map((d) => ({
          proposed_date: d.date,
          start_time: d.startTime || undefined,
          end_time: d.endTime || undefined,
        })),
      });
      router.push("/teams/matches");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  if (teamLoading || isLoading) {
    return <Loading text="読み込み中..." />;
  }
  if (!canManageInterTeam()) {
    return <ErrorDisplay message="権限がありません" />;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/teams/matches" className="text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h2 className="text-base font-bold text-gray-900">練習試合申し込み</h2>
      </div>

      {error && <ErrorDisplay message={error} />}

      <div className="space-y-4 p-4">
        <Card className="p-4">
          <div className="space-y-3">
            <Select label="相手チーム" value={toTeam} onChange={(e) => setToTeam(e.target.value)}>
              <option value="">チームを選択...</option>
              {teams
                .filter((t) => t.team_id !== currentTeam?.id)
                .map((t) => {
                  const team = (t as unknown as { teams?: { name: string } }).teams;
                  return (
                    <option key={t.team_id} value={t.team_id}>{team?.name ?? t.team_id}</option>
                  );
                })}
            </Select>

            <Select label="形式" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="practice_match">練習試合</option>
              <option value="joint_practice">合同練習</option>
            </Select>

            <Input
              label="会場（希望）"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="グラウンド名など"
            />
          </div>
        </Card>

        {/* 日程候補 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">希望日時（複数候補）</h3>
            <Button size="sm" variant="outline" onClick={addDate} disabled={dates.length >= 5}>
              + 追加
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {dates.map((d, index) => (
              <div key={index} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">候補{index + 1}</span>
                  {dates.length > 1 && (
                    <button onClick={() => removeDate(index)} className="text-xs text-red-500">
                      削除
                    </button>
                  )}
                </div>
                <div className="mt-2 space-y-2">
                  <Input
                    label="日付"
                    type="date"
                    value={d.date}
                    onChange={(e) => updateDate(index, "date", e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="開始時間"
                      type="time"
                      value={d.startTime}
                      onChange={(e) => updateDate(index, "startTime", e.target.value)}
                    />
                    <Input
                      label="終了時間"
                      type="time"
                      value={d.endTime}
                      onChange={(e) => updateDate(index, "endTime", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <Textarea
            label="メッセージ（任意）"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="ご連絡事項があれば..."
          />
        </Card>

        <Button
          className="w-full"
          size="lg"
          disabled={!toTeam || dates.every((d) => !d.date) || isSending}
          onClick={handleSubmit}
        >
          {isSending ? "送信中..." : "申し込みを送信"}
        </Button>
      </div>
    </div>
  );
}
