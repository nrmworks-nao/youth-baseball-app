"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Trophy,
  Star,
  Camera,
  BarChart3,
  Wallet,
  ShoppingBag,
  Search,
  Settings,
  User,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { Loading } from "@/components/ui/loading";
import { cn } from "@/lib/utils/cn";
import { supabase } from "@/lib/supabase/client";
import { isLiffInitialized } from "@/lib/line/liff";
import liff from "@line/liff";

const MENU_ITEMS: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}[] = [
  { href: "/players", label: "選手一覧", description: "チームの選手を管理", icon: Users, iconColor: "text-blue-500", bgColor: "bg-blue-50" },
  { href: "/games", label: "試合", description: "試合結果・スコア", icon: Trophy, iconColor: "text-orange-500", bgColor: "bg-orange-50" },
  { href: "/kids", label: "キッズ", description: "子ども向け機能", icon: Star, iconColor: "text-yellow-500", bgColor: "bg-yellow-50" },
  { href: "/albums", label: "アルバム", description: "写真・アルバム管理", icon: Camera, iconColor: "text-pink-500", bgColor: "bg-pink-50" },
  { href: "/ranking", label: "ランキング", description: "成績ランキング", icon: BarChart3, iconColor: "text-purple-500", bgColor: "bg-purple-50" },
  { href: "/accounting", label: "会計", description: "会費・請求管理", icon: Wallet, iconColor: "text-green-500", bgColor: "bg-green-50" },
  { href: "/shop", label: "ショップ", description: "おすすめ商品", icon: ShoppingBag, iconColor: "text-red-500", bgColor: "bg-red-50" },
  { href: "/teams/search", label: "チーム検索", description: "他チームを探す", icon: Search, iconColor: "text-cyan-500", bgColor: "bg-cyan-50" },
  { href: "/settings", label: "設定", description: "チーム設定・招待", icon: Settings, iconColor: "text-gray-500", bgColor: "bg-gray-50" },
  { href: "/mypage", label: "マイページ", description: "プロフィール・通知設定", icon: User, iconColor: "text-indigo-500", bgColor: "bg-indigo-50" },
];

export default function MenuPage() {
  const { currentTeam, isLoading } = useCurrentTeam();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();

      // Cookie削除
      document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      // LIFF初期化済みの場合はLINEもログアウト
      try {
        if (isLiffInitialized() && liff.isLoggedIn()) {
          liff.logout();
        }
      } catch {
        // LIFFログアウト失敗は無視
      }

      window.location.href = "/login";
    } catch {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return <Loading text="読み込み中..." />;
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">メニュー</h2>
        {currentTeam && (
          <p className="text-xs text-muted-foreground">{currentTeam.name}</p>
        )}
      </div>
      <div className="p-4">
        <div className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-lg px-4 py-3 transition-colors",
                "hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-full", item.bgColor)}>
                  <item.icon className={cn("w-6 h-6", item.iconColor)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <svg
                className="h-4 w-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>

        {/* セパレーター */}
        <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

        {/* ログアウト */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "flex w-full items-center rounded-lg px-4 py-3 transition-colors",
            "hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-50 p-2 dark:bg-red-950">
              <LogOut className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {isLoggingOut ? "ログアウト中..." : "ログアウト"}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
