"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PostPriority } from "@/types";

// デモデータ
const DEMO_POSTS = [
  {
    id: "1",
    title: "【重要】4/6 練習試合の集合時間変更",
    body: "4/6の練習試合ですが、集合時間が9:00から8:30に変更になりました。...",
    priority: "important" as PostPriority,
    category: "schedule",
    author: { display_name: "山本監督" },
    created_at: "2026-03-29T18:00:00",
    comment_count: 3,
    reaction_count: 12,
    is_read: false,
  },
  {
    id: "2",
    title: "4月の練習スケジュールについて",
    body: "4月の練習スケジュールを共有します。基本的に毎週土曜日の午前中となります。...",
    priority: "normal" as PostPriority,
    category: "schedule",
    author: { display_name: "山本監督" },
    created_at: "2026-03-28T10:00:00",
    comment_count: 5,
    reaction_count: 8,
    is_read: true,
  },
  {
    id: "3",
    title: "【緊急】明日の練習は中止です",
    body: "明日3/30の練習は天候不良のため中止とします。次回の練習は4/5です。",
    priority: "urgent" as PostPriority,
    category: "general",
    author: { display_name: "山本監督" },
    created_at: "2026-03-29T20:00:00",
    comment_count: 1,
    reaction_count: 15,
    is_read: false,
  },
  {
    id: "4",
    title: "春季大会の結果報告",
    body: "先日の春季大会では準優勝という素晴らしい結果でした！...",
    priority: "normal" as PostPriority,
    category: "report",
    author: { display_name: "田中コーチ" },
    created_at: "2026-03-25T15:00:00",
    comment_count: 10,
    reaction_count: 25,
    is_read: true,
  },
];

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

export default function PostsPage() {
  // 重要度でソート（緊急 > 重要 > 通常）、同一重要度内は新しい順
  const sortedPosts = [...DEMO_POSTS].sort((a, b) => {
    const priorityOrder = { urgent: 0, important: 1, normal: 2 };
    const pa = priorityOrder[a.priority];
    const pb = priorityOrder[b.priority];
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">連絡</h2>
        <Link href="/posts/create">
          <Button size="sm">+ 投稿</Button>
        </Link>
      </div>

      {/* タイムライン */}
      <div className="space-y-2 p-4">
        {sortedPosts.map((post) => {
          const priorityConfig = PRIORITY_CONFIG[post.priority];
          return (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <Card
                className={`p-4 transition-colors hover:bg-gray-50 ${priorityConfig.borderColor} ${!post.is_read ? "bg-green-50/50" : ""}`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {post.priority !== "normal" && (
                        <Badge variant={priorityConfig.variant}>
                          {priorityConfig.label}
                        </Badge>
                      )}
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {post.title}
                      </h3>
                    </div>
                    {!post.is_read && (
                      <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                    )}
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2">
                    {post.body}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span>{post.author.display_name}</span>
                      <span>{timeAgo(post.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {post.reaction_count > 0 && (
                        <span className="flex items-center gap-0.5">
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
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
                          {post.reaction_count}
                        </span>
                      )}
                      {post.comment_count > 0 && (
                        <span className="flex items-center gap-0.5">
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z"
                            />
                          </svg>
                          {post.comment_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
