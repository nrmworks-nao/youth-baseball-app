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
    .single();

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
    .single();

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

/** イベントの出欠一覧取得 */
export async function getAttendances(eventId: string) {
  const { data, error } = await supabase
    .from("event_attendances")
    .select("*, users:user_id!event_attendances_user_id_fkey(display_name, avatar_url), players:player_id!event_attendances_player_id_fkey(name, number)")
    .eq("event_id", eventId);
  if (error) throw error;
  return data || [];
}

/** 自分の子供一覧を取得 */
export async function getMyChildren(userId: string, teamId: string) {
  const { data, error } = await supabase
    .from("user_children")
    .select("*, players:player_id!user_children_player_id_fkey(id, name, number)")
    .eq("user_id", userId)
    .eq("team_id", teamId);
  if (error) throw error;
  return data || [];
}
