"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { getUnreadCount } from "@/lib/supabase/queries/posts";
import { getUnreadNotificationCount } from "@/lib/supabase/queries/notifications";
import { supabase } from "@/lib/supabase/client";

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

function TeamSwitcher() {
  const { currentTeam, teams, switchTeam, isLoading } = useCurrentTeam();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading || !currentTeam || teams.length <= 1) {
    return currentTeam ? (
      <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
        {currentTeam.name}
      </span>
    ) : null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <span className="truncate max-w-[160px]">{currentTeam.name}</span>
        <svg
          className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-border bg-card shadow-lg">
          <div className="p-1">
            {teams.map((t) => (
              <button
                key={t.team.id}
                onClick={() => {
                  if (t.team.id !== currentTeam.id) {
                    switchTeam(t.team.id);
                  }
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                  t.team.id === currentTeam.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <div>
                  <p className="font-medium">{t.team.name}</p>
                  <p className="text-xs text-muted-foreground">{t.display_title}</p>
                </div>
                {t.team.id === currentTeam.id && (
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function useUnreadPostCount() {
  const { currentTeam } = useCurrentTeam();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!currentTeam) return;
    let cancelled = false;

    async function fetch() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const c = await getUnreadCount(currentTeam!.id, user.id);
        if (!cancelled) setCount(c);
      } catch {
        // ignore
      }
    }
    fetch();
    // ポーリング: 60秒ごとに再取得
    const interval = setInterval(fetch, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [currentTeam]);

  return count;
}

function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const c = await getUnreadNotificationCount(user.id);
        if (!cancelled) setCount(c);
      } catch {
        // ignore
      }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return count;
}

function useTeamMembershipGuard() {
  const { teams, isLoading } = useCurrentTeam();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    console.log("TeamMembershipGuard - teams:", teams.length, "isLoading:", isLoading);
    if (teams.length === 0) {
      // ユーザーがどのチームにも所属していない場合、オンボーディングへリダイレクト
      console.log("TeamMembershipGuard - チーム未所属、/onboardingへリダイレクト");
      router.replace("/onboarding");
    }
  }, [isLoading, teams, router]);

  return { isLoading, hasTeam: teams.length > 0 };
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const unreadPostCount = useUnreadPostCount();
  const unreadNotificationCount = useUnreadNotificationCount();
  const { isLoading: guardLoading, hasTeam } = useTeamMembershipGuard();

  if (guardLoading || !hasTeam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

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
          <div className="border-b border-border px-3 py-2">
            <TeamSwitcher />
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const showBadge = item.href === "/posts" && unreadPostCount > 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {item.label}
                      {showBadge && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                          {unreadPostCount > 99 ? "99+" : unreadPostCount}
                        </span>
                      )}
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
              <div className="lg:hidden">
                <TeamSwitcher />
              </div>
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
                  {unreadNotificationCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                    </span>
                  )}
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
                const showBadge = item.href === "/posts" && unreadPostCount > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5"
                  >
                    {item.icon(isActive)}
                    {showBadge && (
                      <span className="absolute right-1 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                        {unreadPostCount > 99 ? "99+" : unreadPostCount}
                      </span>
                    )}
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
