"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, EmptyState } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { getAlbums } from "@/lib/supabase/queries/albums";
import type { Album } from "@/types";

type AlbumWithMeta = Album & { event_title: string | null; photo_count: number };
type ViewMode = "event" | "month";

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split("-");
  return `${year}年${parseInt(month)}月`;
}

function getMonth(dateStr: string) {
  return dateStr.slice(0, 7); // "2026-03"
}

export default function AlbumsPage() {
  const { currentTeam, isLoading: teamLoading } = useCurrentTeam();
  const [viewMode, setViewMode] = useState<ViewMode>("event");
  const [albums, setAlbums] = useState<AlbumWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlbums = useCallback(async () => {
    if (!currentTeam) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAlbums(currentTeam.id);
      setAlbums(data);
    } catch (err) {
      console.error("アルバム取得エラー:", err);
      setError("アルバムの読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (!teamLoading) {
      fetchAlbums();
    }
  }, [teamLoading, fetchAlbums]);

  // 月別グルーピング
  const albumsByMonth = albums.reduce<Record<string, AlbumWithMeta[]>>(
    (acc, album) => {
      const key = getMonth(album.created_at);
      if (!acc[key]) acc[key] = [];
      acc[key].push(album);
      return acc;
    },
    {}
  );

  // イベント別
  const eventAlbums = albums.filter((a) => a.event_id);
  const otherAlbums = albums.filter((a) => !a.event_id);

  if (teamLoading || isLoading) {
    return <Loading text="アルバムを読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchAlbums} />;
  }

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">アルバム</h2>
        <Link href="/albums/upload">
          <Button size="sm">+ アップロード</Button>
        </Link>
      </div>

      {/* 表示切替 */}
      <div className="flex gap-2 bg-white px-4 py-2">
        <button
          onClick={() => setViewMode("event")}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            viewMode === "event"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          イベント別
        </button>
        <button
          onClick={() => setViewMode("month")}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            viewMode === "month"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          月別
        </button>
      </div>

      {/* アルバム一覧 */}
      <div className="p-4">
        {albums.length === 0 ? (
          <EmptyState
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                />
              </svg>
            }
            title="アルバムがありません"
            description="写真をアップロードして最初のアルバムを作りましょう"
          />
        ) : viewMode === "event" ? (
          <div className="space-y-4">
            {eventAlbums.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold text-gray-500">
                  イベント
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {eventAlbums.map((album) => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </div>
              </div>
            )}
            {otherAlbums.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold text-gray-500">
                  その他
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {otherAlbums.map((album) => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(albumsByMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([month, monthAlbums]) => (
                <div key={month}>
                  <h3 className="mb-2 text-xs font-semibold text-gray-500">
                    {formatMonth(month)}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {monthAlbums.map((album) => (
                      <AlbumCard key={album.id} album={album} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AlbumCard({ album }: { album: AlbumWithMeta }) {
  return (
    <Link href={`/albums/${album.id}`}>
      <Card className="overflow-hidden transition-colors hover:bg-gray-50">
        {/* サムネイル */}
        <div className="relative flex h-28 items-center justify-center bg-gray-100">
          {album.cover_photo_url ? (
            <Image
              src={album.cover_photo_url}
              alt={album.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 200px"
            />
          ) : (
            <svg
              className="h-10 w-10 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
              />
            </svg>
          )}
        </div>
        <div className="p-2">
          <p className="truncate text-sm font-medium text-gray-900">
            {album.title}
          </p>
          <div className="mt-1 flex items-center gap-2">
            {album.event_title && (
              <Badge variant="practice" className="text-[10px]">
                {album.event_title}
              </Badge>
            )}
            <span className="text-xs text-gray-400">
              {album.photo_count}枚
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
