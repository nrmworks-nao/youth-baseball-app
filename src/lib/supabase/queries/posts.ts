import { supabase } from "@/lib/supabase/client";
import type { Post, PostComment, PostPriority, PostCategory } from "@/types";

/** 投稿一覧取得 */
export async function getPosts(teamId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "*, users!author_id(display_name, avatar_url), post_comments(count), post_reactions(count)"
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** 投稿詳細取得 */
export async function getPost(postId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("*, users!author_id(display_name, avatar_url)")
    .eq("id", postId)
    .single();
  if (error) throw error;
  return data;
}

/** 投稿作成 */
export async function createPost(data: {
  team_id: string;
  author_id: string;
  title: string;
  body: string;
  priority?: PostPriority;
  category?: PostCategory;
  image_urls?: string[];
  is_pinned?: boolean;
}) {
  const { data: post, error } = await supabase
    .from("posts")
    .insert({ priority: "normal", category: "general", ...data })
    .select()
    .single();
  if (error) throw error;
  return post as Post;
}

/** コメント一覧取得 */
export async function getComments(postId: string) {
  const { data, error } = await supabase
    .from("post_comments")
    .select("*, users:user_id(display_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

/** コメント追加 */
export async function addComment(data: {
  post_id: string;
  team_id: string;
  user_id: string;
  body: string;
}) {
  const { data: comment, error } = await supabase
    .from("post_comments")
    .insert(data)
    .select("*, users:user_id(display_name, avatar_url)")
    .single();
  if (error) throw error;
  return comment;
}

/** いいね（リアクション）追加 */
export async function addReaction(data: {
  post_id: string;
  team_id: string;
  user_id: string;
  reaction_type: string;
}) {
  const { error } = await supabase.from("post_reactions").insert(data);
  if (error) throw error;
}

/** いいね削除 */
export async function removeReaction(postId: string, userId: string) {
  const { error } = await supabase
    .from("post_reactions")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);
  if (error) throw error;
}

/** 既読登録 */
export async function markAsRead(postId: string, userId: string) {
  const { error } = await supabase
    .from("post_read_status")
    .upsert(
      { post_id: postId, user_id: userId, read_at: new Date().toISOString() },
      { onConflict: "post_id,user_id" }
    );
  if (error) throw error;
}

/** 未読連絡件数取得 */
export async function getUnreadCount(teamId: string, userId: string) {
  // まずチームの投稿IDをすべて取得
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id")
    .eq("team_id", teamId);
  if (postsError) throw postsError;
  if (!posts || posts.length === 0) return 0;

  // 既読済みの投稿IDを取得
  const postIds = posts.map((p) => p.id);
  const { data: readPosts, error: readError } = await supabase
    .from("post_read_status")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);
  if (readError) throw readError;

  const readPostIds = new Set((readPosts || []).map((r) => r.post_id));
  return postIds.filter((id) => !readPostIds.has(id)).length;
}

/** 投稿の既読状況取得（管理者向け） */
export async function getReadStatuses(postId: string) {
  const { data, error } = await supabase
    .from("post_read_status")
    .select("*, users:user_id(display_name, avatar_url)")
    .eq("post_id", postId);
  if (error) throw error;
  return data || [];
}

/** リアクション数取得 */
export async function getReactionCount(postId: string) {
  const { count, error } = await supabase
    .from("post_reactions")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);
  if (error) throw error;
  return count ?? 0;
}

/** ユーザーがいいね済みか確認 */
export async function hasUserReacted(postId: string, userId: string) {
  const { data, error } = await supabase
    .from("post_reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
