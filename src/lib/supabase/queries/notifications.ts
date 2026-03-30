import { supabase } from "@/lib/supabase/client";
import type { AppNotification, TeamLineConfig } from "@/types";

// === 通知 ===

/** 通知一覧取得 */
export async function getNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as AppNotification[];
}

/** 未読通知数取得 */
export async function getUnreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
  return count ?? 0;
}

/** 通知を既読にする */
export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId);
  if (error) throw error;
}

/** 全通知を既読にする */
export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}

/** 通知作成 */
export async function createNotification(data: {
  team_id?: string;
  user_id: string;
  title: string;
  body?: string;
  notification_type: string;
  reference_type?: string;
  reference_id?: string;
}) {
  const { data: notification, error } = await supabase
    .from("notifications")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return notification as AppNotification;
}

// === LINE連携設定 ===

/** LINE設定取得 */
export async function getTeamLineConfig(teamId: string) {
  const { data, error } = await supabase
    .from("team_line_config")
    .select("*")
    .eq("team_id", teamId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data as TeamLineConfig | null;
}

/** LINE設定作成/更新 */
export async function upsertTeamLineConfig(data: {
  team_id: string;
  line_channel_id?: string;
  line_channel_secret?: string;
  line_channel_access_token?: string;
  line_group_id?: string;
  liff_id?: string;
  is_active?: boolean;
}) {
  const { data: config, error } = await supabase
    .from("team_line_config")
    .upsert(data, { onConflict: "team_id" })
    .select()
    .single();
  if (error) throw error;
  return config as TeamLineConfig;
}
