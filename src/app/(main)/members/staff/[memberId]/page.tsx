"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { getRoleLabel } from "@/lib/utils/roles";
import { updateStaffProfile } from "@/lib/supabase/queries/members";
import { supabase } from "@/lib/supabase/client";
import type { TeamMember, User } from "@/types";

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.memberId as string;

  const [member, setMember] = useState<TeamMember | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 編集モード
  const [isEditing, setIsEditing] = useState(false);
  const [editExperience, setEditExperience] = useState("");
  const [editMotivation, setEditMotivation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 現在のユーザーを取得
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setCurrentUserId(authUser?.id ?? null);

      // team_membersからメンバー情報取得
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .select("id, team_id, user_id, permission_group, is_admin, is_active, experience, motivation, created_at")
        .eq("id", memberId)
        .single();
      if (memberError) throw memberError;
      setMember(memberData as TeamMember);

      // usersからユーザー情報取得
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, display_name, avatar_url, email, phone, created_at")
        .eq("id", memberData.user_id)
        .single();
      if (userError) throw userError;
      setUser(userData as User);
    } catch {
      setError("データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isOwner = currentUserId !== null && member?.user_id === currentUserId;

  const handleEditStart = () => {
    setEditExperience(member?.experience || "");
    setEditMotivation(member?.motivation || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!member) return;
    setIsSaving(true);
    try {
      await updateStaffProfile(member.id, {
        experience: editExperience,
        motivation: editMotivation,
      });
      setMember({
        ...member,
        experience: editExperience,
        motivation: editMotivation,
      });
      setIsEditing(false);
    } catch {
      alert("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading className="min-h-screen" />;
  if (error || !member || !user) return <ErrorDisplay message={error || "データが見つかりません"} onRetry={loadData} />;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-base font-bold text-gray-900">スタッフ詳細</h2>
      </div>

      {/* プロフィール */}
      <div className="bg-white p-6">
        <div className="flex flex-col items-center">
          {/* プロフィール写真 */}
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-blue-200 bg-gray-200 shadow-lg">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-gray-400">
                {user.display_name.charAt(0)}
              </div>
            )}
          </div>

          {/* 名前 */}
          <h3 className="mt-4 text-xl font-bold text-gray-900">{user.display_name}</h3>

          {/* バッジ */}
          <div className="mt-2 flex items-center gap-2 flex-wrap justify-center">
            <Badge variant="secondary" className="text-sm">
              {getRoleLabel(member.permission_group)}
            </Badge>
            {member.is_admin && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                ⚙サイト管理者
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 詳細情報 */}
      <div className="space-y-4 p-4">
        {/* 経験 */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-gray-700">経験</h4>
            {isOwner && !isEditing && (
              <button
                onClick={handleEditStart}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <Pencil className="h-3 w-3" />
                編集
              </button>
            )}
          </div>
          {isEditing ? (
            <Textarea
              value={editExperience}
              onChange={(e) => setEditExperience(e.target.value)}
              placeholder="経験を入力..."
              className="text-sm"
            />
          ) : (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {member.experience || "未入力"}
            </p>
          )}
        </div>

        {/* 意気込み */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-gray-700">意気込み</h4>
            {isOwner && !isEditing && (
              <button
                onClick={handleEditStart}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <Pencil className="h-3 w-3" />
                編集
              </button>
            )}
          </div>
          {isEditing ? (
            <Textarea
              value={editMotivation}
              onChange={(e) => setEditMotivation(e.target.value)}
              placeholder="意気込みを入力..."
              className="text-sm"
            />
          ) : (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {member.motivation || "未入力"}
            </p>
          )}
        </div>

        {/* 編集モード時の保存・キャンセルボタン */}
        {isEditing && (
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? "保存中..." : "保存"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
