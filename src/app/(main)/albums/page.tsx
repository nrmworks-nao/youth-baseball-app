"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// デモデータ
const DEMO_ALBUMS = [
  {
    id: "1",
    title: "春季大会 2026",
    description: "春季大会の写真集",
    cover_photo_url: null,
    event_id: "e1",
    event_title: "春季大会",
    photo_count: 45,
    created_at: "2026-03-20T10:00:00",
    month: "2026-03",
  },
  {
    id: "2",
    title: "3月 通常練習",
    description: "3月の練習風景",
    cover_photo_url: null,
    event_id: null,
    event_title: null,
    photo_count: 32,
    created_at: "2026-03-15T10:00:00",
    month: "2026-03",
  },
  {
    id: "3",
    title: "卒団式 2026",
    description: "6年生の卒団式",
    cover_photo_url: null,
    event_id: "e2",
    event_title: "卒団式",
    photo_count: 68,
    created_at: "2026-03-10T10:00:00",
    month: "2026-03",
  },
  {
    id: "4",
    title: "2月 練習試合",
    description: "vs 東チーム",
    cover_photo_url: null,
    event_id: "e3",
    event_title: "練習試合 vs 東チーム",
    photo_count: 28,
    created_at: "2026-02-20T10:00:00",
    month: "2026-02",
  },
  {
    id: "5",
    title: "2月 通常練習",
    description: "",
    cover_photo_url: null,
    event_id: null,
    event_title: null,
    photo_count: 15,
    created_at: "2026-02-10T10:00:00",
    month: "2026-02",
  },
];

type ViewMode = "event" | "month";

function formatMonth(monthStr: string) {
  const [year, month] = monthStr.split("-");
  return `${year}年${parseInt(month)}月`;
}

export default function AlbumsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("event");

  const albumsByMonth = DEMO_ALBUMS.reduce<Record<string, typeof DEMO_ALBUMS>>(
    (acc, album) => {
      const key = album.month;
      if (!acc[key]) acc[key] = [];
      acc[key].push(album);
      return acc;
    },
    {}
  );

  const eventAlbums = DEMO_ALBUMS.filter((a) => a.event_id);
  const otherAlbums = DEMO_ALBUMS.filter((a) => !a.event_id);

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
        {viewMode === "event" ? (
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
              .map(([month, albums]) => (
                <div key={month}>
                  <h3 className="mb-2 text-xs font-semibold text-gray-500">
                    {formatMonth(month)}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {albums.map((album) => (
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

function AlbumCard({
  album,
}: {
  album: (typeof DEMO_ALBUMS)[number];
}) {
  return (
    <Link href={`/albums/${album.id}`}>
      <Card className="overflow-hidden transition-colors hover:bg-gray-50">
        {/* サムネイル */}
        <div className="flex h-28 items-center justify-center bg-gray-100">
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
