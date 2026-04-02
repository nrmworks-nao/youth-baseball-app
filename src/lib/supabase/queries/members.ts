import { supabase } from "@/lib/supabase/client";
import type { TeamMember } from "@/types";

/** 同一ユーザーが既にチームメンバーかチェック */
export async function isAlreadyMember(
  teamId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/** 承認待ちメンバー取得 */
export async function getPendingMembers(teamId: string) {
  const { data, error } = await supabase
    .from("team_members")
    .select("*, users(*)")
    .eq("team_id", teamId)
    .eq("is_active", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as TeamMember[];
}

/** メンバー承認 */
export async function approveMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from("team_members")
    .update({ is_active: true })
    .eq("id", memberId);
  if (error) throw error;
}

/** メンバー拒否（関連データ含め削除） */
export async function rejectMember(memberId: string): Promise<void> {
  // まずメンバー情報を取得
  const { data: member, error: fetchError } = await supabase
    .from("team_members")
    .select("*")
    .eq("id", memberId)
    .single();
  if (fetchError) throw fetchError;

  // 関連するuser_childrenを取得
  const { data: children } = await supabase
    .from("user_children")
    .select("player_id")
    .eq("user_id", member.user_id)
    .eq("team_id", member.team_id);

  // 関連するplayersを削除
  if (children && children.length > 0) {
    const playerIds = children.map((c: { player_id: string }) => c.player_id);
    await supabase.from("user_children").delete().in("player_id", playerIds);
    await supabase.from("players").delete().in("id", playerIds);
  }

  // team_memberを削除
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", memberId);
  if (error) throw error;
}

/** アクティブメンバー一覧取得 */
export async function getTeamMembers(teamId: string) {
  const { data, error } = await supabase
    .from("team_members")
    .select("*, users(*)")
    .eq("team_id", teamId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as TeamMember[];
}

/** メンバー役割更新 */
export async function updateMemberRole(
  memberId: string,
  permissionGroup: string
): Promise<void> {
  const { error } = await supabase
    .from("team_members")
    .update({
      permission_group: permissionGroup,
    })
    .eq("id", memberId);
  if (error) throw error;
}

/** メンバーのサイト管理者フラグ更新 */
export async function updateMemberAdmin(
  memberId: string,
  isAdmin: boolean
): Promise<void> {
  const { error } = await supabase
    .from("team_members")
    .update({ is_admin: isAdmin })
    .eq("id", memberId);
  if (error) throw error;
}

/** メンバー退会（論理削除） */
export async function deactivateMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from("team_members")
    .update({ is_active: false })
    .eq("id", memberId);
  if (error) throw error;
}

/** サイト管理者の数をカウント */
export async function countAdmins(teamId: string): Promise<number> {
  const { count, error } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("is_admin", true)
    .eq("is_active", true);
  if (error) throw error;
  return count ?? 0;
}

/** parent以外のアクティブメンバー取得（スタッフ用） */
export async function getStaffMembers(teamId: string) {
  const { data, error } = await supabase
    .from("team_members")
    .select("id, team_id, user_id, permission_group, is_admin, is_active, experience, motivation, created_at")
    .eq("team_id", teamId)
    .eq("is_active", true)
    .neq("permission_group", "parent")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as TeamMember[];
}

/** スタッフプロフィール更新 */
export async function updateStaffProfile(
  memberId: string,
  updates: { experience?: string; motivation?: string }
): Promise<void> {
  const { error } = await supabase
    .from("team_members")
    .update(updates)
    .eq("id", memberId);
  if (error) throw error;
}

/** メンバーの子供情報取得 */
export async function getMemberChildren(userId: string, teamId: string) {
  const { data, error } = await supabase
    .from("user_children")
    .select("*, players(*)")
    .eq("user_id", userId)
    .eq("team_id", teamId);
  if (error) throw error;
  return data;
}
