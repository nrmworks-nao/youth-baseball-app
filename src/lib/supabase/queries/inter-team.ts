import { supabase } from "@/lib/supabase/client";
import type {
  TeamProfile,
  InterTeamMessage,
  MatchRequest,
  MatchRequestDate,
  HeadToHeadRecord,
} from "@/types";

// === チームプロフィール ===

/** 公開チーム検索（分割クエリパターン） */
export async function searchTeams(params?: {
  region?: string;
  league?: string;
  keyword?: string;
  excludeTeamId?: string;
}) {
  // 1. team_profiles から is_public = true のレコードを取得
  const { data: profiles, error: profilesError } = await supabase
    .from("team_profiles")
    .select("*")
    .eq("is_public", true);
  if (profilesError) throw profilesError;
  if (!profiles || profiles.length === 0) return [];

  // 2. team_id リストで teams テーブルから情報を取得
  const teamIds = profiles.map((p) => p.team_id);
  let teamsQuery = supabase
    .from("teams")
    .select("id, name, region, league, logo_url")
    .in("id", teamIds);

  const { data: teams, error: teamsError } = await teamsQuery;
  if (teamsError) throw teamsError;

  // 3. teams を Map 化
  const teamsMap = new Map<string, { id: string; name: string; region?: string; league?: string; logo_url?: string }>();
  for (const t of teams ?? []) {
    teamsMap.set(t.id, t);
  }

  // 4. JavaScript でマージ＆フィルタ
  let results: TeamProfile[] = profiles
    .map((p) => ({
      ...p,
      team: teamsMap.get(p.team_id) ?? undefined,
    }))
    .filter((p) => p.team !== undefined) as TeamProfile[];

  // 自チーム除外
  if (params?.excludeTeamId) {
    results = results.filter((p) => p.team_id !== params.excludeTeamId);
  }

  // キーワード検索: チーム名・紹介文・ホームグラウンドで部分一致
  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    results = results.filter((p) => {
      const name = p.team?.name?.toLowerCase() ?? "";
      const intro = p.introduction?.toLowerCase() ?? "";
      const ground = p.home_ground?.toLowerCase() ?? "";
      return name.includes(kw) || intro.includes(kw) || ground.includes(kw);
    });
  }

  // 地域フィルタ: 前方一致（例: 「栃木県」で「栃木県真岡市」もヒット）
  if (params?.region) {
    results = results.filter((p) => p.team?.region?.startsWith(params.region!) ?? false);
  }

  // リーグフィルタ: 完全一致
  if (params?.league) {
    results = results.filter((p) => p.team?.league === params.league);
  }

  return results;
}

/** チームプロフィール取得（分割クエリパターン） */
export async function getTeamProfile(teamId: string) {
  const { data: profile, error: profileError } = await supabase
    .from("team_profiles")
    .select("*")
    .eq("team_id", teamId)
    .single();
  if (profileError) throw profileError;

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, region, league, logo_url")
    .eq("id", teamId)
    .single();
  if (teamError) throw teamError;

  return { ...profile, team } as TeamProfile;
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
