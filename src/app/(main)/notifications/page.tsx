"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/supabase/queries/notifications";
import { supabase } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { AppNotification } from "@/types";

const TYPE_ICONS: Record<string, { icon: string; bg: string }> = {
  post: { icon: "💬", bg: "bg-blue-100" },
  attendance: { icon: "📋", bg: "bg-yellow-100" },
  payment: { icon: "💰", bg: "bg-green-100" },
  match_request: { icon: "⚾", bg: "bg-red-100" },
  album: { icon: "📷", bg: "bg-purple-100" },
  shop: { icon: "🛒", bg: "bg-orange-100" },
  event: { icon: "📅", bg: "bg-cyan-100" },
  general: { icon: "🔔", bg: "bg-gray-100" },
};

const NOTIFICATION_LINKS: Record<string, string> = {
  post: "/posts",
  attendance: "/calendar",
  payment: "/mypage/payments",
  match_request: "/teams/matches",
  album: "/albums",
  shop: "/shop",
  event: "/calendar",
  general: "/home",
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTap = async (notification: AppNotification) => {
    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
      } catch {
        // 既読失敗は無視
      }
    }
  };

  const markAllRead = async () => {
    if (!userId) return;
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return <Loading text="通知を読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">
          通知
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            すべて既読
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">通知はありません</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {notifications.map((notification) => {
            const typeConfig = TYPE_ICONS[notification.notification_type] ?? TYPE_ICONS.general;
            const link = notification.link ?? NOTIFICATION_LINKS[notification.notification_type] ?? "/home";
            return (
              <Link
                key={notification.id}
                href={link}
                onClick={() => handleTap(notification)}
              >
                <div
                  className={`flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
                    !notification.is_read ? "bg-green-50/50" : ""
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${typeConfig.bg}`}
                  >
                    <span className="text-lg">{typeConfig.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                      )}
                    </div>
                    {notification.body && (
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                        {notification.body}
                      </p>
                    )}
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {timeAgo(notification.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
