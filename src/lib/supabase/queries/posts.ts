import { supabase } from "@/lib/supabase/client";
import type { Post, PostComment, PostPriority, PostCategory } from "@/types";

/** 投稿一覧取得（分割クエリ：リレーション構文回避） */
export async function getPosts(teamId: string) {
  // 1. posts を取得（リレーションなし）
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!posts || posts.length === 0) return [];

  // 2. 投稿ごとのコメント数を取得
  const postIds = posts.map((p: any) => p.id);
  const { data: commentCounts } = await supabase
    .from("post_comments")
    .select("post_id")
    .in("post_id", postIds);
  const commentCountMap: Record<string, number> = {};
  if (commentCounts) {
    for (const c of commentCounts) {
      commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1;
    }
  }

  // 3. 投稿ごとのリアクション数を取得
  const { data: reactionCounts } = await supabase
    .from("post_reactions")
    .select("post_id")
    .in("post_id", postIds);
  const reactionCountMap: Record<string, number> = {};
  if (reactionCounts) {
    for (const r of reactionCounts) {
      reactionCountMap[r.post_id] = (reactionCountMap[r.post_id] || 0) + 1;
    }
  }

  // 4. 著者情報を取得
  const authorIds = [...new Set(posts.map((p: any) => p.author_id).filter(Boolean))];
  let usersMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
  if (authorIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, display_name, avatar_url")
      .in("id", authorIds);
    if (users) {
      usersMap = Object.fromEntries(users.map((u: any) => [u.id, { display_name: u.display_name, avatar_url: u.avatar_url }]));
    }
  }

  // 5. マージ（UIが期待する形式に合わせる）
  return posts.map((p: any) => ({
    ...p,
    users: usersMap[p.author_id] || null,
    post_comments: [{ count: commentCountMap[p.id] || 0 }],
    post_reactions: [{ count: reactionCountMap[p.id] || 0 }],
  }));
}

/** 投稿詳細取得（分割クエリ：リレーション構文回避） */
export async function getPost(postId: string) {
  // 1. post を取得
  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();
  if (error) throw error;

  // 2. 著者情報を取得
  let users: { display_name: string; avatar_url: string | null } | null = null;
  if (post.author_id) {
    const { data: userData } = await supabase
      .from("users")
      .select("id, display_name, avatar_url")
      .eq("id", post.author_id)
      .maybeSingle();
    if (userData) {
      users = { display_name: userData.display_name, avatar_url: userData.avatar_url };
    }
  }

  return { ...post, users };
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
    .insert({ priority: "normal", category: "other", ...data })
    .select()
    .single();
  if (error) throw error;
  return post as Post;
}

/** コメント一覧取得（分割クエリ：リレーション構文回避） */
export async function getComments(postId: string) {
  // 1. コメントを取得
  const { data: comments, error } = await supabase
    .from("post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!comments || comments.length === 0) return [];

  // 2. ユーザー情報を取得
  const userIds = [...new Set(comments.map((c: any) => c.user_id).filter(Boolean))];
  let usersMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, display_name, avatar_url")
      .in("id", userIds);
    if (users) {
      usersMap = Object.fromEntries(users.map((u: any) => [u.id, { display_name: u.display_name, avatar_url: u.avatar_url }]));
    }
  }

  // 3. マージ
  return comments.map((c: any) => ({
    ...c,
    users: usersMap[c.user_id] || null,
  }));
}

/** コメント追加（分割クエリ：リレーション構文回避） */
export async function addComment(data: {
  post_id: string;
  team_id: string;
  user_id: string;
  body: string;
}) {
  // 1. コメントを挿入
  const { data: comment, error } = await supabase
    .from("post_comments")
    .insert(data)
    .select()
    .single();
  if (error) throw error;

  // 2. ユーザー情報を取得
  let users: { display_name: string; avatar_url: string | null } | null = null;
  const { data: userData } = await supabase
    .from("users")
    .select("id, display_name, avatar_url")
    .eq("id", data.user_id)
    .maybeSingle();
  if (userData) {
    users = { display_name: userData.display_name, avatar_url: userData.avatar_url };
  }

  return { ...comment, users };
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

/** 投稿の既読状況取得（管理者向け）（分割クエリ：リレーション構文回避） */
export async function getReadStatuses(postId: string) {
  // 1. 既読データを取得
  const { data: statuses, error } = await supabase
    .from("post_read_status")
    .select("*")
    .eq("post_id", postId);
  if (error) throw error;
  if (!statuses || statuses.length === 0) return [];

  // 2. ユーザー情報を取得
  const userIds = [...new Set(statuses.map((s: any) => s.user_id).filter(Boolean))];
  let usersMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, display_name, avatar_url")
      .in("id", userIds);
    if (users) {
      usersMap = Object.fromEntries(users.map((u: any) => [u.id, { display_name: u.display_name, avatar_url: u.avatar_url }]));
    }
  }

  // 3. マージ
  return statuses.map((s: any) => ({
    ...s,
    users: usersMap[s.user_id] || null,
  }));
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
