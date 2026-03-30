"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// デモデータ
const DEMO_ALBUM = {
  id: "1",
  title: "春季大会 2026",
  description: "春季大会の写真集",
  event_title: "春季大会",
};

const DEMO_PHOTOS = Array.from({ length: 12 }, (_, i) => ({
  id: `photo-${i + 1}`,
  photo_url: "",
  thumbnail_url: "",
  caption: i === 0 ? "開会式" : i === 3 ? "ナイスプレー！" : undefined,
  uploaded_by: "山本監督",
  created_at: "2026-03-20T10:00:00",
  like_count: Math.floor(Math.random() * 10),
  is_liked: i % 3 === 0,
}));

export default function AlbumDetailPage() {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [photos, setPhotos] = useState(DEMO_PHOTOS);

  const toggleLike = (index: number) => {
    setPhotos((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              is_liked: !p.is_liked,
              like_count: p.is_liked ? p.like_count - 1 : p.like_count + 1,
            }
          : p
      )
    );
  };

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/albums" className="text-gray-400">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </Link>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {DEMO_ALBUM.title}
              </h2>
              {DEMO_ALBUM.event_title && (
                <Badge variant="practice" className="mt-0.5 text-[10px]">
                  {DEMO_ALBUM.event_title}
                </Badge>
              )}
            </div>
          </div>
          <Link href={`/albums/upload?albumId=${DEMO_ALBUM.id}`}>
            <Button size="sm" variant="outline">
              + 追加
            </Button>
          </Link>
        </div>
        {DEMO_ALBUM.description && (
          <p className="mt-2 text-xs text-gray-500">{DEMO_ALBUM.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">{photos.length}枚の写真</p>
      </div>

      {/* グリッド表示（3列） */}
      <div className="grid grid-cols-3 gap-0.5 p-0.5">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(index)}
            className="group relative aspect-square bg-gray-100"
          >
            <div className="flex h-full w-full items-center justify-center">
              <svg
                className="h-8 w-8 text-gray-300"
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
            {/* いいね数 */}
            {photo.like_count > 0 && (
              <div className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5">
                <svg
                  className="h-3 w-3 text-white"
                  fill={photo.is_liked ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                  />
                </svg>
                <span className="text-[10px] text-white">{photo.like_count}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ライトボックス */}
      {selectedPhoto !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          {/* 閉じるボタン */}
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* 前へ */}
          {selectedPhoto > 0 && (
            <button
              onClick={() => setSelectedPhoto(selectedPhoto - 1)}
              className="absolute left-2 z-10 rounded-full bg-black/50 p-2 text-white"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
            </button>
          )}

          {/* 次へ */}
          {selectedPhoto < photos.length - 1 && (
            <button
              onClick={() => setSelectedPhoto(selectedPhoto + 1)}
              className="absolute right-2 z-10 rounded-full bg-black/50 p-2 text-white"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          )}

          {/* 写真表示エリア */}
          <div className="flex h-full w-full flex-col items-center justify-center px-12">
            <div className="flex h-64 w-full items-center justify-center rounded-lg bg-gray-800">
              <svg
                className="h-16 w-16 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                />
              </svg>
            </div>
            {/* 下部コントロール */}
            <div className="mt-4 flex w-full items-center justify-between">
              <div>
                {photos[selectedPhoto].caption && (
                  <p className="text-sm text-white">
                    {photos[selectedPhoto].caption}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {photos[selectedPhoto].uploaded_by} ·{" "}
                  {selectedPhoto + 1}/{photos.length}
                </p>
              </div>
              <button
                onClick={() => toggleLike(selectedPhoto)}
                className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5"
              >
                <svg
                  className={`h-5 w-5 ${photos[selectedPhoto].is_liked ? "text-red-500" : "text-white"}`}
                  fill={photos[selectedPhoto].is_liked ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                  />
                </svg>
                <span className="text-sm text-white">
                  {photos[selectedPhoto].like_count}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
