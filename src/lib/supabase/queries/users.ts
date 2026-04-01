import { supabase } from "@/lib/supabase/client";
import type {
  User,
  TeamWithRole,
  ChildWithTeam,
  NotificationSettings,
} from "@/types";

/** ユーザープロフィール取得 */
export async function getProfile(userId: string): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as User;
}

/** プロフィール更新（API経由） */
export async function updateProfile(
  userId: string,
  data: {
    display_name?: string;
    phone?: string;
    avatar_url?: string;
  }
): Promise<void> {
  const res = await fetch("/api/users/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...data }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "プロフィール更新に失敗しました");
  }
}

/** ユーザーの所属チーム一覧（ロール情報付き） */
export async function getMyTeamsWithRole(
  userId: string
): Promise<TeamWithRole[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select("id, permission_group, is_admin, teams(*)")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (error) throw error;
  return (data || []).map((row: Record<string, unknown>) => ({
    team: row.teams,
    permission_group: row.permission_group,
    is_admin: row.is_admin ?? false,
    member_id: row.id,
  })) as TeamWithRole[];
}

/** 自分の子供一覧取得（全チーム横断） */
export async function getMyAllChildren(
  userId: string
): Promise<ChildWithTeam[]> {
  const { data, error } = await supabase
    .from("user_children")
    .select("id, relationship, player_id, team_id, players(*), teams:team_id(name)")
    .eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((row: Record<string, unknown>) => ({
    player: row.players,
    team_name: (row.teams as Record<string, unknown>)?.name || "",
    team_id: row.team_id,
    relationship: row.relationship,
    user_child_id: row.id,
  })) as ChildWithTeam[];
}

/** 通知設定更新（API経由） */
export async function updateNotificationSettings(
  userId: string,
  settings: NotificationSettings
): Promise<void> {
  const res = await fetch("/api/users/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, notification_settings: settings }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "通知設定の更新に失敗しました");
  }
}

/** 子供追加（API経由） */
export async function addChild(
  userId: string,
  teamId: string,
  player: {
    name: string;
    number?: number;
    grade?: number;
    position?: string;
    throwing_hand?: string;
    batting_hand?: string;
  },
  relationship: string
): Promise<void> {
  const res = await fetch("/api/users/children", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, teamId, player, relationship }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "子供の追加に失敗しました");
  }
}

/** 子供情報更新（API経由） */
export async function updateChild(
  userId: string,
  playerId: string,
  data: {
    name?: string;
    number?: number;
    grade?: number;
    position?: string;
    throwing_hand?: string;
    batting_hand?: string;
  }
): Promise<void> {
  const res = await fetch("/api/users/children", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, playerId, data }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "選手情報の更新に失敗しました");
  }
}
