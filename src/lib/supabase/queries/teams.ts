import { supabase } from "@/lib/supabase/client";
import type { Team, TeamMember, PermissionGroup } from "@/types";

/** チーム作成 */
export async function createTeam(data: {
  name: string;
  region?: string;
  league?: string;
}) {
  const { data: team, error } = await supabase
    .from("teams")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return team as Team;
}

/** チームメンバー追加 */
export async function addTeamMember(data: {
  team_id: string;
  user_id: string;
  permission_group: PermissionGroup;
  is_admin?: boolean;
  is_active?: boolean;
}) {
  const { data: member, error } = await supabase
    .from("team_members")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return member as TeamMember;
}

/** 自分の所属チーム一覧 */
export async function getMyTeams(userId: string) {
  const { data, error } = await supabase
    .from("team_members")
    .select("*, teams(*)")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (error) throw error;
  return data;
}

/** 自分のチーム内権限を取得 */
export async function getMyTeamMember(teamId: string, userId: string) {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data as TeamMember;
}

/** 招待コードでチーム情報取得（有効期限チェック付き） */
export async function getTeamByInviteCode(code: string) {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("invite_code", code)
    .single();
  if (error) throw error;
  if (!data) return null;
  // 有効期限チェック
  if (data.invite_expires_at && new Date(data.invite_expires_at) < new Date()) {
    return null;
  }
  return data as Team;
}

/** 招待コード生成・更新 */
export async function generateInviteCode(teamId: string): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await supabase
    .from("teams")
    .update({
      invite_code: code,
      invite_expires_at: expiresAt.toISOString(),
    })
    .eq("id", teamId);
  if (error) throw error;
  return code;
}

/** 参加承認設定の更新 */
export async function updateRequireApproval(
  teamId: string,
  value: boolean
): Promise<void> {
  const { error } = await supabase
    .from("teams")
    .update({ require_approval: value })
    .eq("id", teamId);
  if (error) throw error;
}

/** チーム情報取得 */
export async function getTeam(teamId: string) {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();
  if (error) throw error;
  return data as Team;
}

/** チーム情報更新 */
export async function updateTeam(
  teamId: string,
  data: { name?: string; region?: string; league?: string }
) {
  const { error } = await supabase.from("teams").update(data).eq("id", teamId);
  if (error) throw error;
}
