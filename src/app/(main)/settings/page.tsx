"use client";

import { useEffect, useState, useRef } from "react";
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

function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

async function uploadTeamImage(
  teamId: string,
  file: File,
  type: "logo" | "banner"
): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${teamId}/${type}.${ext}`;

  // 既存ファイルがあれば削除（upsertで上書き）
  await supabase.storage.from("team-assets").remove([path]);

  const { error } = await supabase.storage
    .from("team-assets")
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("team-assets").getPublicUrl(path);

  // teams テーブルを更新
  const column = type === "logo" ? "logo_url" : "banner_url";
  const { error: updateError } = await supabase
    .from("teams")
    .update({ [column]: publicUrl })
    .eq("id", teamId);
  if (updateError) throw updateError;

  return publicUrl;
}

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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const { canManageSettings, canManageMembersPage } = usePermission(member?.permission_group ?? null, member?.is_admin ?? false);

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
      setTeam({
        ...team,
        invite_code: code,
        invite_expires_at: null,
      });
    } catch {
      // エラー処理
    }
    setIsGenerating(false);
  };

  const handleCopyLink = async () => {
    if (!team?.invite_code) return;
    const url = `${getAppUrl()}/invite/${team.invite_code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // フォールバック
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !team) return;
    setIsUploadingLogo(true);
    try {
      const publicUrl = await uploadTeamImage(team.id, file, "logo");
      setTeam({ ...team, logo_url: publicUrl });
    } catch {
      setSaveMessage("ロゴのアップロードに失敗しました");
      setTimeout(() => setSaveMessage(null), 2000);
    }
    setIsUploadingLogo(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !team) return;
    setIsUploadingBanner(true);
    try {
      const publicUrl = await uploadTeamImage(team.id, file, "banner");
      setTeam({ ...team, banner_url: publicUrl });
    } catch {
      setSaveMessage("バナーのアップロードに失敗しました");
      setTimeout(() => setSaveMessage(null), 2000);
    }
    setIsUploadingBanner(false);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  const isExpired =
    team?.invite_expires_at != null && new Date(team.invite_expires_at) < new Date();
  const inviteUrl = team?.invite_code
    ? `${getAppUrl()}/invite/${team.invite_code}`
    : null;

  const teamInitial = team?.name?.charAt(0) || "T";

  const canManage = canManageSettings();

  if (isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;
  if (!canManageSettings() && !canManageMembersPage()) return <ErrorDisplay message="権限がありません" />;

  return (
    <div className="flex flex-col min-w-0">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">チーム設定</h2>
      </div>

      <div className="space-y-4 p-3 sm:p-4 max-w-2xl w-full mx-auto">
        {/* バナー画像 */}
        <Card className="overflow-hidden">
          <div className="relative h-[120px]">
            {team?.banner_url ? (
              <img
                src={team.banner_url}
                alt="チームバナー"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-400" />
            )}
            {canManage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploadingBanner}
                  className="rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow hover:bg-white transition-colors disabled:opacity-50"
                >
                  {isUploadingBanner ? "アップロード中..." : "バナーを変更"}
                </button>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleBannerUpload}
                />
              </div>
            )}
          </div>
        </Card>

        {/* チーム情報編集 */}
        <Card>
          <CardHeader>
            <CardTitle>チーム情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* チームロゴ */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {team?.logo_url ? (
                    <img
                      src={team.logo_url}
                      alt="チームロゴ"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-2xl">
                      {teamInitial}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-gray-700">チームロゴ</p>
                  {canManage && (
                    <>
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="text-sm text-primary hover:underline disabled:opacity-50"
                      >
                        {isUploadingLogo ? "アップロード中..." : "変更"}
                      </button>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </>
                  )}
                </div>
              </div>

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
                  className="w-full min-h-[44px]"
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
                  className={`relative shrink-0 h-7 w-12 rounded-full transition-colors ${
                    requireApproval ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg bg-gray-50 p-3">
                      <code className="flex-1 min-w-0 break-all text-sm text-gray-700">
                        {inviteUrl}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                        onClick={handleCopyLink}
                      >
                        {copied ? "コピー済み" : "コピー"}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      有効期限:{" "}
                      {team?.invite_expires_at
                        ? new Date(team.invite_expires_at).toLocaleDateString(
                            "ja-JP"
                          )
                        : "なし"}
                    </p>
                    <div className="flex items-center justify-center rounded-lg border border-gray-200 p-4 sm:p-6">
                      <QRCodeSVG value={inviteUrl} size={160} className="max-w-full h-auto" />
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
                  className="w-full min-h-[44px]"
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
