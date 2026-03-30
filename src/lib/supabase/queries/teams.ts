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
  display_title: string;
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
    .eq("user_id", userId);
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

/** 招待コードでチーム情報取得 */
export async function getTeamByInviteCode(code: string) {
  const { data, error } = await supabase
    .from("invitations")
    .select("*, teams(*)")
    .eq("code", code)
    .gte("expires_at", new Date().toISOString())
    .single();
  if (error) throw error;
  return data;
}
