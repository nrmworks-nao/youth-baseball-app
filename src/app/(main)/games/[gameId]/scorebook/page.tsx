"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { supabase } from "@/lib/supabase/client";
import {
  getScorebookImages,
  deleteScorebookImage,
} from "@/lib/supabase/queries/games";
import type { ScorebookImage } from "@/types";

const MAX_IMAGES = 20;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface PreviewImage {
  id: string;
  file: File;
  previewUrl: string;
}

export default function ScorebookPage() {
  const params = useParams();
  const gameId = params.gameId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { hasPermission } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);
  const [existingImages, setExistingImages] = useState<ScorebookImage[]>([]);
  const [newImages, setNewImages] = useState<PreviewImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const canManage = hasPermission(["director", "coach"]);

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) setUserId(user.id);

        const images = await getScorebookImages(gameId);
        setExistingImages(images);
      } catch {
        setError("画像データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [gameId]);

  const totalImages = existingImages.length + newImages.length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    if (totalImages + fileArray.length > MAX_IMAGES) {
      setError(`アップロード上限は${MAX_IMAGES}枚です`);
      return;
    }

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
    if (newImages.length === 0 || !currentTeam || !userId) return;
    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < newImages.length; i++) {
        const img = newImages[i];
        const ext = img.file.name.split(".").pop() || "jpg";
        const filePath = `${currentTeam.id}/${gameId}/${Date.now()}-${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("scorebooks")
          .upload(filePath, img.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("scorebooks")
          .getPublicUrl(filePath);

        await supabase.from("game_scorebook_images").insert({
          game_id: gameId,
          team_id: currentTeam.id,
          image_url: urlData.publicUrl,
          sort_order: existingImages.length + i,
          uploaded_by: userId,
        });
      }

      // リロード
      const images = await getScorebookImages(gameId);
      setExistingImages(images);
      setNewImages([]);
    } catch {
      setError("アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (image: ScorebookImage) => {
    if (!confirm("この画像を削除しますか？")) return;

    try {
      // Storage上のファイルも削除
      const urlParts = image.image_url.split("/scorebooks/");
      if (urlParts.length > 1) {
        await supabase.storage.from("scorebooks").remove([urlParts[1]]);
      }

      await deleteScorebookImage(image.id);
      setExistingImages((prev) => prev.filter((img) => img.id !== image.id));
    } catch {
      setError("画像の削除に失敗しました");
    }
  };

  const handleAiAnalyze = () => {
    // TODO: AI解析APIを呼び出し（F-SCR-002）
    alert("この機能は近日公開予定です");
  };

  if (teamLoading || isLoading) return <Loading className="min-h-screen" />;

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
                  <div key={img.id} className="relative">
                    <img
                      src={img.image_url}
                      alt={`スコアブック ${img.sort_order + 1}`}
                      className="h-32 w-full cursor-pointer rounded-lg object-cover"
                      onClick={() => setSelectedImage(img.image_url)}
                    />
                    {(canManage || img.uploaded_by === userId) && (
                      <button
                        onClick={() => handleDeleteImage(img)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/80 text-white"
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
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 画像拡大モーダル */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setSelectedImage(null)}
          >
            <img
              src={selectedImage}
              alt="拡大画像"
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* AI解析 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">AI解析</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <div className="mb-1 text-sm font-medium text-gray-500">
                準備中
              </div>
              <div className="text-xs text-gray-400">
                AI解析機能は現在準備中です。
                <br />
                今後のアップデートをお待ちください。
              </div>
              <Button
                variant="outline"
                className="mt-3"
                onClick={handleAiAnalyze}
              >
                AI解析（近日公開）
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
