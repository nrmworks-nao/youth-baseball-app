import { supabase } from "@/lib/supabase/client";
import type {
  PlayerCard,
  KidsBadge,
  PlayerBadge,
  Award,
  Milestone,
  MilestoneComment,
  MonthlyReview,
  PlayerGoal,
  GoalComment,
  BestPlay,
  TeamChallenge,
} from "@/types";

// === 選手カード ===

export async function getPlayerCard(playerId: string) {
  const { data, error } = await supabase
    .from("player_cards")
    .select("*, players!player_id(*)")
    .eq("player_id", playerId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data as PlayerCard | null;
}

export async function getAllPlayerCards(teamId: string) {
  const { data, error } = await supabase
    .from("player_cards")
    .select("*, players!player_id(*)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as PlayerCard[];
}

// === バッジ ===

export async function getBadges(teamId: string) {
  const { data, error } = await supabase
    .from("kids_badges")
    .select("*")
    .or(`team_id.eq.${teamId},is_preset.eq.true`)
    .order("category", { ascending: true });
  if (error) throw error;
  return data as KidsBadge[];
}

export async function getPlayerBadges(playerId: string) {
  const { data, error } = await supabase
    .from("player_badges")
    .select("*, kids_badges!badge_id(*)")
    .eq("player_id", playerId)
    .order("earned_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as (PlayerBadge & { kids_badges: KidsBadge })[]).map(
    (d) => ({ ...d, badge: d.kids_badges })
  );
}

export async function createCustomBadge(data: {
  team_id: string;
  name: string;
  description: string;
  category: string;
  icon_color: string;
}) {
  const { data: badge, error } = await supabase
    .from("kids_badges")
    .insert({ ...data, is_preset: false })
    .select()
    .single();
  if (error) throw error;
  return badge as KidsBadge;
}

// === 表彰 ===

export async function getAwards(teamId: string) {
  const { data, error } = await supabase
    .from("awards")
    .select("*, players!player_id(id, name, number)")
    .eq("team_id", teamId)
    .order("awarded_at", { ascending: false });
  if (error) throw error;
  return data as Award[];
}

export async function createAward(data: {
  team_id: string;
  player_id: string;
  category: string;
  comment?: string;
  awarded_at: string;
  created_by: string;
}) {
  const { data: award, error } = await supabase
    .from("awards")
    .insert(data)
    .select("*, players!player_id(id, name, number)")
    .single();
  if (error) throw error;
  return award as Award;
}

// === マイルストーン ===

export async function getMilestones(playerId: string) {
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("player_id", playerId)
    .order("milestone_date", { ascending: false });
  if (error) throw error;
  return data as Milestone[];
}

export async function createMilestone(data: {
  player_id: string;
  team_id: string;
  milestone_type: string;
  title: string;
  description?: string;
  milestone_date: string;
  is_auto: boolean;
}) {
  const { data: milestone, error } = await supabase
    .from("milestones")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return milestone as Milestone;
}

export async function getMilestoneComments(milestoneId: string) {
  const { data, error } = await supabase
    .from("milestone_comments")
    .select("*, users!user_id(display_name, picture_url)")
    .eq("milestone_id", milestoneId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as MilestoneComment[];
}

export async function addMilestoneComment(data: {
  milestone_id: string;
  user_id: string;
  body: string;
}) {
  const { data: comment, error } = await supabase
    .from("milestone_comments")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return comment as MilestoneComment;
}

// === 月間ふりかえり ===

export async function getMonthlyReviews(playerId: string) {
  const { data, error } = await supabase
    .from("monthly_reviews")
    .select("*")
    .eq("player_id", playerId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  if (error) throw error;
  return data as MonthlyReview[];
}

export async function getMonthlyReview(
  playerId: string,
  year: number,
  month: number
) {
  const { data, error } = await supabase
    .from("monthly_reviews")
    .select("*")
    .eq("player_id", playerId)
    .eq("year", year)
    .eq("month", month)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data as MonthlyReview | null;
}

// === マイ目標 ===

export async function getPlayerGoals(playerId: string) {
  const { data, error } = await supabase
    .from("player_goals")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as PlayerGoal[];
}

export async function createPlayerGoal(data: {
  player_id: string;
  team_id: string;
  title: string;
  target_metric?: string;
  target_value: number;
  current_value?: number;
  deadline?: string;
}) {
  const { data: goal, error } = await supabase
    .from("player_goals")
    .insert({ ...data, status: "active", current_value: data.current_value ?? 0 })
    .select()
    .single();
  if (error) throw error;
  return goal as PlayerGoal;
}

export async function updatePlayerGoal(
  goalId: string,
  updates: Partial<PlayerGoal>
) {
  const { data, error } = await supabase
    .from("player_goals")
    .update(updates)
    .eq("id", goalId)
    .select()
    .single();
  if (error) throw error;
  return data as PlayerGoal;
}

export async function getGoalComments(goalId: string) {
  const { data, error } = await supabase
    .from("goal_comments")
    .select("*, users!user_id(display_name, picture_url)")
    .eq("goal_id", goalId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as GoalComment[];
}

// === チームチャレンジ ===

export async function getTeamChallenges(teamId: string) {
  const { data, error } = await supabase
    .from("team_challenges")
    .select("*")
    .eq("team_id", teamId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data as TeamChallenge[];
}

export async function createTeamChallenge(data: {
  team_id: string;
  title: string;
  description?: string;
  target_value: number;
  start_date: string;
  end_date: string;
}) {
  const { data: challenge, error } = await supabase
    .from("team_challenges")
    .insert({ ...data, current_value: 0 })
    .select()
    .single();
  if (error) throw error;
  return challenge as TeamChallenge;
}

export async function updateTeamChallenge(
  challengeId: string,
  updates: Partial<TeamChallenge>
) {
  const { data, error } = await supabase
    .from("team_challenges")
    .update(updates)
    .eq("id", challengeId)
    .select()
    .single();
  if (error) throw error;
  return data as TeamChallenge;
}

// === ベストプレー ===

export async function getBestPlays(teamId: string) {
  const { data, error } = await supabase
    .from("best_plays")
    .select("*, players!player_id(id, name, number), games!game_id(game_date, opponent_name)")
    .eq("team_id", teamId)
    .order("play_date", { ascending: false });
  if (error) throw error;
  return data as BestPlay[];
}

export async function createBestPlay(data: {
  team_id: string;
  game_id?: string;
  player_id: string;
  title: string;
  description?: string;
  photo_url?: string;
  is_auto: boolean;
  play_date: string;
  created_by?: string;
}) {
  const { data: play, error } = await supabase
    .from("best_plays")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return play as BestPlay;
}
