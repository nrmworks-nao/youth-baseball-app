import { supabase } from "@/lib/supabase/client";
import type { Post, PostComment, PostPriority, PostCategory } from "@/types";

/** 投稿一覧取得 */
export async function getPosts(teamId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "*, users!author_id(display_name, picture_url), post_comments(count), post_reactions(count)"
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Post[];
}

/** 投稿詳細取得 */
export async function getPost(postId: string) {
  const { data, error } = await supabase
    .from("posts")
    .select("*, users!author_id(display_name, picture_url)")
    .eq("id", postId)
    .single();
  if (error) throw error;
  return data as Post;
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
    .select("*, users!author_id(display_name, picture_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as PostComment[];
}

/** コメント追加 */
export async function addComment(data: {
  post_id: string;
  author_id: string;
  body: string;
}) {
  const { data: comment, error } = await supabase
    .from("post_comments")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return comment as PostComment;
}

/** いいね（リアクション）追加 */
export async function addReaction(data: {
  post_id: string;
  user_id: string;
  emoji: string;
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
  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId)
    .not(
      "id",
      "in",
      `(select post_id from post_read_status where user_id = '${userId}')`
    );
  if (error) throw error;
  return count ?? 0;
}
