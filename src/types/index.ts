// 権限グループ
export type PermissionGroup =
  | "system_admin"
  | "team_admin"
  | "vice_president"
  | "treasurer"
  | "manager"
  | "publicity"
  | "parent";

// ユーザー
export interface User {
  id: string;
  line_id: string;
  display_name: string;
  avatar_url?: string;
  picture_url?: string;
  phone?: string;
  notification_settings?: NotificationSettings;
  created_at: string;
}

// 通知設定
export interface NotificationSettings {
  schedule: boolean;
  post: boolean;
  accounting: boolean;
}

// チームとロール情報の複合型
export interface TeamWithRole {
  team: Team;
  permission_group: PermissionGroup;
  display_title: string;
  member_id: string;
}

// 子供（選手）情報＋チーム名
export interface ChildWithTeam {
  player: Player;
  team_name: string;
  team_id: string;
  relationship?: string;
  user_child_id: string;
}

// チーム
export interface Team {
  id: string;
  name: string;
  region?: string;
  league?: string;
  invite_code?: string;
  invite_expires_at?: string;
  require_approval: boolean;
  created_at: string;
}

// チームメンバー
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  permission_group: PermissionGroup;
  display_title: string;
  is_active: boolean;
  created_at: string;
  // 結合データ
  users?: User;
}

// 選手
export interface Player {
  id: string;
  team_id: string;
  name: string;
  number?: number;
  position?: string;
  grade?: number;
  throwing_hand?: string;
  batting_hand?: string;
  is_active: boolean;
  created_at: string;
}

// 保護者-選手紐づけ
export interface ParentPlayerRelation {
  id: string;
  user_id: string;
  player_id: string;
  team_id: string;
  relationship?: string;
  created_at: string;
  // 結合データ
  users?: User;
  players?: Player;
}

// 招待
export interface Invitation {
  id: string;
  team_id: string;
  code: string;
  expires_at: string;
  created_by: string;
  created_at: string;
}

// イベント種別
export type EventType = "practice" | "game" | "other";

// イベント
export interface Event {
  id: string;
  team_id: string;
  title: string;
  event_type: EventType;
  description?: string;
  location?: string;
  start_at: string;
  end_at: string;
  is_recurring: boolean;
  created_by: string;
  created_at: string;
}

// 出欠ステータス
export type AttendanceStatus = "attending" | "absent" | "undecided";

// 出欠
export interface EventAttendance {
  id: string;
  event_id: string;
  player_id?: string;
  user_id: string;
  status: AttendanceStatus;
  note?: string;
  created_at: string;
}

// 投稿の重要度
export type PostPriority = "normal" | "important" | "urgent";

// 投稿カテゴリ
export type PostCategory = "general" | "schedule" | "report" | "other";

// 投稿
export interface Post {
  id: string;
  team_id: string;
  author_id: string;
  title: string;
  body: string;
  priority: PostPriority;
  category: PostCategory;
  image_urls?: string[];
  created_at: string;
  updated_at: string;
  // 結合データ
  author?: User;
  comment_count?: number;
  reaction_count?: number;
  is_read?: boolean;
}

// コメント
export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: User;
}

// リアクション
export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// 既読
export interface PostReadStatus {
  id: string;
  post_id: string;
  user_id: string;
  read_at: string;
}

// チームチャレンジ
export interface TeamChallenge {
  id: string;
  team_id: string;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
}

// おすすめ商品
export interface ProductRecommendation {
  id: string;
  team_id: string;
  product_name: string;
  description?: string;
  image_url?: string;
  url?: string;
  comment: string;
  pinned: boolean;
  created_at: string;
}

// 通知
export interface Notification {
  id: string;
  user_id: string;
  team_id: string;
  title: string;
  body: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

// 試合種別
export type GameType = "practice" | "tournament" | "league";

// 試合結果
export type GameResult = "win" | "lose" | "draw";

// 試合
export interface Game {
  id: string;
  team_id: string;
  event_id?: string;
  opponent_name: string;
  game_date: string;
  venue?: string;
  game_type: GameType;
  result?: GameResult;
  score_team?: number;
  score_opponent?: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // イニングスコア（JSON or 別テーブル）
  inning_scores?: InningScore[];
}

// イニングごとの得点
export interface InningScore {
  inning: number;
  score_team: number;
  score_opponent: number;
}

// スコアブック画像
export interface ScorebookImage {
  id: string;
  game_id: string;
  team_id: string;
  image_url: string;
  sort_order: number;
  uploaded_by: string;
  created_at: string;
}

// 打順・守備位置
export interface GameLineup {
  id: string;
  game_id: string;
  team_id: string;
  player_id: string;
  batting_order?: number;
  position?: string;
  is_starter: boolean;
  created_at: string;
  // 結合データ
  player?: Player;
}

// 選手試合成績
export interface PlayerGameStats {
  id: string;
  game_id: string;
  team_id: string;
  player_id: string;
  // 打撃
  at_bats: number;
  hits: number;
  doubles: number;
  triples: number;
  home_runs: number;
  rbis: number;
  walks: number;
  strikeouts: number;
  stolen_bases: number;
  sacrifice_hits: number;
  // 守備
  putouts: number;
  assists: number;
  errors: number;
  // 投手
  innings_pitched: number;
  pitches_thrown: number;
  earned_runs: number;
  hits_allowed: number;
  walks_allowed: number;
  strikeouts_pitched: number;
  is_winning_pitcher: boolean;
  is_losing_pitcher: boolean;
  created_at: string;
  updated_at: string;
  // 結合データ
  player?: Player;
}

// 身体測定
export interface PlayerMeasurement {
  id: string;
  team_id: string;
  player_id: string;
  measured_at: string;
  height_cm?: number;
  weight_kg?: number;
  notes?: string;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

// 体力測定
export interface PlayerFitnessRecord {
  id: string;
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
  created_at: string;
  updated_at: string;
}

// 打撃集計
export interface BattingAggregation {
  player_id: string;
  player_name: string;
  player_number?: number;
  games: number;
  at_bats: number;
  hits: number;
  doubles: number;
  triples: number;
  home_runs: number;
  rbis: number;
  walks: number;
  strikeouts: number;
  stolen_bases: number;
  sacrifice_hits: number;
  hit_by_pitch: number;
  sacrifice_flies: number;
  // 計算値
  batting_avg: number;
  obp: number; // 出塁率
  slg: number; // 長打率
  ops: number;
  total_bases: number;
}

// 投手集計
export interface PitchingAggregation {
  player_id: string;
  player_name: string;
  innings_pitched: number;
  earned_runs: number;
  hits_allowed: number;
  walks_allowed: number;
  strikeouts_pitched: number;
  wins: number;
  losses: number;
  era: number; // 防御率
  whip: number;
}

// 守備集計
export interface FieldingAggregation {
  player_id: string;
  player_name: string;
  putouts: number;
  assists: number;
  errors: number;
  fielding_pct: number; // 守備率
}

// ランキング項目
export type RankingMetric =
  | "batting_avg"
  | "home_runs"
  | "rbis"
  | "stolen_bases"
  | "ops"
  | "throw_distance"
  | "sprint_50m";

// ランキング期間
export type RankingPeriod = "all" | "month" | "season";

// === キッズ機能 ===

// カードランク
export type CardRank = "bronze" | "silver" | "gold" | "platinum";

// 選手カード
export interface PlayerCard {
  id: string;
  player_id: string;
  team_id: string;
  card_rank: CardRank;
  photo_url?: string;
  batting_throw?: string; // 例: "右投右打"
  favorite_pro_player?: string;
  best_play?: string;
  future_dream?: string;
  selected_badge_ids?: string[];
  created_at: string;
  updated_at: string;
  // 結合データ
  player?: Player;
}

// バッジカテゴリ
export type BadgeCategory =
  | "batting"
  | "pitching"
  | "fielding"
  | "running"
  | "effort"
  | "special"
  | "custom";

// バッジ
export interface KidsBadge {
  id: string;
  team_id?: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon_color: string;
  is_preset: boolean;
  is_active: boolean;
  condition_key?: string;
  created_at: string;
}

// 選手バッジ
export interface PlayerBadge {
  id: string;
  player_id: string;
  badge_id: string;
  earned_at: string;
  // 結合データ
  badge?: KidsBadge;
}

// 表彰カテゴリ
export type AwardCategory = "mvp" | "effort" | "nice_play";

// 表彰
export interface Award {
  id: string;
  team_id: string;
  player_id: string;
  category: AwardCategory;
  comment?: string;
  awarded_at: string;
  created_by: string;
  created_at: string;
  // 結合データ
  player?: Player;
}

// マイルストーン種別
export type MilestoneType =
  | "first_hit"
  | "first_rbi"
  | "first_homerun"
  | "first_strikeout_pitched"
  | "first_complete_game"
  | "first_win"
  | "first_steal"
  | "personal_best"
  | "height_milestone"
  | "anniversary"
  | "badge_earned"
  | "award_received"
  | "manual";

// マイルストーン
export interface Milestone {
  id: string;
  player_id: string;
  team_id: string;
  milestone_type: MilestoneType;
  title: string;
  description?: string;
  milestone_date: string;
  is_auto: boolean;
  created_at: string;
}

// マイルストーンコメント
export interface MilestoneComment {
  id: string;
  milestone_id: string;
  user_id: string;
  body: string;
  created_at: string;
  // 結合データ
  user?: User;
}

// 月間ふりかえり
export interface MonthlyReview {
  id: string;
  player_id: string;
  team_id: string;
  year: number;
  month: number;
  practice_attendance_rate?: number;
  games_played?: number;
  batting_avg?: number;
  batting_avg_change?: number;
  height_cm?: number;
  height_change?: number;
  weight_kg?: number;
  weight_change?: number;
  badges_earned?: string[];
  best_play_summary?: string;
  positive_message: string;
  created_at: string;
}

// マイ目標
export type GoalStatus = "active" | "achieved" | "expired";

export interface PlayerGoal {
  id: string;
  player_id: string;
  team_id: string;
  title: string;
  target_metric?: string;
  target_value: number;
  current_value: number;
  deadline?: string;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

// 目標への応援コメント
export interface GoalComment {
  id: string;
  goal_id: string;
  user_id: string;
  body: string;
  created_at: string;
  user?: User;
}

// ベストプレー
export interface BestPlay {
  id: string;
  team_id: string;
  game_id?: string;
  player_id: string;
  title: string;
  description?: string;
  photo_url?: string;
  is_auto: boolean;
  play_date: string;
  created_by?: string;
  created_at: string;
  // 結合データ
  player?: Player;
  game?: Game;
}

// === アルバム ===

export interface Album {
  id: string;
  team_id: string;
  title: string;
  description?: string;
  cover_photo_url?: string;
  event_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // 結合データ
  event?: Event;
  photo_count?: number;
}

export interface AlbumPhoto {
  id: string;
  album_id: string;
  team_id: string;
  photo_url: string;
  thumbnail_url?: string;
  caption?: string;
  taken_at?: string;
  uploaded_by: string;
  created_at: string;
  // 結合データ
  like_count?: number;
  is_liked?: boolean;
  uploader?: User;
}

export interface PhotoLike {
  id: string;
  photo_id: string;
  team_id: string;
  user_id: string;
  created_at: string;
}

// === 会計 ===

export type FeeFrequency = "monthly" | "yearly" | "one_time";

export interface FeeSetting {
  id: string;
  team_id: string;
  name: string;
  amount: number;
  frequency: FeeFrequency;
  is_active: boolean;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = "pending" | "paid" | "partial" | "overdue" | "cancelled";

export interface Invoice {
  id: string;
  team_id: string;
  target_user_id: string;
  title: string;
  total_amount: number;
  status: InvoiceStatus;
  due_date?: string;
  issued_at: string;
  paid_at?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // 結合データ
  target_user?: User;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  team_id: string;
  fee_setting_id?: string;
  description: string;
  amount: number;
  quantity: number;
  created_at: string;
}

export type PaymentMethod = "cash" | "bank_transfer" | "other";

export interface Payment {
  id: string;
  team_id: string;
  invoice_id?: string;
  payer_user_id: string;
  amount: number;
  payment_method?: PaymentMethod;
  paid_at: string;
  confirmed_by?: string;
  confirmed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // 結合データ
  payer?: User;
  invoice?: Invoice;
}

export type LedgerEntryType = "income" | "expense";

export interface LedgerEntry {
  id: string;
  team_id: string;
  entry_type: LedgerEntryType;
  category: string;
  description: string;
  amount: number;
  entry_date: string;
  payment_id?: string;
  receipt_url?: string;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}

// === ショップ ===

export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  sort_order: number;
  parent_id?: string;
  created_at: string;
}

export interface ShopProduct {
  id: string;
  category_id?: string;
  name: string;
  description?: string;
  brand?: string;
  price_min?: number;
  price_max?: number;
  age_group?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // 結合データ
  category?: ShopCategory;
  images?: ShopProductImage[];
  links?: ShopProductLink[];
  pinned?: TeamPinnedProduct;
}

export interface ShopProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface ShopProductLink {
  id: string;
  product_id: string;
  store_name: string;
  url: string;
  price?: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TeamPinnedProduct {
  id: string;
  team_id: string;
  product_id: string;
  comment?: string;
  pinned_by: string;
  sort_order: number;
  created_at: string;
  // 結合データ
  product?: ShopProduct;
  pinner?: User;
}

// === チーム間連携 ===

export interface TeamProfile {
  id: string;
  team_id: string;
  introduction?: string;
  home_ground?: string;
  practice_schedule?: string;
  member_count?: number;
  founded_year?: number;
  contact_email?: string;
  website_url?: string;
  photo_urls?: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // 結合データ
  team?: Team;
}

export interface InterTeamMessage {
  id: string;
  from_team_id: string;
  to_team_id: string;
  sender_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  read_at?: string;
  parent_message_id?: string;
  created_at: string;
  // 結合データ
  from_team?: Team;
  to_team?: Team;
  sender?: User;
}

export type MatchRequestStatus = "pending" | "accepted" | "declined" | "cancelled";

export interface MatchRequest {
  id: string;
  from_team_id: string;
  to_team_id: string;
  requested_by: string;
  message?: string;
  preferred_venue?: string;
  status: MatchRequestStatus;
  responded_by?: string;
  responded_at?: string;
  confirmed_date?: string;
  created_at: string;
  updated_at: string;
  // 結合データ
  from_team?: Team;
  to_team?: Team;
  dates?: MatchRequestDate[];
}

export interface MatchRequestDate {
  id: string;
  match_request_id: string;
  proposed_date: string;
  start_time?: string;
  end_time?: string;
  is_selected: boolean;
  created_at: string;
}

export interface HeadToHeadRecord {
  id: string;
  team_id: string;
  opponent_team_id?: string;
  opponent_name: string;
  game_id?: string;
  game_date: string;
  result: "win" | "lose" | "draw";
  score_team?: number;
  score_opponent?: number;
  notes?: string;
  created_at: string;
}

// === 通知 ===

export type NotificationType =
  | "event"
  | "post"
  | "attendance"
  | "payment"
  | "match_request"
  | "album"
  | "shop"
  | "general";

export interface AppNotification {
  id: string;
  team_id?: string;
  user_id: string;
  title: string;
  body?: string;
  notification_type: NotificationType;
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  read_at?: string;
  is_sent_line: boolean;
  created_at: string;
}

// === LINE連携設定 ===

export interface TeamLineConfig {
  id: string;
  team_id: string;
  line_channel_id?: string;
  line_channel_secret?: string;
  line_channel_access_token?: string;
  line_group_id?: string;
  liff_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
