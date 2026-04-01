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
import {
  getPendingMembers,
  approveMember,
  rejectMember,
  getTeamMembers,
  updateMemberRole,
  deactivateMember,
  countTeamAdmins,
  getMemberChildren,
} from "@/lib/supabase/queries/members";
import type { TeamMember } from "@/types";
import { getRoleLabel } from "@/lib/utils/roles";

const EDITABLE_PERMISSIONS = [
  "team_admin",
  "director",
  "president",
  "vice_president",
  "captain",
  "coach",
  "treasurer",
  "manager",
  "publicity",
  "parent",
];

export default function MembersPage() {
  const [teamId, setTeamId] = useState<string | null>(null);
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

      const { data: memberData } = await supabase
        .from("team_members")
        .select("team_id")
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

  if (isLoading) return <Loading className="min-h-screen" />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="flex flex-col">
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

      <div className="space-y-4 p-4">
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
                    <div className="flex items-start justify-between">
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
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(pending.id)}
                        >
                          承認
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
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
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {member.users?.display_name || "不明"}
                          </p>
                          <Badge variant="primary">
                            {getRoleLabel(member.permission_group)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(member.id)}
                        >
                          編集
                        </Button>
                        {confirmDeleteId === member.id ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeactivate(member.id)}
                            >
                              確認
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              戻る
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
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
    // team_admin最低1人チェック
    if (
      member.permission_group === "team_admin" &&
      permissionGroup !== "team_admin"
    ) {
      const count = await countTeamAdmins(teamId);
      if (count <= 1) {
        onError("チーム管理者は最低1名必要です");
        return;
      }
    }

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
        label="権限グループ"
        value={permissionGroup}
        onChange={(e) => setPermissionGroup(e.target.value as typeof permissionGroup)}
      >
        {EDITABLE_PERMISSIONS.map((key) => (
          <option key={key} value={key}>
            {getRoleLabel(key)}
          </option>
        ))}
      </Select>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "保存中..." : "保存"}
        </Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={onClose}>
          キャンセル
        </Button>
      </div>
    </div>
  );
}
