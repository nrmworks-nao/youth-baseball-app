"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { supabase } from "@/lib/supabase/client";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import {
  getPendingMembers,
  approveMember,
  rejectMember,
  getTeamMembers,
  updateMemberRole,
  updateMemberAdmin,
  deactivateMember,
  countAdmins,
  getMemberChildren,
} from "@/lib/supabase/queries/members";
import { getRoleLabel, ROLE_OPTIONS } from "@/lib/utils/roles";
import type { TeamMember } from "@/types";

export default function MembersPage() {
  const { currentMembership } = useCurrentTeam();
  const { canManageMembersPage } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentMemberIsAdmin, setCurrentMemberIsAdmin] = useState(false);
  const [pendingMembers, setPendingMembers] = useState<TeamMember[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // 承認待ちメンバーの子供情報
  const [pendingChildren, setPendingChildren] = useState<
    Record<string, { name: string; number?: number }[]>
  >({});

  const loadDataRef = useRef(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("ログインが必要です");
        setIsLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      const { data: memberData } = await supabase
        .from("team_members")
        .select("team_id, is_admin")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!memberData) {
        setError("チームに所属していません");
        setIsLoading(false);
        return;
      }

      const tId = memberData.team_id;
      setTeamId(tId);
      setCurrentMemberIsAdmin(memberData.is_admin ?? false);

      const [pending, active] = await Promise.all([
        getPendingMembers(tId),
        getTeamMembers(tId),
      ]);

      setPendingMembers(pending);
      setMembers(active);

      // 承認待ちメンバーの子供情報を取得
      const childrenMap: Record<string, { name: string; number?: number }[]> =
        {};
      for (const pm of pending) {
        const children = await getMemberChildren(pm.user_id, tId);
        if (children) {
          childrenMap[pm.id] = children.map(
            (c: { players: { name: string; number?: number } }) => ({
              name: c.players?.name || "",
              number: c.players?.number,
            })
          );
        }
      }
      setPendingChildren(childrenMap);

      setIsLoading(false);
    } catch {
      setError("データの取得に失敗しました");
      setIsLoading(false);
    }
  });
  const loadData = () => loadDataRef.current();

  useEffect(() => {
    loadDataRef.current();
  }, []);

  const showMessage = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 2000);
  };

  const handleApprove = async (memberId: string) => {
    try {
      await approveMember(memberId);
      showMessage("承認しました");
      loadData();
    } catch {
      showMessage("承認に失敗しました");
    }
  };

  const handleReject = async (memberId: string) => {
    try {
      await rejectMember(memberId);
      showMessage("拒否しました");
      loadData();
    } catch {
      showMessage("拒否に失敗しました");
    }
  };

  const handleDeactivate = async (memberId: string) => {
    try {
      await deactivateMember(memberId);
      showMessage("退会処理が完了しました");
      setConfirmDeleteId(null);
      loadData();
    } catch {
      showMessage("退会処理に失敗しました");
    }
  };

  const handleToggleAdmin = async (member: TeamMember) => {
    if (!teamId) return;
    const newAdminState = !member.is_admin;

    // サイト管理者を解除する場合、最後の1人かチェック
    if (!newAdminState) {
      const adminCount = await countAdmins(teamId);
      if (adminCount <= 1) {
        showMessage("サイト管理者は最低1名必要です");
        return;
      }
    }

    try {
      await updateMemberAdmin(member.id, newAdminState);
      showMessage(newAdminState ? "サイト管理者に設定しました" : "サイト管理者を解除しました");
      loadData();
    } catch {
      showMessage("更新に失敗しました");
    }
  };

  if (isLoading) return <Loading className="min-h-screen" />;
  if (!canManageMembersPage()) return <ErrorDisplay message="権限がありません" />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="flex flex-col min-w-0">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/settings" className="text-gray-400">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
        <h2 className="text-base font-bold text-gray-900">メンバー管理</h2>
      </div>

      {actionMessage && (
        <div className="mx-4 mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
          {actionMessage}
        </div>
      )}

      <div className="space-y-4 p-3 sm:p-4 max-w-2xl w-full mx-auto">
        {/* 参加承認待ち */}
        {pendingMembers.length > 0 && (
          <Card className="border-l-4 border-l-orange-400">
            <CardHeader>
              <CardTitle>承認待ち（{pendingMembers.length}件）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingMembers.map((pending) => (
                  <div
                    key={pending.id}
                    className="rounded-lg border border-gray-100 p-3"
                  >
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {pending.users?.display_name || "不明"}
                        </p>
                        <p className="text-xs text-gray-400">
                          申請日:{" "}
                          {new Date(pending.created_at).toLocaleDateString(
                            "ja-JP"
                          )}
                        </p>
                        {pendingChildren[pending.id]?.map((child, i) => (
                          <p key={i} className="text-xs text-gray-500">
                            選手: {child.name}
                            {child.number != null && ` (#${child.number})`}
                          </p>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="min-h-[44px] sm:min-h-0 flex-1 sm:flex-none"
                          onClick={() => handleApprove(pending.id)}
                        >
                          承認
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-[44px] sm:min-h-0 flex-1 sm:flex-none"
                          onClick={() => handleReject(pending.id)}
                        >
                          拒否
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* メンバー一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>メンバー一覧（{members.length}名）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="rounded-lg border border-gray-100 p-3"
                >
                  {editingId === member.id ? (
                    <MemberEditForm
                      member={member}
                      teamId={teamId!}
                      onClose={() => setEditingId(null)}
                      onSave={() => {
                        setEditingId(null);
                        showMessage("保存しました");
                        loadData();
                      }}
                      onError={(msg) => showMessage(msg)}
                    />
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">
                          {member.users?.display_name || "不明"}
                        </p>
                        <Badge variant="primary">
                          {getRoleLabel(member.permission_group)}
                        </Badge>
                        {member.is_admin && (
                          <Badge variant="secondary">
                            ⚙サイト管理者
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {currentMemberIsAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-[44px] sm:min-h-0"
                            onClick={() => handleToggleAdmin(member)}
                          >
                            {member.is_admin ? "管理者解除" : "管理者設定"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-[44px] sm:min-h-0"
                          onClick={() => setEditingId(member.id)}
                        >
                          編集
                        </Button>
                        {confirmDeleteId === member.id ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="min-h-[44px] sm:min-h-0"
                              onClick={() => handleDeactivate(member.id)}
                            >
                              確認
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="min-h-[44px] sm:min-h-0"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              戻る
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-[44px] sm:min-h-0"
                            onClick={() => setConfirmDeleteId(member.id)}
                          >
                            退会
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MemberEditForm({
  member,
  teamId,
  onClose,
  onSave,
  onError,
}: {
  member: TeamMember;
  teamId: string;
  onClose: () => void;
  onSave: () => void;
  onError: (msg: string) => void;
}) {
  const [permissionGroup, setPermissionGroup] = useState(
    member.permission_group
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMemberRole(member.id, permissionGroup);
      onSave();
    } catch {
      onError("保存に失敗しました");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-900">
        {member.users?.display_name || "不明"}
      </p>
      <Select
        label="役割"
        value={permissionGroup}
        onChange={(e) => setPermissionGroup(e.target.value as typeof permissionGroup)}
      >
        {ROLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 min-h-[44px] sm:min-h-0"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "保存中..." : "保存"}
        </Button>
        <Button size="sm" variant="outline" className="flex-1 min-h-[44px] sm:min-h-0" onClick={onClose}>
          キャンセル
        </Button>
      </div>
    </div>
  );
}
