import { supabase } from "@/lib/supabase/client";
import type {
  TeamProfile,
  InterTeamMessage,
  MatchRequest,
  MatchRequestDate,
  HeadToHeadRecord,
} from "@/types";

// === チームプロフィール ===

/** 公開チーム検索 */
export async function searchTeams(params?: { region?: string; league?: string; keyword?: string }) {
  let query = supabase
    .from("team_profiles")
    .select("*, teams(id, name, region, league)")
    .eq("is_public", true);

  if (params?.region) {
    query = query.eq("teams.region", params.region);
  }
  if (params?.league) {
    query = query.eq("teams.league", params.league);
  }
  if (params?.keyword) {
    query = query.or(`introduction.ilike.%${params.keyword}%,home_ground.ilike.%${params.keyword}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as TeamProfile[];
}

/** チームプロフィール取得 */
export async function getTeamProfile(teamId: string) {
  const { data, error } = await supabase
    .from("team_profiles")
    .select("*, teams(id, name, region, league)")
    .eq("team_id", teamId)
    .single();
  if (error) throw error;
  return data as TeamProfile;
}

/** チームプロフィール作成/更新 */
export async function upsertTeamProfile(data: {
  team_id: string;
  introduction?: string;
  home_ground?: string;
  practice_schedule?: string;
  member_count?: number;
  founded_year?: number;
  contact_email?: string;
  website_url?: string;
  is_public?: boolean;
}) {
  const { data: profile, error } = await supabase
    .from("team_profiles")
    .upsert(data, { onConflict: "team_id" })
    .select()
    .single();
  if (error) throw error;
  return profile as TeamProfile;
}

// === チーム間メッセージ ===

/** メッセージ一覧取得（自チーム関連） */
export async function getInterTeamMessages(teamId: string) {
  const { data, error } = await supabase
    .from("inter_team_messages")
    .select("*, from_team:teams!inter_team_messages_from_team_id_fkey(name), to_team:teams!inter_team_messages_to_team_id_fkey(name), users!inter_team_messages_sender_id_fkey(display_name)")
    .or(`from_team_id.eq.${teamId},to_team_id.eq.${teamId}`)
    .is("parent_message_id", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as InterTeamMessage[];
}

/** メッセージスレッド取得 */
export async function getMessageThread(parentMessageId: string) {
  const { data, error } = await supabase
    .from("inter_team_messages")
    .select("*, users!inter_team_messages_sender_id_fkey(display_name)")
    .or(`id.eq.${parentMessageId},parent_message_id.eq.${parentMessageId}`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as InterTeamMessage[];
}

/** メッセージ送信 */
export async function sendInterTeamMessage(data: {
  from_team_id: string;
  to_team_id: string;
  sender_id: string;
  subject: string;
  body: string;
  parent_message_id?: string;
}) {
  const { data: message, error } = await supabase
    .from("inter_team_messages")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return message as InterTeamMessage;
}

/** メッセージ既読にする */
export async function markMessageAsRead(messageId: string) {
  const { error } = await supabase
    .from("inter_team_messages")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", messageId);
  if (error) throw error;
}

// === 練習試合 ===

/** 練習試合申込一覧 */
export async function getMatchRequests(teamId: string) {
  const { data, error } = await supabase
    .from("match_requests")
    .select(
      "*, from_team:teams!match_requests_from_team_id_fkey(name), to_team:teams!match_requests_to_team_id_fkey(name), match_request_dates(*)"
    )
    .or(`from_team_id.eq.${teamId},to_team_id.eq.${teamId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as MatchRequest[];
}

/** 練習試合申込作成 */
export async function createMatchRequest(data: {
  from_team_id: string;
  to_team_id: string;
  requested_by: string;
  message?: string;
  preferred_venue?: string;
  dates: { proposed_date: string; start_time?: string; end_time?: string }[];
}) {
  const { dates, ...requestData } = data;
  const { data: request, error } = await supabase
    .from("match_requests")
    .insert(requestData)
    .select()
    .single();
  if (error) throw error;

  if (dates.length > 0) {
    const datesData = dates.map((d) => ({
      ...d,
      match_request_id: request.id,
    }));
    const { error: datesError } = await supabase
      .from("match_request_dates")
      .insert(datesData);
    if (datesError) throw datesError;
  }

  return request as MatchRequest;
}

/** 練習試合ステータス更新 */
export async function updateMatchRequestStatus(
  requestId: string,
  status: string,
  respondedBy: string,
  selectedDateId?: string
) {
  const { error } = await supabase
    .from("match_requests")
    .update({
      status,
      responded_by: respondedBy,
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId);
  if (error) throw error;

  if (selectedDateId) {
    const { error: dateError } = await supabase
      .from("match_request_dates")
      .update({ is_selected: true })
      .eq("id", selectedDateId);
    if (dateError) throw dateError;
  }
}

// === 対戦成績 ===

/** 対戦成績一覧 */
export async function getHeadToHeadRecords(teamId: string) {
  const { data, error } = await supabase
    .from("head_to_head_records")
    .select("*")
    .eq("team_id", teamId)
    .order("game_date", { ascending: false });
  if (error) throw error;
  return data as HeadToHeadRecord[];
}

/** 対戦成績作成 */
export async function createHeadToHeadRecord(data: {
  team_id: string;
  opponent_team_id?: string;
  opponent_name: string;
  game_id?: string;
  game_date: string;
  result: string;
  score_team?: number;
  score_opponent?: number;
  notes?: string;
}) {
  const { data: record, error } = await supabase
    .from("head_to_head_records")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return record as HeadToHeadRecord;
}
