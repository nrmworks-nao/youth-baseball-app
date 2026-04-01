import { supabase } from "@/lib/supabase/client";
import type {
  Player,
  PlayerGameStats,
  PlayerMeasurement,
  PlayerFitnessRecord,
  ParentPlayerRelation,
} from "@/types";

/** アクティブな選手一覧取得 */
export async function getPlayers(teamId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", teamId)
    .eq("is_active", true)
    .order("number", { ascending: true });
  if (error) throw error;
  return data as Player[];
}

/** 選手詳細取得 */
export async function getPlayer(playerId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();
  if (error) throw error;
  return data as Player;
}

/** 選手の全試合成績取得 */
export async function getPlayerAllStats(playerId: string) {
  const { data, error } = await supabase
    .from("player_game_stats")
    .select("*, games!game_id(game_date, opponent_name, game_type)")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as (PlayerGameStats & {
    games: { game_date: string; opponent_name: string; game_type: string };
  })[];
}

/** 身体測定一覧取得 */
export async function getPlayerMeasurements(playerId: string) {
  const { data, error } = await supabase
    .from("player_measurements")
    .select("*")
    .eq("player_id", playerId)
    .order("measured_at", { ascending: true });
  if (error) throw error;
  return data as PlayerMeasurement[];
}

/** 身体測定登録 */
export async function createPlayerMeasurement(data: {
  team_id: string;
  player_id: string;
  measured_at: string;
  height_cm?: number;
  weight_kg?: number;
  notes?: string;
  recorded_by: string;
}) {
  const { data: measurement, error } = await supabase
    .from("player_measurements")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return measurement as PlayerMeasurement;
}

/** 体力測定一覧取得 */
export async function getPlayerFitnessRecords(playerId: string) {
  const { data, error } = await supabase
    .from("player_fitness_records")
    .select("*")
    .eq("player_id", playerId)
    .order("measured_at", { ascending: true });
  if (error) throw error;
  return data as PlayerFitnessRecord[];
}

/** 体力測定登録 */
export async function createPlayerFitnessRecord(data: {
  team_id: string;
  player_id: string;
  measured_at: string;
  sprint_50m?: number;
  throw_distance?: number;
  standing_jump?: number;
  sit_ups?: number;
  shuttle_run?: number;
  flexibility?: number;
  grip_strength?: number;
  notes?: string;
  recorded_by: string;
}) {
  const { data: record, error } = await supabase
    .from("player_fitness_records")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return record as PlayerFitnessRecord;
}

/** チーム全選手の全試合成績取得（ランキング用） */
export async function getTeamAllPlayerStats(teamId: string) {
  const { data, error } = await supabase
    .from("player_game_stats")
    .select("*, players!player_id(id, name, number:uniform_number, card_photo_url)")
    .eq("team_id", teamId);
  if (error) throw error;
  return data as (PlayerGameStats & {
    players: { id: string; name: string; number: number; card_photo_url?: string };
  })[];
}

/** チーム全選手の体力測定取得（ランキング用） */
export async function getTeamFitnessRecords(teamId: string) {
  const { data, error } = await supabase
    .from("player_fitness_records")
    .select("*, players!player_id(id, name, number:uniform_number, card_photo_url)")
    .eq("team_id", teamId)
    .order("measured_at", { ascending: false });
  if (error) throw error;
  return data as (PlayerFitnessRecord & {
    players: { id: string; name: string; number: number; card_photo_url?: string };
  })[];
}

/** 選手登録 */
export async function registerPlayer(data: {
  team_id: string;
  name: string;
  number?: number;
  grade?: number;
  position?: string;
  throwing_hand?: string;
  batting_hand?: string;
}) {
  const { data: player, error } = await supabase
    .from("players")
    .insert({ ...data, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return player as Player;
}

/** 選手情報更新 */
export async function updatePlayer(
  playerId: string,
  data: Partial<
    Pick<
      Player,
      "name" | "number" | "grade" | "position" | "throwing_hand" | "batting_hand" | "card_photo_url"
    >
  >
) {
  const { error } = await supabase
    .from("players")
    .update(data)
    .eq("id", playerId);
  if (error) throw error;
}

/** 保護者-選手紐づけ */
export async function linkParentToPlayer(
  userId: string,
  playerId: string,
  teamId: string,
  relationship?: string
) {
  const { error } = await supabase.from("user_children").insert({
    user_id: userId,
    player_id: playerId,
    team_id: teamId,
    relationship,
  });
  if (error) throw error;
}

/** 選手の保護者情報取得 */
export async function getPlayerParents(playerId: string) {
  const { data, error } = await supabase
    .from("user_children")
    .select("*, users(*)")
    .eq("player_id", playerId);
  if (error) throw error;
  return data as ParentPlayerRelation[];
}

/** 自分の子供一覧取得 */
export async function getMyChildren(userId: string, teamId: string) {
  const { data, error } = await supabase
    .from("user_children")
    .select("*, players(*)")
    .eq("user_id", userId)
    .eq("team_id", teamId);
  if (error) throw error;
  return data as ParentPlayerRelation[];
}

/** 背番号重複チェック */
export async function checkDuplicateNumber(
  teamId: string,
  number: number,
  excludePlayerId?: string
): Promise<boolean> {
  let query = supabase
    .from("players")
    .select("id")
    .eq("team_id", teamId)
    .eq("number", number)
    .eq("is_active", true);
  if (excludePlayerId) {
    query = query.neq("id", excludePlayerId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
