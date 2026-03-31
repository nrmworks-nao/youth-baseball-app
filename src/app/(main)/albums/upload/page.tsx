"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { supabase } from "@/lib/supabase/client";
import {
  getAlbums,
  createAlbum,
  createAlbumPhoto,
  updateAlbum,
} from "@/lib/supabase/queries/albums";
import { getEvents } from "@/lib/supabase/queries/events";
import type { Album, Event } from "@/types";

const MAX_FILES = 20;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];
const MAX_DIMENSION = 2048;

interface FilePreview {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  errorMessage?: string;
}

/** 画像をリサイズする（長辺2048px） */
async function resizeImage(file: File): Promise<Blob> {
  // HEIC/HEIFはそのままアップロード（ブラウザ側での変換は困難）
  if (file.type === "image/heic" || file.type === "image/heif") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const { width, height } = img;
      // リサイズ不要な場合
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve(file);
        return;
      }

      const scale = MAX_DIMENSION / Math.max(width, height);
      const newWidth = Math.round(width * scale);
      const newHeight = Math.round(height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = URL.createObjectURL(file);
  });
}

/** EXIF情報を削除（Canvas経由で再描画することで自動的に削除される） */
// resizeImage関数内のCanvas処理でEXIFは削除される
// TODO: HEICファイルのEXIF削除は別途対応が必要

export default function AlbumUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedAlbumId = searchParams.get("albumId");

  const { currentTeam, isLoading: teamLoading } = useCurrentTeam();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState(
    preselectedAlbumId ?? ""
  );
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumDate, setNewAlbumDate] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [createNew, setCreateNew] = useState(!preselectedAlbumId);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchData = useCallback(async () => {
    if (!currentTeam) return;
    setIsDataLoading(true);
    try {
      const [albumsData, eventsData] = await Promise.all([
        getAlbums(currentTeam.id),
        getEvents(currentTeam.id),
      ]);
      setAlbums(albumsData);
      setEvents(eventsData);
    } catch (err) {
      console.error("データ取得エラー:", err);
      setError("データの読み込みに失敗しました");
    } finally {
      setIsDataLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (!teamLoading) {
      fetchData();
    }
  }, [teamLoading, fetchData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);

    const validFiles = selectedFiles.filter((f) =>
      ACCEPTED_TYPES.includes(f.type)
    );

    const remaining = MAX_FILES - files.length;
    const toAdd = validFiles.slice(0, remaining);

    const newPreviews: FilePreview[] = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    if (!selectedAlbumId && !newAlbumTitle) return;
    if (!currentTeam) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      // 新規アルバム作成 or 既存アルバム使用
      let albumId = selectedAlbumId;
      if (createNew && newAlbumTitle) {
        const newAlbum = await createAlbum({
          team_id: currentTeam.id,
          title: newAlbumTitle,
          event_id: selectedEventId || undefined,
          created_by: user.id,
        });
        albumId = newAlbum.id;
      }

      if (!albumId) throw new Error("アルバムが選択されていません");

      let firstPhotoUrl: string | null = null;
      const failedFiles: string[] = [];

      // 各画像を順番にアップロード
      for (let i = 0; i < files.length; i++) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "uploading" } : f
          )
        );

        try {
          // リサイズ（EXIF削除含む）
          const resized = await resizeImage(files[i].file);

          // ファイル名生成
          const ext =
            files[i].file.type === "image/png" ? "png" : "jpg";
          const filename = `${Date.now()}_${i}.${ext}`;
          const storagePath = `${currentTeam.id}/${albumId}/${filename}`;

          // Supabase Storageにアップロード
          const { error: uploadError } = await supabase.storage
            .from("albums")
            .upload(storagePath, resized, {
              contentType: ext === "png" ? "image/png" : "image/jpeg",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          // publicURLを取得
          const {
            data: { publicUrl },
          } = supabase.storage.from("albums").getPublicUrl(storagePath);

          // DBレコード作成
          await createAlbumPhoto({
            album_id: albumId,
            team_id: currentTeam.id,
            photo_url: publicUrl,
            uploaded_by: user.id,
          });

          if (i === 0) firstPhotoUrl = publicUrl;

          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: "done" } : f
            )
          );
        } catch (err) {
          console.error(`写真${i + 1}のアップロード失敗:`, err);
          failedFiles.push(files[i].file.name);
          setFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: "error",
                    errorMessage: "アップロード失敗",
                  }
                : f
            )
          );
        }

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // カバー画像を設定（先頭写真）
      if (firstPhotoUrl) {
        try {
          await updateAlbum(albumId, { cover_photo_url: firstPhotoUrl });
        } catch {
          // カバー画像の設定失敗は無視
        }
      }

      if (failedFiles.length > 0) {
        setError(
          `${failedFiles.length}枚のアップロードに失敗しました: ${failedFiles.join(", ")}`
        );
      } else {
        // 全件成功時はアルバム詳細に遷移
        router.push(`/albums/${albumId}`);
      }
    } catch (err) {
      console.error("アップロードエラー:", err);
      setError(
        err instanceof Error ? err.message : "アップロードに失敗しました"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const allDone = files.length > 0 && files.every((f) => f.status === "done");
  const hasErrors = files.some((f) => f.status === "error");
  const targetAlbumId = createNew ? null : selectedAlbumId;

  if (teamLoading || isDataLoading) {
    return <Loading text="読み込み中..." />;
  }

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
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
        <h2 className="text-base font-bold text-gray-900">写真アップロード</h2>
      </div>

      <div className="space-y-4 p-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-1 text-xs text-red-500 underline"
            >
              閉じる
            </button>
          </div>
        )}

        {/* アルバム選択 */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900">アルバムを選択</h3>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setCreateNew(false)}
              disabled={isUploading}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                !createNew
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              既存のアルバム
            </button>
            <button
              onClick={() => setCreateNew(true)}
              disabled={isUploading}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                createNew
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              新規作成
            </button>
          </div>

          {!createNew ? (
            <div className="mt-3">
              <Select
                label=""
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
                disabled={isUploading}
              >
                <option value="">アルバムを選択...</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.title}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <Input
                label="アルバム名"
                value={newAlbumTitle}
                onChange={(e) => setNewAlbumTitle(e.target.value)}
                placeholder="例: 3月 通常練習"
                disabled={isUploading}
              />
              <Input
                label="日付（任意）"
                type="date"
                value={newAlbumDate}
                onChange={(e) => setNewAlbumDate(e.target.value)}
                disabled={isUploading}
              />
              <Select
                label="イベント（任意）"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                disabled={isUploading}
              >
                <option value="">紐づけなし</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </Card>

        {/* ファイル選択 */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900">
            写真を選択（最大{MAX_FILES}枚/回）
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            JPEG / PNG / HEIC対応 ・ 自動リサイズ（長辺2048px）・ EXIF自動削除
          </p>

          <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-green-400 hover:bg-green-50/30">
            <svg
              className="h-10 w-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
              />
            </svg>
            <span className="mt-2 text-sm text-gray-500">
              タップして写真を選択
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={files.length >= MAX_FILES || isUploading}
            />
          </label>

          {files.length > 0 && (
            <p className="mt-2 text-xs text-gray-400">
              {files.length}/{MAX_FILES}枚 選択済み
            </p>
          )}
        </Card>

        {/* プレビュー */}
        {files.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-900">
              選択した写真
            </h3>

            {/* プログレスバー */}
            {isUploading && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>アップロード中...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-600 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-3 grid grid-cols-4 gap-2">
              {files.map((fp, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={fp.preview}
                    alt=""
                    className="h-full w-full rounded-lg object-cover"
                  />
                  {fp.status === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  )}
                  {fp.status === "done" && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                      <svg
                        className="h-6 w-6 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                    </div>
                  )}
                  {fp.status === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-red-500/50">
                      <svg
                        className="h-6 w-6 text-white"
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
                    </div>
                  )}
                  {fp.status === "pending" && (
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* アップロードボタン */}
        {allDone ? (
          <Link href={`/albums/${targetAlbumId ?? selectedAlbumId}`}>
            <Button className="w-full" size="lg">
              アルバムを見る
            </Button>
          </Link>
        ) : hasErrors ? (
          <div className="space-y-2">
            <p className="text-center text-sm text-red-600">
              一部の写真のアップロードに失敗しました
            </p>
            <Link href={`/albums/${targetAlbumId ?? selectedAlbumId}`}>
              <Button className="w-full" size="lg" variant="outline">
                アルバムを見る（成功分のみ）
              </Button>
            </Link>
          </div>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={handleUpload}
            disabled={
              files.length === 0 ||
              isUploading ||
              (!selectedAlbumId && !newAlbumTitle)
            }
          >
            {isUploading
              ? "アップロード中..."
              : `${files.length}枚をアップロード`}
          </Button>
        )}
      </div>
    </div>
  );
}
