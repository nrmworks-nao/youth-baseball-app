import { supabase } from "@/lib/supabase/client";
import type { Event, EventAttendance, AttendanceStatus, EventType } from "@/types";

/** イベント一覧取得 */
export async function getEvents(teamId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("team_id", teamId)
    .order("start_at", { ascending: true });
  if (error) throw error;
  return data as Event[];
}

/** 直近のイベント取得 */
export async function getUpcomingEvents(teamId: string, limit = 3) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("team_id", teamId)
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data as Event[];
}

/** イベント詳細取得 */
export async function getEvent(eventId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (error) throw error;
  return data as Event;
}

/** イベント作成 */
export async function createEvent(data: {
  team_id: string;
  title: string;
  event_type: EventType;
  description?: string;
  location?: string;
  start_at: string;
  end_at: string;
  created_by: string;
}) {
  const { data: event, error } = await supabase
    .from("events")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return event as Event;
}

/** 出欠登録（選手） */
export async function upsertPlayerAttendance(data: {
  event_id: string;
  team_id: string;
  player_id: string;
  status: string;
  note?: string;
  responded_by: string;
  can_drive?: boolean;
  car_capacity?: number;
}) {
  // player_id ベースの upsert
  const { data: existing } = await supabase
    .from("event_attendances")
    .select("id")
    .eq("event_id", data.event_id)
    .eq("player_id", data.player_id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data: attendance, error } = await supabase
      .from("event_attendances")
      .update({
        status: data.status,
        note: data.note,
        responded_by: data.responded_by,
        responded_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return attendance as EventAttendance;
  } else {
    const { data: attendance, error } = await supabase
      .from("event_attendances")
      .insert({
        ...data,
        responded_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return attendance as EventAttendance;
  }
}

/** 出欠登録（保護者自身） */
export async function upsertUserAttendance(data: {
  event_id: string;
  team_id: string;
  user_id: string;
  status: string;
  note?: string;
  can_drive?: boolean;
  car_capacity?: number;
}) {
  const { data: existing } = await supabase
    .from("event_attendances")
    .select("id")
    .eq("event_id", data.event_id)
    .eq("user_id", data.user_id)
    .is("player_id", null)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data: attendance, error } = await supabase
      .from("event_attendances")
      .update({
        status: data.status,
        note: data.note,
        can_drive: data.can_drive,
        car_capacity: data.car_capacity,
        responded_by: data.user_id,
        responded_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return attendance as EventAttendance;
  } else {
    const { data: attendance, error } = await supabase
      .from("event_attendances")
      .insert({
        ...data,
        responded_by: data.user_id,
        responded_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return attendance as EventAttendance;
  }
}

/** イベントの出欠一覧取得（分割クエリ：リレーション構文回避） */
export async function getAttendances(eventId: string) {
  // 1. event_attendances を取得（リレーションなし）
  const { data: attendances, error } = await supabase
    .from("event_attendances")
    .select("*")
    .eq("event_id", eventId);

  if (error) throw error;
  if (!attendances) return [];

  // 2. 関連する players を取得
  const playerIds = [...new Set(attendances.map((a: any) => a.player_id).filter(Boolean))];
  let playersMap: Record<string, { name: string; number: number | null }> = {};
  if (playerIds.length > 0) {
    const { data: players } = await supabase
      .from("players")
      .select("id, name, number")
      .in("id", playerIds);
    if (players) {
      playersMap = Object.fromEntries(players.map((p: any) => [p.id, { name: p.name, number: p.number }]));
    }
  }

  // 3. 関連する users を取得
  const userIds = [...new Set(attendances.map((a: any) => a.user_id).filter(Boolean))];
  let usersMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, display_name, avatar_url")
      .in("id", userIds);
    if (users) {
      usersMap = Object.fromEntries(users.map((u: any) => [u.id, { display_name: u.display_name, avatar_url: u.avatar_url }]));
    }
  }

  // 4. マージ
  return attendances.map((a: any) => ({
    ...a,
    players: a.player_id ? playersMap[a.player_id] || null : null,
    users: a.user_id ? usersMap[a.user_id] || null : null,
  }));
}

/** イベントごとの参加人数（部員・保護者）を一括取得 */
export async function getEventAttendanceCounts(eventIds: string[]) {
  if (eventIds.length === 0) return {};

  const { data, error } = await supabase
    .from("event_attendances")
    .select("event_id, player_id, user_id, status")
    .in("event_id", eventIds)
    .in("status", ["present", "attend"]);

  if (error) throw error;
  if (!data) return {};

  const counts: Record<string, { players: number; parents: number }> = {};
  for (const row of data) {
    if (!counts[row.event_id]) {
      counts[row.event_id] = { players: 0, parents: 0 };
    }
    if (row.player_id) {
      counts[row.event_id].players++;
    } else {
      counts[row.event_id].parents++;
    }
  }
  return counts;
}

/** 自分の子供一覧を取得（リレーション参照を使わない分割クエリ） */
export async function getMyChildren(userId: string, teamId: string) {
  const { data: childRows, error: childError } = await supabase
    .from("user_children")
    .select("*")
    .eq("user_id", userId)
    .eq("team_id", teamId);
  if (childError) throw childError;
  if (!childRows || childRows.length === 0) return [];

  const playerIds = childRows.map((c: any) => c.player_id).filter(Boolean);
  if (playerIds.length === 0) return childRows.map((c: any) => ({ ...c, players: null }));

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id, name, number")
    .in("id", playerIds);
  if (playersError) throw playersError;

  const playersMap: Record<string, any> = {};
  for (const p of players || []) {
    playersMap[p.id] = p;
  }

  return childRows.map((c: any) => ({
    ...c,
    players: c.player_id ? playersMap[c.player_id] || null : null,
  }));
}
