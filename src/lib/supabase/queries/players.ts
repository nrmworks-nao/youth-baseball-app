import { supabase } from "@/lib/supabase/client";
import type {
  Player,
  PlayerGameStats,
  PlayerMeasurement,
  PlayerFitnessRecord,
} from "@/types";

/** 選手一覧取得 */
export async function getPlayers(teamId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", teamId)
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
    .select("*, players!player_id(id, name, number)")
    .eq("team_id", teamId);
  if (error) throw error;
  return data as (PlayerGameStats & {
    players: { id: string; name: string; number: number };
  })[];
}

/** チーム全選手の体力測定取得（ランキング用） */
export async function getTeamFitnessRecords(teamId: string) {
  const { data, error } = await supabase
    .from("player_fitness_records")
    .select("*, players!player_id(id, name, number)")
    .eq("team_id", teamId)
    .order("measured_at", { ascending: false });
  if (error) throw error;
  return data as (PlayerFitnessRecord & {
    players: { id: string; name: string; number: number };
  })[];
}
