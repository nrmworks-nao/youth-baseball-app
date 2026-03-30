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
  picture_url?: string;
  created_at: string;
}

// チーム
export interface Team {
  id: string;
  name: string;
  region?: string;
  league?: string;
  created_at: string;
}

// チームメンバー
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  permission_group: PermissionGroup;
  display_title: string;
  created_at: string;
}

// 選手
export interface Player {
  id: string;
  team_id: string;
  name: string;
  number?: number;
  position?: string;
  grade?: number;
  created_at: string;
}

// 保護者-選手紐づけ
export interface ParentPlayerRelation {
  id: string;
  parent_user_id: string;
  player_id: string;
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
