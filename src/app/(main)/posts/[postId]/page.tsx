"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { cn } from "@/lib/utils/cn";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import {
  getPost,
  getComments,
  addComment,
  addReaction,
  removeReaction,
  markAsRead,
  getReactionCount,
  hasUserReacted,
  getReadStatuses,
} from "@/lib/supabase/queries/posts";
import { supabase } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/supabase/error-handler";

interface PostData {
  id: string;
  title: string;
  body: string;
  priority: string;
  category: string;
  image_urls: string[] | null;
  created_at: string;
  author_id: string;
  team_id: string;
  users: { display_name: string; avatar_url: string | null } | null;
}

interface CommentData {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  users: { display_name: string; avatar_url: string | null } | null;
}

interface ReadStatusData {
  user_id: string;
  read_at: string;
  users: { display_name: string; avatar_url: string | null } | null;
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.postId as string;
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { hasPermission } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);
  const canViewReadStatus = hasPermission(["director", "vice_president", "coach"]);

  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [readStatuses, setReadStatuses] = useState<ReadStatusData[]>([]);
  const [showReadStatus, setShowReadStatus] = useState(false);
  const [teamMemberCount, setTeamMemberCount] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");
      setUserId(user.id);

      const [postData, commentsData, reactionCount, userReacted] = await Promise.all([
        getPost(postId),
        getComments(postId),
        getReactionCount(postId),
        hasUserReacted(postId, user.id),
      ]);

      setPost(postData as unknown as PostData);
      setComments(commentsData as unknown as CommentData[]);
      setLikeCount(reactionCount);
      setIsLiked(userReacted);

      // 既読登録
      await markAsRead(postId, user.id);

      // 管理者向け: 既読状況取得
      if (canViewReadStatus) {
        const readData = await getReadStatuses(postId);
        setReadStatuses(readData as unknown as ReadStatusData[]);

        // チームメンバー数の取得
        if (postData && (postData as unknown as PostData).team_id) {
          const { count } = await supabase
            .from("team_members")
            .select("id", { count: "exact", head: true })
            .eq("team_id", (postData as unknown as PostData).team_id)
            .eq("is_active", true);
          setTeamMemberCount(count ?? 0);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [postId, canViewReadStatus]);

  useEffect(() => {
    if (!teamLoading) {
      fetchData();
    }
  }, [teamLoading, fetchData]);

  const handleLike = async () => {
    if (!userId || !post || !currentTeam) return;
    try {
      if (isLiked) {
        // 楽観的UI更新
        setIsLiked(false);
        setLikeCount((c) => c - 1);
        await removeReaction(postId, userId);
      } else {
        setIsLiked(true);
        setLikeCount((c) => c + 1);
        await addReaction({
          post_id: postId,
          team_id: currentTeam.id,
          user_id: userId,
          reaction_type: "like",
        });
      }
    } catch (err) {
      // ロールバック
      setIsLiked(!isLiked);
      setLikeCount((c) => isLiked ? c + 1 : c - 1);
      alert(getErrorMessage(err));
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !userId || !post || !currentTeam) return;
    setIsSubmittingComment(true);
    try {
      const newComment = await addComment({
        post_id: postId,
        team_id: currentTeam.id,
        user_id: userId,
        body: commentText.trim(),
      });
      setComments((prev) => [...prev, newComment as unknown as CommentData]);
      setCommentText("");
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading || teamLoading) {
    return <Loading text="投稿を読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  if (!post) {
    return <ErrorDisplay title="投稿が見つかりません" message="指定された投稿は存在しません。" />;
  }

  const authorName = post.users?.display_name || "不明";

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <Link
          href="/posts"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          連絡一覧
        </Link>
        {/* 編集ボタン（投稿者本人 or サイト管理者） */}
        {userId && (post.author_id === userId || currentMembership?.is_admin) && (
          <Link
            href={`/posts/${postId}/edit`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
          >
            <Pencil className="h-4 w-4" />
            編集
          </Link>
        )}
      </div>

      <div className="space-y-4 p-4">
        {/* 投稿本文 */}
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center gap-2">
              {post.priority === "urgent" && (
                <Badge variant="urgent">緊急</Badge>
              )}
              {post.priority === "important" && (
                <Badge variant="important">重要</Badge>
              )}
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{post.title}</h1>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium dark:bg-gray-700">
                {authorName.charAt(0)}
              </div>
              <span>{authorName}</span>
              <span>{formatDateTime(post.created_at)}</span>
            </div>

            <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {post.body}
            </div>

            {/* 画像表示 */}
            {post.image_urls && post.image_urls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.image_urls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="max-h-48 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}

            {/* いいねボタン */}
            <div className="flex items-center gap-4 border-t border-gray-100 pt-3 dark:border-gray-800">
              <button
                className={cn(
                  "flex items-center gap-1 text-sm transition-colors",
                  isLiked
                    ? "text-green-600"
                    : "text-gray-400 hover:text-gray-600"
                )}
                onClick={handleLike}
              >
                <svg
                  className="h-5 w-5"
                  fill={isLiked ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3.25A.75.75 0 0 1 14.25 2.5a2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m.729-8.07a48.474 48.474 0 0 0-.726 8.07m.726-8.07a48.345 48.345 0 0 1 .288-3.202c.14-.95-.603-1.798-1.566-1.798h-.29c-.638 0-1.18.434-1.285 1.064A48.46 48.46 0 0 0 3 12.288c0 1.655.09 3.288.267 4.892.127.628.669 1.068 1.305 1.068h.29c.96 0 1.7-.845 1.561-1.793a47.577 47.577 0 0 1-.419-5.065"
                  />
                </svg>
                {likeCount}
              </button>
              <span className="text-sm text-gray-400">
                コメント {comments.length}件
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 既読状況（管理者向け） */}
        {canViewReadStatus && (
          <Card>
            <CardContent className="pt-4">
              <button
                className="flex w-full items-center justify-between text-sm"
                onClick={() => setShowReadStatus(!showReadStatus)}
              >
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  既読状況: {readStatuses.length}/{teamMemberCount}人 既読
                </span>
                <svg
                  className={cn("h-4 w-4 text-gray-400 transition-transform", showReadStatus && "rotate-180")}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {showReadStatus && (
                <div className="mt-3 space-y-1.5">
                  {readStatuses.length === 0 ? (
                    <p className="text-xs text-gray-400">まだ既読者はいません</p>
                  ) : (
                    readStatuses.map((rs) => (
                      <div key={rs.user_id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-[9px] font-medium text-green-700">
                            ✓
                          </div>
                          <span className="text-gray-600 dark:text-gray-400">
                            {rs.users?.display_name || "不明"}
                          </span>
                        </div>
                        <span className="text-gray-400">{formatDateTime(rs.read_at)}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* コメント一覧 */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">コメント</h2>
          {comments.length === 0 ? (
            <p className="py-2 text-center text-xs text-gray-400">まだコメントはありません</p>
          ) : (
            comments.map((comment) => {
              const commentAuthor = comment.users?.display_name || "不明";
              return (
                <div key={comment.id} className="flex gap-2">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {commentAuthor.charAt(0)}
                  </div>
                  <div className="flex-1 rounded-xl bg-gray-100 px-3 py-2 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {commentAuthor}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatDateTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{comment.body}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* コメント入力 */}
        <div className="sticky bottom-20 flex gap-2 rounded-xl bg-white p-2 shadow-lg dark:bg-gray-900">
          <input
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="コメントを入力..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleComment()}
            disabled={isSubmittingComment}
          />
          <Button
            size="icon"
            className="h-10 w-10 rounded-full"
            disabled={!commentText.trim() || isSubmittingComment}
            onClick={handleComment}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
