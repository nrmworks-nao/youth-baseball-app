"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { getTeamProfile, upsertTeamProfile } from "@/lib/supabase/queries/inter-team";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { TeamProfile } from "@/types";

export default function TeamProfilePage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { isAdmin, canSendInterTeamMessage, canRequestMatch } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);

  const [profile, setProfile] = useState<TeamProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 編集フォーム
  const [editIntro, setEditIntro] = useState("");
  const [editGround, setEditGround] = useState("");
  const [editSchedule, setEditSchedule] = useState("");
  const [editMemberCount, setEditMemberCount] = useState("");
  const [editFoundedYear, setEditFoundedYear] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const isOwnTeam = currentTeam?.id === teamId;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTeamProfile(teamId);
      setProfile(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (!teamLoading) {
      fetchData();
    }
  }, [teamLoading, fetchData]);

  const startEditing = () => {
    if (profile) {
      setEditIntro(profile.introduction ?? "");
      setEditGround(profile.home_ground ?? "");
      setEditSchedule(profile.practice_schedule ?? "");
      setEditMemberCount(profile.member_count?.toString() ?? "");
      setEditFoundedYear(profile.founded_year?.toString() ?? "");
      setEditEmail(profile.contact_email ?? "");
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertTeamProfile({
        team_id: teamId,
        introduction: editIntro.trim() || undefined,
        home_ground: editGround.trim() || undefined,
        practice_schedule: editSchedule.trim() || undefined,
        member_count: editMemberCount ? Number(editMemberCount) : undefined,
        founded_year: editFoundedYear ? Number(editFoundedYear) : undefined,
        contact_email: editEmail.trim() || undefined,
      });
      setIsEditing(false);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (teamLoading || isLoading) {
    return <Loading text="プロフィールを読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  if (!profile) {
    return <ErrorDisplay title="プロフィールが見つかりません" />;
  }

  const team = (profile as unknown as { teams?: { id: string; name: string; region?: string; league?: string } }).teams;
  const teamName = team?.name ?? "チーム";
  const region = team?.region;
  const league = team?.league;

  if (isEditing) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
          <button onClick={() => setIsEditing(false)} className="text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="text-base font-bold text-gray-900">プロフィール編集</h2>
        </div>
        <div className="space-y-4 p-4">
          <Textarea label="チーム紹介" value={editIntro} onChange={(e) => setEditIntro(e.target.value)} />
          <Input label="ホームグラウンド" value={editGround} onChange={(e) => setEditGround(e.target.value)} />
          <Input label="活動日" value={editSchedule} onChange={(e) => setEditSchedule(e.target.value)} />
          <Input label="部員数" type="number" value={editMemberCount} onChange={(e) => setEditMemberCount(e.target.value)} />
          <Input label="設立年" type="number" value={editFoundedYear} onChange={(e) => setEditFoundedYear(e.target.value)} />
          <Input label="連絡先メール" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
          <Button className="w-full" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/teams/search" className="text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h2 className="text-base font-bold text-gray-900">チームプロフィール</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* チーム名・基本情報 */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <span className="text-3xl">⚾</span>
              </div>
            </div>
            <h1 className="mt-3 text-center text-xl font-bold text-gray-900">{teamName}</h1>
            <div className="mt-2 flex justify-center gap-2">
              {region && <Badge variant="default">{region}</Badge>}
              {league && <Badge variant="practice">{league}</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* 紹介文 */}
        {profile.introduction && (
          <Card>
            <CardContent className="py-3">
              <h3 className="text-sm font-medium text-gray-900">チーム紹介</h3>
              <p className="mt-2 text-sm text-gray-700">{profile.introduction}</p>
            </CardContent>
          </Card>
        )}

        {/* 詳細情報 */}
        <Card>
          <CardContent className="py-3">
            <div className="space-y-3">
              {profile.home_ground && <InfoRow label="ホームグラウンド" value={profile.home_ground} />}
              {profile.practice_schedule && <InfoRow label="活動日" value={profile.practice_schedule} />}
              {profile.member_count != null && <InfoRow label="部員数" value={`${profile.member_count}名`} />}
              {profile.founded_year != null && <InfoRow label="設立" value={`${profile.founded_year}年`} />}
              {profile.contact_email && <InfoRow label="連絡先" value={profile.contact_email} />}
            </div>
          </CardContent>
        </Card>

        {/* アクション */}
        <div className="flex flex-col gap-3">
          {isOwnTeam && isAdmin() && (
            <Button className="w-full" onClick={startEditing}>
              プロフィールを編集
            </Button>
          )}
          {!isOwnTeam && canSendInterTeamMessage() && (
            <Link href="/teams/messages">
              <Button className="w-full" variant="outline">
                メッセージを送る
              </Button>
            </Link>
          )}
          {!isOwnTeam && canRequestMatch() && (
            <Link href="/teams/matches/request">
              <Button className="w-full">
                練習試合を申し込む
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-28 flex-shrink-0 text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
