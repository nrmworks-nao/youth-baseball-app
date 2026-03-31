"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay, EmptyState } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { supabase } from "@/lib/supabase/client";
import {
  getAlbum,
  getAlbumPhotos,
  likePhoto,
  unlikePhoto,
  deleteAlbumPhoto,
  deleteAlbumPhotos,
  extractStoragePath,
} from "@/lib/supabase/queries/albums";
import type { Album, AlbumPhoto } from "@/types";

type PhotoWithMeta = AlbumPhoto & {
  uploader_name: string;
  like_count: number;
  is_liked: boolean;
};

export default function AlbumDetailPage() {
  const params = useParams();
  const albumId = params.albumId as string;
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { isAdmin, canManagePhotos } = usePermission(
    currentMembership?.permission_group ?? null
  );

  const [album, setAlbum] = useState<(Album & { event_title: string | null }) | null>(null);
  const [photos, setPhotos] = useState<PhotoWithMeta[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // 選択モード（一括削除用）
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // 削除確認ダイアログ
  const [deleteTarget, setDeleteTarget] = useState<PhotoWithMeta | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentTeam) return;
    setIsLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");
      setUserId(user.id);

      const [albumData, photosData] = await Promise.all([
        getAlbum(albumId),
        getAlbumPhotos(albumId, user.id),
      ]);
      setAlbum(albumData);
      setPhotos(photosData);
    } catch (err) {
      console.error("データ取得エラー:", err);
      setError("データの読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam, albumId]);

  useEffect(() => {
    if (!teamLoading) {
      fetchData();
    }
  }, [teamLoading, fetchData]);

  const handleToggleLike = async (index: number) => {
    if (!currentTeam || !userId) return;
    const photo = photos[index];

    // 楽観的更新
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

    try {
      if (photo.is_liked) {
        await unlikePhoto(photo.id, userId);
      } else {
        await likePhoto(photo.id, currentTeam.id, userId);
      }
    } catch (err) {
      console.error("いいねエラー:", err);
      // ロールバック
      setPhotos((prev) =>
        prev.map((p, i) =>
          i === index
            ? {
                ...p,
                is_liked: photo.is_liked,
                like_count: photo.like_count,
              }
            : p
        )
      );
    }
  };

  const handleDeletePhoto = async (photo: PhotoWithMeta) => {
    try {
      setIsDeleting(true);
      const storagePath = extractStoragePath(photo.photo_url);
      await deleteAlbumPhoto(photo.id, storagePath);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setDeleteTarget(null);
      if (selectedPhoto !== null) setSelectedPhoto(null);
    } catch (err) {
      console.error("削除エラー:", err);
      setError("写真の削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      setIsDeleting(true);
      const targets = photos
        .filter((p) => selectedIds.has(p.id))
        .map((p) => ({
          id: p.id,
          storagePath: extractStoragePath(p.photo_url),
        }));
      await deleteAlbumPhotos(targets);
      setPhotos((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch (err) {
      console.error("一括削除エラー:", err);
      setError("一括削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectPhoto = (photoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  const canDeletePhoto = (photo: PhotoWithMeta) => {
    if (!userId) return false;
    return photo.uploaded_by === userId || isAdmin() || canManagePhotos();
  };

  if (teamLoading || isLoading) {
    return <Loading text="アルバムを読み込み中..." />;
  }

  if (error && !album) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  if (!album) {
    return <ErrorDisplay title="アルバムが見つかりません" />;
  }

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
                {album.title}
              </h2>
              {album.event_title && (
                <Badge variant="practice" className="mt-0.5 text-[10px]">
                  {album.event_title}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(isAdmin() || canManagePhotos()) && (
              <Button
                size="sm"
                variant={selectMode ? "default" : "outline"}
                onClick={() => {
                  setSelectMode(!selectMode);
                  setSelectedIds(new Set());
                }}
              >
                {selectMode ? "キャンセル" : "選択"}
              </Button>
            )}
            <Link href={`/albums/upload?albumId=${album.id}`}>
              <Button size="sm" variant="outline">
                + 追加
              </Button>
            </Link>
          </div>
        </div>
        {album.description && (
          <p className="mt-2 text-xs text-gray-500">{album.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">{photos.length}枚の写真</p>
      </div>

      {/* 選択モードのアクションバー */}
      {selectMode && (
        <div className="flex items-center justify-between bg-red-50 px-4 py-2">
          <span className="text-sm text-red-700">
            {selectedIds.size}枚 選択中
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0 || isDeleting}
          >
            {isDeleting ? "削除中..." : "選択した写真を削除"}
          </Button>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="mx-4 mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-1 text-xs text-red-500 underline"
          >
            閉じる
          </button>
        </div>
      )}

      {/* グリッド表示（3列） */}
      {photos.length === 0 ? (
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
          title="写真がありません"
          description="「+ 追加」から写真をアップロードしましょう"
        />
      ) : (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => {
                if (selectMode) {
                  toggleSelectPhoto(photo.id);
                } else {
                  setSelectedPhoto(index);
                }
              }}
              className="group relative aspect-square bg-gray-100"
            >
              <Image
                src={photo.photo_url}
                alt={photo.caption ?? ""}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 200px"
              />
              {/* 選択モードのチェック */}
              {selectMode && (
                <div
                  className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    selectedIds.has(photo.id)
                      ? "border-green-600 bg-green-600"
                      : "border-white bg-black/30"
                  }`}
                >
                  {selectedIds.has(photo.id) && (
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  )}
                </div>
              )}
              {/* いいね数 */}
              {!selectMode && photo.like_count > 0 && (
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
                  <span className="text-[10px] text-white">
                    {photo.like_count}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ライトボックス */}
      {selectedPhoto !== null && photos[selectedPhoto] && (
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
            <div className="relative h-[60vh] w-full">
              <Image
                src={photos[selectedPhoto].photo_url}
                alt={photos[selectedPhoto].caption ?? ""}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
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
                  {photos[selectedPhoto].uploader_name} ・{" "}
                  {selectedPhoto + 1}/{photos.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* 削除ボタン */}
                {canDeletePhoto(photos[selectedPhoto]) && (
                  <button
                    onClick={() => setDeleteTarget(photos[selectedPhoto])}
                    className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5"
                  >
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                )}
                {/* いいねボタン */}
                <button
                  onClick={() => handleToggleLike(selectedPhoto)}
                  className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5"
                >
                  <svg
                    className={`h-5 w-5 ${photos[selectedPhoto].is_liked ? "text-red-500" : "text-white"}`}
                    fill={
                      photos[selectedPhoto].is_liked ? "currentColor" : "none"
                    }
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
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6">
            <h3 className="text-base font-bold text-gray-900">
              写真を削除しますか？
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              この操作は取り消せません。写真は完全に削除されます。
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleDeletePhoto(deleteTarget)}
                disabled={isDeleting}
              >
                {isDeleting ? "削除中..." : "削除する"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
