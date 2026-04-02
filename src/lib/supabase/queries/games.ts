import { supabase } from "@/lib/supabase/client";
import type {
  Game,
  GameLineup,
  InningScore,
  PlayerGameStats,
  ScorebookImage,
} from "@/types";

/** 試合一覧取得 */
export async function getGames(teamId: string) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("team_id", teamId)
    .order("game_date", { ascending: false });
  if (error) throw error;
  return data as Game[];
}

/** 試合詳細取得 */
export async function getGame(gameId: string) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();
  if (error) throw error;
  return data as Game;
}

/** 試合作成 */
export async function createGame(data: {
  team_id: string;
  opponent_name: string;
  game_date: string;
  venue?: string;
  game_type: string;
  result?: string;
  score_team?: number;
  score_opponent?: number;
  inning_scores?: InningScore[];
  notes?: string;
  created_by: string;
}) {
  const { data: game, error } = await supabase
    .from("games")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return game as Game;
}

/** 試合更新 */
export async function updateGame(
  gameId: string,
  data: Partial<{
    opponent_name: string;
    game_date: string;
    venue: string;
    game_type: string;
    result: string;
    score_team: number;
    score_opponent: number;
    inning_scores: InningScore[];
    notes: string;
  }>
) {
  const { data: game, error } = await supabase
    .from("games")
    .update(data)
    .eq("id", gameId)
    .select()
    .single();
  if (error) throw error;
  return game as Game;
}

/** スタメン・打順取得 */
export async function getGameLineups(gameId: string) {
  const { data, error } = await supabase
    .from("game_lineups")
    .select("*, players!player_id(id, name, number, position)")
    .eq("game_id", gameId)
    .order("batting_order", { ascending: true });
  if (error) throw error;
  return data as GameLineup[];
}

/** スタメン登録 */
export async function upsertGameLineup(data: {
  game_id: string;
  team_id: string;
  player_id: string;
  batting_order?: number;
  position?: string;
  is_starter?: boolean;
}) {
  const { error } = await supabase
    .from("game_lineups")
    .upsert(data, { onConflict: "game_id,player_id" });
  if (error) throw error;
}

/** 選手成績取得（試合単位） */
export async function getGameStats(gameId: string) {
  const { data, error } = await supabase
    .from("player_game_stats")
    .select("*, players!player_id(id, name, number, position)")
    .eq("game_id", gameId);
  if (error) throw error;
  return data as PlayerGameStats[];
}

/** 選手成績登録・更新 */
export async function upsertPlayerGameStats(data: {
  game_id: string;
  team_id: string;
  player_id: string;
  at_bats?: number;
  hits?: number;
  doubles?: number;
  triples?: number;
  home_runs?: number;
  rbis?: number;
  walks?: number;
  strikeouts?: number;
  stolen_bases?: number;
  sacrifice_hits?: number;
  putouts?: number;
  assists?: number;
  errors?: number;
  innings_pitched?: number;
  pitches_thrown?: number;
  earned_runs?: number;
  hits_allowed?: number;
  walks_allowed?: number;
  strikeouts_pitched?: number;
  is_winning_pitcher?: boolean;
  is_losing_pitcher?: boolean;
}) {
  const { error } = await supabase
    .from("player_game_stats")
    .upsert(data, { onConflict: "game_id,player_id" });
  if (error) throw error;
}

/** スコアブック画像一覧取得 */
export async function getScorebookImages(gameId: string) {
  const { data, error } = await supabase
    .from("game_scorebook_images")
    .select("*")
    .eq("game_id", gameId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as ScorebookImage[];
}

/** スコアブック画像削除 */
export async function deleteScorebookImage(imageId: string) {
  const { error } = await supabase
    .from("game_scorebook_images")
    .delete()
    .eq("id", imageId);
  if (error) throw error;
}
