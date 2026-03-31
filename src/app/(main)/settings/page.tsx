"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { supabase } from "@/lib/supabase/client";
import {
  updateTeam,
  generateInviteCode,
  updateRequireApproval,
} from "@/lib/supabase/queries/teams";
import { usePermission } from "@/hooks/usePermission";
import type { Team, TeamMember } from "@/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

export default function SettingsPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [teamName, setTeamName] = useState("");
  const [region, setRegion] = useState("");
  const [league, setLeague] = useState("");
  const [requireApproval, setRequireApproval] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { hasPermission } = usePermission(member?.permission_group ?? null);
  const canManage = hasPermission(["team_admin", "vice_president"]);

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("ログインが必要です");
          setIsLoading(false);
          return;
        }

        // ユーザーの所属チームを取得
        const { data: members } = await supabase
          .from("team_members")
          .select("*, teams(*)")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1)
          .single();

        if (!members || !members.teams) {
          setError("チームに所属していません");
          setIsLoading(false);
          return;
        }

        const teamData = members.teams as Team;
        const memberData = members as TeamMember;

        setTeam(teamData);
        setMember(memberData);
        setTeamName(teamData.name);
        setRegion(teamData.region || "");
        setLeague(teamData.league || "");
        setRequireApproval(teamData.require_approval);
        setIsLoading(false);
      } catch {
        setError("データの取得に失敗しました");
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveTeamInfo = async () => {
    if (!team) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await updateTeam(team.id, { name: teamName, region, league });
      setSaveMessage("保存しました");
      setTimeout(() => setSaveMessage(null), 2000);
    } catch {
      setSaveMessage("保存に失敗しました");
    }
    setIsSaving(false);
  };

  const handleToggleApproval = async () => {
    if (!team) return;
    const newVal = !requireApproval;
    setRequireApproval(newVal);
    try {
      await updateRequireApproval(team.id, newVal);
    } catch {
      setRequireApproval(!newVal);
    }
  };

  const handleGenerateInviteCode = async () => {
    if (!team) return;
    setIsGenerating(true);
    try {
      const code = await generateInviteCode(team.id);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      setTeam({
        ...team,
        invite_code: code,
        invite_expires_at: expiresAt.toISOString(),
      });
    } catch {
      // エラー処理
    }
    setIsGenerating(false);
  };

  const handleCopyLink = async () => {
    if (!team?.invite_code) return;
    const url = `${APP_URL}/invite/${team.invite_code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // フォールバック
    }
  };

  const isExpired =
    team?.invite_expires_at && new Date(team.invite_expires_at) < new Date();
  const inviteUrl = team?.invite_code
    ? `${APP_URL}/invite/${team.invite_code}`
    : null;

  if (isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">チーム設定</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* チーム情報編集 */}
        <Card>
          <CardHeader>
            <CardTitle>チーム情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Input
                label="チーム名"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={!canManage}
              />
              <Input
                label="地域"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                disabled={!canManage}
              />
              <Input
                label="所属リーグ"
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                disabled={!canManage}
              />
              {canManage && (
                <Button
                  className="w-full"
                  onClick={handleSaveTeamInfo}
                  disabled={isSaving}
                >
                  {isSaving ? "保存中..." : "保存"}
                </Button>
              )}
              {saveMessage && (
                <p className="text-center text-sm text-green-600">
                  {saveMessage}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 参加承認 */}
        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle>参加設定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    参加承認を必要にする
                  </p>
                  <p className="text-xs text-gray-400">
                    ONにすると、招待リンクからの参加に管理者の承認が必要になります
                  </p>
                </div>
                <button
                  onClick={handleToggleApproval}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    requireApproval ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      requireApproval ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 招待リンク */}
        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle>招待リンク</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inviteUrl && !isExpired ? (
                  <>
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
                      <code className="flex-1 truncate text-sm text-gray-700">
                        {inviteUrl}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyLink}
                      >
                        {copied ? "コピー済み" : "コピー"}
                      </Button>
                    </div>
                    {team?.invite_expires_at && (
                      <p className="text-xs text-gray-500">
                        有効期限:{" "}
                        {new Date(team.invite_expires_at).toLocaleDateString(
                          "ja-JP"
                        )}
                      </p>
                    )}
                    <div className="flex items-center justify-center rounded-lg border border-gray-200 p-6">
                      <QRCodeSVG value={inviteUrl} size={160} />
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    {isExpired ? (
                      <p className="text-sm text-red-500">
                        招待リンクの有効期限が切れています
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        招待リンクが未生成です
                      </p>
                    )}
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGenerateInviteCode}
                  disabled={isGenerating}
                >
                  {isGenerating
                    ? "生成中..."
                    : isExpired || !inviteUrl
                      ? "新しいリンクを生成"
                      : "リンクを再生成"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* メニューリンク */}
        <div className="space-y-2">
          {canManage && (
            <Link href="/settings/members">
              <Card className="p-4 transition-colors hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    メンバー管理
                  </span>
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </Card>
            </Link>
          )}
          <Link href="/settings/line">
            <Card className="p-4 transition-colors hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  LINE連携設定
                </span>
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
