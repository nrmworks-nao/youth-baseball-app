"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const MAX_IMAGES = 20;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// デモ用の既存画像
const DEMO_IMAGES = [
  {
    id: "img1",
    image_url: "",
    sort_order: 0,
    placeholder: "スコアブック 表（1回〜4回）",
  },
  {
    id: "img2",
    image_url: "",
    sort_order: 1,
    placeholder: "スコアブック 表（5回〜7回）",
  },
];

// ANTHROPIC_API_KEY が設定されているか（デモ用: 未設定）
const AI_ENABLED = false;

interface PreviewImage {
  id: string;
  file: File;
  previewUrl: string;
}

export default function ScorebookPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingImages] = useState(DEMO_IMAGES);
  const [newImages, setNewImages] = useState<PreviewImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalImages = existingImages.length + newImages.length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    // 上限チェック
    if (totalImages + fileArray.length > MAX_IMAGES) {
      setError(`アップロード上限は${MAX_IMAGES}枚です`);
      return;
    }

    // ファイル検証
    for (const file of fileArray) {
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.endsWith(".heic")) {
        setError("JPEG、PNG、HEIC形式の画像のみアップロードできます");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("ファイルサイズは10MB以下にしてください");
        return;
      }
    }

    const previews: PreviewImage[] = fileArray.map((file, i) => ({
      id: `new-${Date.now()}-${i}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setNewImages((prev) => [...prev, ...previews]);

    // inputリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeNewImage = (id: string) => {
    setNewImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleUpload = async () => {
    if (newImages.length === 0) return;
    setUploading(true);
    // TODO: Supabase Storageへアップロード + Sharp処理 + EXIF削除
    // 実際にはサーバーサイドAPIを経由してリサイズ・EXIF削除を行う
    await new Promise((r) => setTimeout(r, 1500));
    alert("アップロードしました（デモ）");
    setNewImages([]);
    setUploading(false);
  };

  const handleAiAnalyze = () => {
    if (!AI_ENABLED) return;
    // TODO: AI解析APIを呼び出し
    alert("AI解析を開始しました（デモ）");
  };

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href={`/games/${gameId}`} className="p-1">
          <svg
            className="h-5 w-5 text-gray-600"
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
        </Link>
        <h2 className="text-base font-bold text-gray-900">スコアブック</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* アップロードエリア */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">画像登録</CardTitle>
              <span className="text-xs text-gray-400">
                {totalImages}/{MAX_IMAGES}枚
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-8 transition-colors hover:border-green-400 hover:bg-green-50"
            >
              <svg
                className="mb-2 h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-600">
                タップして画像を選択
              </span>
              <span className="mt-1 text-xs text-gray-400">
                JPEG / PNG / HEIC（最大10MB）
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic,.heic"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 新規プレビュー */}
        {newImages.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                新規画像（{newImages.length}枚）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {newImages.map((img) => (
                  <div key={img.id} className="relative">
                    <img
                      src={img.previewUrl}
                      alt="プレビュー"
                      className="h-32 w-full rounded-lg object-cover"
                    />
                    <button
                      onClick={() => removeNewImage(img.id)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    <div className="mt-1 truncate text-[10px] text-gray-500">
                      {img.file.name}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                className="mt-3 w-full"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? "アップロード中..." : "アップロード"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 既存画像 */}
        {existingImages.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                登録済み画像（{existingImages.length}枚）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {existingImages.map((img) => (
                  <div
                    key={img.id}
                    className="flex h-32 items-center justify-center rounded-lg bg-gray-100 p-2"
                  >
                    <span className="text-center text-xs text-gray-400">
                      {img.placeholder}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI解析 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">AI解析</CardTitle>
          </CardHeader>
          <CardContent>
            {AI_ENABLED ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAiAnalyze}
              >
                スコアブックをAI解析
              </Button>
            ) : (
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <div className="mb-1 text-sm font-medium text-gray-500">
                  準備中
                </div>
                <div className="text-xs text-gray-400">
                  AI解析機能は現在準備中です。
                  <br />
                  今後のアップデートをお待ちください。
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
