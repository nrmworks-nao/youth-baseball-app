"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

const DEMO_ALBUMS = [
  { id: "1", title: "春季大会 2026" },
  { id: "2", title: "3月 通常練習" },
  { id: "3", title: "卒団式 2026" },
];

const DEMO_EVENTS = [
  { id: "e1", title: "春季大会" },
  { id: "e2", title: "卒団式" },
  { id: "e3", title: "通常練習 4/5" },
];

const MAX_FILES = 20;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];

interface FilePreview {
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
}

export default function AlbumUploadPage() {
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [createNew, setCreateNew] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);

    // バリデーション
    const validFiles = selectedFiles.filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) return false;
      return true;
    });

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

    setIsUploading(true);

    // アップロードシミュレーション
    for (let i = 0; i < files.length; i++) {
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "uploading" } : f
        )
      );
      // 実際にはSupabase Storageにアップロード + リサイズ + EXIF削除
      await new Promise((resolve) => setTimeout(resolve, 500));
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "done" } : f))
      );
    }

    setIsUploading(false);
  };

  const allDone = files.length > 0 && files.every((f) => f.status === "done");

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
        {/* アルバム選択 */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900">アルバムを選択</h3>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setCreateNew(false)}
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
              >
                <option value="">アルバムを選択...</option>
                {DEMO_ALBUMS.map((album) => (
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
              />
              <Select
                label="イベント（任意）"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                <option value="">紐づけなし</option>
                {DEMO_EVENTS.map((event) => (
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
          <Link href="/albums">
            <Button className="w-full" size="lg">
              アルバムに戻る
            </Button>
          </Link>
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
