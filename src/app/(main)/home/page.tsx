"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { getLatestPosts, getUnreadCount } from "@/lib/supabase/queries/posts";
import { supabase } from "@/lib/supabase/client";
import type { PostPriority } from "@/types";

// デモデータ
const UPCOMING_EVENTS = [
  {
    id: "1",
    title: "通常練習",
    event_type: "practice" as const,
    start_at: "2026-04-05T09:00:00",
    location: "中央公園グラウンド",
  },
  {
    id: "2",
    title: "練習試合 vs 東チーム",
    event_type: "game" as const,
    start_at: "2026-04-06T10:00:00",
    location: "市民球場",
  },
  {
    id: "3",
    title: "通常練習",
    event_type: "practice" as const,
    start_at: "2026-04-12T09:00:00",
    location: "中央公園グラウンド",
  },
];

const TEAM_CHALLENGE = {
  title: "チーム全員で100本ノック達成！",
  current: 67,
  target: 100,
};

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  practice: { label: "練習", className: "bg-green-100 text-green-700" },
  game: { label: "試合", className: "bg-orange-100 text-orange-700" },
  admin: { label: "事務連絡", className: "bg-blue-100 text-blue-700" },
  accounting: { label: "会計", className: "bg-purple-100 text-purple-700" },
  other: { label: "その他", className: "bg-gray-100 text-gray-700" },
};

const PRIORITY_CONFIG: Record<
  PostPriority,
  { label: string; variant: "important" | "urgent" | "default" }
> = {
  normal: { label: "通常", variant: "default" },
  important: { label: "重要", variant: "important" },
  urgent: { label: "緊急", variant: "urgent" },
};

interface LatestPost {
  id: string;
  title: string;
  priority: PostPriority;
  category: string;
  created_at: string;
  users: { display_name: string; avatar_url: string | null } | null;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[date.getDay()];
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month}/${day}（${weekday}）${hours}:${minutes}`;
}

function formatPostDate(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}日前`;
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function EventTypeBadge({ type }: { type: string }) {
  if (type === "game") return <Badge variant="game">試合</Badge>;
  if (type === "practice") return <Badge variant="practice">練習</Badge>;
  return <Badge>その他</Badge>;
}

export default function HomePage() {
  const { currentTeam, isLoading: teamLoading } = useCurrentTeam();
  const [latestPosts, setLatestPosts] = useState<LatestPost[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchPosts = useCallback(async () => {
    if (!currentTeam) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [posts, count] = await Promise.all([
        getLatestPosts(currentTeam.id, 3),
        getUnreadCount(currentTeam.id, user.id),
      ]);
      setLatestPosts(posts as unknown as LatestPost[]);
      setUnreadCount(count);
    } catch {
      // ホーム画面ではエラーを静かに処理
    }
  }, [currentTeam]);

  useEffect(() => {
    if (!teamLoading && currentTeam) {
      fetchPosts();
    }
  }, [teamLoading, currentTeam, fetchPosts]);

  return (
    <div className="space-y-6 p-4">
      {/* 直近の予定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>直近の予定</CardTitle>
            <Link
              href="/calendar"
              className="text-xs font-medium text-green-600"
            >
              すべて見る
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {UPCOMING_EVENTS.map((event) => (
              <Link
                key={event.id}
                href={`/calendar/${event.id}`}
                className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
              >
                <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-50">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <EventTypeBadge type={event.event_type} />
                    <span className="truncate text-sm font-medium text-gray-900">
                      {event.title}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {formatDate(event.start_at)}
                  </p>
                  {event.location && (
                    <p className="text-xs text-gray-400">{event.location}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 最新の連絡 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>最新の連絡</CardTitle>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <Link
              href="/posts"
              className="text-xs font-medium text-green-600"
            >
              すべて見る
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {latestPosts.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">
                連絡はありません
              </p>
            ) : (
              latestPosts.map((post) => {
                const priorityCfg = PRIORITY_CONFIG[post.priority];
                const categoryCfg = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.other;
                return (
                  <Link
                    key={post.id}
                    href={`/posts/${post.id}`}
                    className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                  >
                    <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50">
                      <svg
                        className="h-5 w-5 text-orange-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {post.priority !== "normal" && (
                          <Badge variant={priorityCfg.variant}>{priorityCfg.label}</Badge>
                        )}
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${categoryCfg.className}`}>
                          {categoryCfg.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium text-gray-900">
                        {post.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {post.users?.display_name ?? "不明"} · {formatPostDate(post.created_at)}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* チームチャレンジ */}
      <Card>
        <CardHeader>
          <CardTitle>チームチャレンジ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">{TEAM_CHALLENGE.title}</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {TEAM_CHALLENGE.current} / {TEAM_CHALLENGE.target}
              </span>
              <span>
                {Math.round(
                  (TEAM_CHALLENGE.current / TEAM_CHALLENGE.target) * 100
                )}
                %
              </span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{
                  width: `${(TEAM_CHALLENGE.current / TEAM_CHALLENGE.target) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
