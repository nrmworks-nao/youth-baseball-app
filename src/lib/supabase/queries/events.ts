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
  is_recurring?: boolean;
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

/** 出欠登録 */
export async function upsertAttendance(data: {
  event_id: string;
  user_id: string;
  player_id?: string;
  status: AttendanceStatus;
  note?: string;
}) {
  const { data: attendance, error } = await supabase
    .from("event_attendances")
    .upsert(data, { onConflict: "event_id,user_id" })
    .select()
    .single();
  if (error) throw error;
  return attendance as EventAttendance;
}

/** イベントの出欠一覧取得 */
export async function getAttendances(eventId: string) {
  const { data, error } = await supabase
    .from("event_attendances")
    .select("*, users(display_name, picture_url), players(name)")
    .eq("event_id", eventId);
  if (error) throw error;
  return data;
}
