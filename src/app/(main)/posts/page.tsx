"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { cn } from "@/lib/utils/cn";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { getPosts, getUnreadCount, markAsRead } from "@/lib/supabase/queries/posts";
import { supabase } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { PostPriority } from "@/types";

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  practice: { label: "練習", className: "bg-green-100 text-green-700" },
  game: { label: "試合", className: "bg-orange-100 text-orange-700" },
  admin: { label: "事務連絡", className: "bg-blue-100 text-blue-700" },
  accounting: { label: "会計", className: "bg-purple-100 text-purple-700" },
  other: { label: "その他", className: "bg-gray-100 text-gray-700" },
};

const PRIORITY_CONFIG: Record<
  PostPriority,
  { label: string; variant: "default" | "important" | "urgent"; borderColor: string }
> = {
  normal: { label: "通常", variant: "default", borderColor: "" },
  important: {
    label: "重要",
    variant: "important",
    borderColor: "border-l-4 border-l-orange-400",
  },
  urgent: {
    label: "緊急",
    variant: "urgent",
    borderColor: "border-l-4 border-l-red-500",
  },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

interface PostRow {
  id: string;
  title: string;
  body: string;
  priority: PostPriority;
  category: string;
  is_pinned: boolean;
  created_at: string;
  users: { display_name: string; avatar_url: string | null } | null;
  post_comments: [{ count: number }];
  post_reactions: [{ count: number }];
}

export default function PostsPage() {
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { canPost } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [readPostIds, setReadPostIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"priority" | "date">("priority");
  const [filterMode, setFilterMode] = useState<"all" | "unread">("all");
  const [displayCount, setDisplayCount] = useState(5);

  const fetchPosts = useCallback(async () => {
    if (!currentTeam) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      const data = await getPosts(currentTeam.id);
      setPosts(data as unknown as PostRow[]);

      // 既読情報の取得
      const { data: readStatuses } = await supabase
        .from("post_read_status")
        .select("post_id")
        .eq("user_id", user.id);
      if (readStatuses) {
        setReadPostIds(new Set(readStatuses.map((r) => r.post_id)));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (!teamLoading && currentTeam) {
      fetchPosts();
    }
  }, [teamLoading, currentTeam, fetchPosts]);

  if (teamLoading || isLoading) {
    return <Loading text="連絡を読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchPosts} />;
  }

  if (!currentTeam) {
    return <ErrorDisplay title="チーム未選択" message="チームを選択してください。" />;
  }

  // フィルタリング（未読のみ）
  const filteredPosts = filterMode === "unread"
    ? posts.filter((post) => !readPostIds.has(post.id))
    : posts;

  // ピン留め投稿を先頭に、その後ソート
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    // ピン留めを先頭
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;

    if (sortMode === "priority") {
      const priorityOrder: Record<string, number> = { urgent: 0, important: 1, normal: 2 };
      const pa = priorityOrder[a.priority] ?? 2;
      const pb = priorityOrder[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // ページネーション
  const visiblePosts = sortedPosts.slice(0, displayCount);
  const hasMore = sortedPosts.length > displayCount;

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
          <h2 className="text-base font-bold text-gray-900 shrink-0">連絡</h2>
          <div className="flex rounded-lg bg-gray-100 p-0.5 shrink-0">
            <button
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                sortMode === "priority"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              )}
              onClick={() => setSortMode("priority")}
            >
              重要度順
            </button>
            <button
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                sortMode === "date"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              )}
              onClick={() => setSortMode("date")}
            >
              新着順
            </button>
          </div>
          <div className="flex rounded-lg bg-gray-100 p-0.5 shrink-0">
            <button
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                filterMode === "unread"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              )}
              onClick={() => { setFilterMode("unread"); setDisplayCount(5); }}
            >
              未読のみ
            </button>
            <button
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                filterMode === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              )}
              onClick={() => { setFilterMode("all"); setDisplayCount(5); }}
            >
              すべて
            </button>
          </div>
        </div>
        {canPost() && (
          <Link href="/posts/create" className="shrink-0">
            <Button size="sm">+ 投稿</Button>
          </Link>
        )}
      </div>

      {/* タイムライン */}
      <div className="space-y-2 p-4">
        {sortedPosts.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            {filterMode === "unread" ? "未読の連絡はありません" : "連絡はありません"}
          </p>
        ) : (
          visiblePosts.map((post) => {
            const priority = (post.priority || "normal") as PostPriority;
            const priorityConfig = PRIORITY_CONFIG[priority];
            const isRead = readPostIds.has(post.id);
            const commentCount = post.post_comments?.[0]?.count ?? 0;
            const reactionCount = post.post_reactions?.[0]?.count ?? 0;
            const authorName = post.users?.display_name || "不明";

            return (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <Card
                  className={`p-4 transition-colors hover:bg-gray-50 ${priorityConfig.borderColor} ${!isRead ? "bg-green-50/50" : ""}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {post.is_pinned && (
                          <span className="text-xs text-gray-400" title="ピン留め">📌</span>
                        )}
                        {priority !== "normal" && (
                          <Badge variant={priorityConfig.variant}>
                            {priorityConfig.label}
                          </Badge>
                        )}
                        {post.category && CATEGORY_CONFIG[post.category] && (
                          <span className={cn("text-xs px-2 py-0.5 rounded-full", CATEGORY_CONFIG[post.category].className)}>
                            {CATEGORY_CONFIG[post.category].label}
                          </span>
                        )}
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {post.title}
                        </h3>
                      </div>
                      {!isRead && (
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                      )}
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2">
                      {post.body}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        <span>{authorName}</span>
                        <span>{timeAgo(post.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {reactionCount > 0 && (
                          <span className="flex items-center gap-0.5">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3.25A.75.75 0 0 1 14.25 2.5a2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m.729-8.07a48.474 48.474 0 0 0-.726 8.07m.726-8.07a48.345 48.345 0 0 1 .288-3.202c.14-.95-.603-1.798-1.566-1.798h-.29c-.638 0-1.18.434-1.285 1.064A48.46 48.46 0 0 0 3 12.288c0 1.655.09 3.288.267 4.892.127.628.669 1.068 1.305 1.068h.29c.96 0 1.7-.845 1.561-1.793a47.577 47.577 0 0 1-.419-5.065" />
                            </svg>
                            {reactionCount}
                          </span>
                        )}
                        {commentCount > 0 && (
                          <span className="flex items-center gap-0.5">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                            </svg>
                            {commentCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })
        )}
        {hasMore && (
          <button
            className="w-full rounded-lg border border-gray-200 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            onClick={() => setDisplayCount((prev) => prev + 5)}
          >
            もっと見る
          </button>
        )}
      </div>
    </div>
  );
}
