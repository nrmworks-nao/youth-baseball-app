"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const TAB_ITEMS = [
  {
    href: "/home",
    label: "ホーム",
    icon: (active: boolean) => (
      <svg
        className={cn("h-6 w-6", active ? "text-primary" : "text-muted-foreground")}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    ),
  },
  {
    href: "/calendar",
    label: "カレンダー",
    icon: (active: boolean) => (
      <svg
        className={cn("h-6 w-6", active ? "text-primary" : "text-muted-foreground")}
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
    ),
  },
  {
    href: "/posts",
    label: "連絡",
    icon: (active: boolean) => (
      <svg
        className={cn("h-6 w-6", active ? "text-primary" : "text-muted-foreground")}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
        />
      </svg>
    ),
  },
  {
    href: "/menu",
    label: "メニュー",
    icon: (active: boolean) => (
      <svg
        className={cn("h-6 w-6", active ? "text-primary" : "text-muted-foreground")}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
        />
      </svg>
    ),
  },
];

const SIDEBAR_ITEMS = [
  { href: "/home", label: "ホーム" },
  { href: "/calendar", label: "カレンダー" },
  { href: "/posts", label: "連絡" },
  { href: "/players", label: "選手一覧" },
  { href: "/games", label: "試合" },
  { href: "/kids", label: "キッズ" },
  { href: "/albums", label: "アルバム" },
  { href: "/ranking", label: "ランキング" },
  { href: "/accounting", label: "会計" },
  { href: "/shop", label: "ショップ" },
  { href: "/teams/search", label: "チーム検索" },
  { href: "/settings", label: "設定" },
  { href: "/mypage", label: "マイページ" },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-background">
        {/* PC用サイドバー */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-border lg:bg-card">
          <div className="flex h-14 items-center px-4 border-b border-border">
            <h1 className="text-base font-bold text-foreground">
              Youth Baseball Team Hub
            </h1>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="border-t border-border p-3">
            <ThemeToggle />
          </div>
        </aside>

        {/* メインコンテンツエリア */}
        <div className="flex flex-1 flex-col lg:pl-64">
          {/* ヘッダー */}
          <header className="sticky top-0 z-30 border-b border-border bg-card">
            <div className="flex h-14 items-center justify-between px-4 lg:px-6">
              <h1 className="text-base font-bold text-foreground lg:hidden">
                Youth Baseball Team Hub
              </h1>
              <div className="hidden lg:block" />
              <div className="flex items-center gap-2">
                <div className="hidden lg:block">
                  <ThemeToggle />
                </div>
                <Link
                  href="/notifications"
                  className="relative flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted"
                >
                  <svg
                    className="h-6 w-6 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                    />
                  </svg>
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    3
                  </span>
                </Link>
              </div>
            </div>
          </header>

          {/* メインコンテンツ */}
          <main className="flex-1 pb-20 lg:pb-6">
            <div className="app-container">{children}</div>
          </main>

          {/* モバイル用下部タブナビゲーション */}
          <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card lg:hidden">
            <div className="flex h-16 items-center justify-around" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
              {TAB_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5"
                  >
                    {item.icon(isActive)}
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </ThemeProvider>
  );
}
