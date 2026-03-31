"use client";

import Link from "next/link";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { Loading } from "@/components/ui/loading";
import { cn } from "@/lib/utils/cn";

const MENU_ITEMS = [
  { href: "/players", label: "選手一覧", description: "チームの選手を管理" },
  { href: "/games", label: "試合", description: "試合結果・スコア" },
  { href: "/kids", label: "キッズ", description: "子ども向け機能" },
  { href: "/albums", label: "アルバム", description: "写真・アルバム管理" },
  { href: "/ranking", label: "ランキング", description: "成績ランキング" },
  { href: "/accounting", label: "会計", description: "会費・請求管理" },
  { href: "/shop", label: "ショップ", description: "おすすめ商品" },
  { href: "/teams/search", label: "チーム検索", description: "他チームを探す" },
  { href: "/settings", label: "設定", description: "チーム設定・招待" },
  { href: "/mypage", label: "マイページ", description: "プロフィール・通知設定" },
];

export default function MenuPage() {
  const { currentTeam, isLoading } = useCurrentTeam();

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
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
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
      </div>
    </div>
  );
}
