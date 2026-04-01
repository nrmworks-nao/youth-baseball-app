import { supabase } from "@/lib/supabase/client";
import type {
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

// === バッジ ===

export async function getBadges(teamId: string) {
  const { data, error } = await supabase
    .from("badge_definitions")
    .select("*")
    .or(`team_id.eq.${teamId},is_preset.eq.true`)
    .order("category", { ascending: true });
  if (error) throw error;
  return data as KidsBadge[];
}

export async function getPlayerBadges(playerId: string) {
  const { data, error } = await supabase
    .from("player_badges")
    .select("*, badge_definitions!badge_id(*)")
    .eq("player_id", playerId)
    .order("awarded_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as (PlayerBadge & { badge_definitions: KidsBadge })[]).map(
    (d) => ({ ...d, badge: d.badge_definitions })
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
    .from("badge_definitions")
    .insert({ ...data, is_preset: false })
    .select()
    .single();
  if (error) throw error;
  return badge as KidsBadge;
}

export async function updateBadge(
  badgeId: string,
  updates: Partial<KidsBadge>
) {
  const { data, error } = await supabase
    .from("badge_definitions")
    .update(updates)
    .eq("id", badgeId)
    .select()
    .single();
  if (error) throw error;
  return data as KidsBadge;
}

export async function awardBadge(data: {
  team_id: string;
  player_id: string;
  badge_id: string;
  awarded_by?: string;
  reason?: string;
}) {
  const { data: pb, error } = await supabase
    .from("player_badges")
    .insert({ ...data, awarded_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return pb as PlayerBadge;
}

// === 表彰 ===

export async function getAwards(teamId: string) {
  const { data, error } = await supabase
    .from("weekly_awards")
    .select("*, players!player_id(id, name, number, card_photo_url)")
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
    .from("weekly_awards")
    .insert(data)
    .select("*, players!player_id(id, name, number)")
    .single();
  if (error) throw error;
  return award as Award;
}

// === マイルストーン ===

export async function getMilestones(playerId: string) {
  const { data, error } = await supabase
    .from("player_milestones")
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
    .from("player_milestones")
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
    .select("*, players!player_id(id, name, number, card_photo_url), games!game_id(game_date, opponent_name)")
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
