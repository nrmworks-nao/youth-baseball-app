"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DEMO_NOTIFICATIONS = [
  {
    id: "n1",
    title: "新しい投稿",
    body: "山本監督が「4月の練習スケジュール」を投稿しました",
    notification_type: "post",
    is_read: false,
    created_at: "2026-03-30T10:00:00",
    link: "/posts",
  },
  {
    id: "n2",
    title: "出欠未回答",
    body: "4/5 通常練習の出欠が未回答です",
    notification_type: "attendance",
    is_read: false,
    created_at: "2026-03-29T18:00:00",
    link: "/calendar",
  },
  {
    id: "n3",
    title: "会費請求",
    body: "4月会費 ¥5,000の請求が届いています",
    notification_type: "payment",
    is_read: false,
    created_at: "2026-03-29T09:00:00",
    link: "/mypage/payments",
  },
  {
    id: "n4",
    title: "練習試合申込",
    body: "東ライオンズから練習試合の申し込みが届きました",
    notification_type: "match_request",
    is_read: true,
    created_at: "2026-03-28T14:00:00",
    link: "/teams/matches",
  },
  {
    id: "n5",
    title: "アルバム更新",
    body: "「春季大会 2026」に新しい写真が追加されました",
    notification_type: "album",
    is_read: true,
    created_at: "2026-03-27T16:00:00",
    link: "/albums",
  },
  {
    id: "n6",
    title: "おすすめ商品",
    body: "山本監督がグローブをおすすめしました",
    notification_type: "shop",
    is_read: true,
    created_at: "2026-03-26T11:00:00",
    link: "/shop",
  },
];

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
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
  };

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

      <div className="divide-y divide-gray-100">
        {notifications.map((notification) => {
          const typeConfig = TYPE_ICONS[notification.notification_type] ?? TYPE_ICONS.general;
          return (
            <Link key={notification.id} href={notification.link ?? "#"}>
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
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                    {notification.body}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {timeAgo(notification.created_at)}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
