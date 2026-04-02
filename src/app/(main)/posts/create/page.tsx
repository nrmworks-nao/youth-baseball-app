"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { cn } from "@/lib/utils/cn";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { createPost } from "@/lib/supabase/queries/posts";
import { supabase } from "@/lib/supabase/client";
import { sendNotification } from "@/lib/notifications/send";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { PostPriority, PostCategory } from "@/types";

const PRIORITY_OPTIONS: { value: PostPriority; label: string; description: string }[] = [
  { value: "normal", label: "通常", description: "一般的な連絡" },
  { value: "important", label: "重要", description: "確認必須の連絡" },
  { value: "urgent", label: "緊急", description: "至急対応が必要" },
];

const CATEGORY_OPTIONS: { value: PostCategory; label: string }[] = [
  { value: "practice", label: "練習" },
  { value: "game", label: "試合" },
  { value: "admin", label: "事務連絡" },
  { value: "accounting", label: "会計" },
  { value: "other", label: "その他" },
];

export default function CreatePostPage() {
  const router = useRouter();
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { canPost } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<PostPriority>("normal");
  const [category, setCategory] = useState<PostCategory>("other");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 権限がない場合はリダイレクト
  useEffect(() => {
    if (!teamLoading && currentMembership && !canPost()) {
      router.push("/posts");
    }
  }, [teamLoading, currentMembership, canPost, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentTeam) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `posts/${currentTeam.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
      setImageUrls((prev) => [...prev, ...newUrls]);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim() || !currentTeam) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      await createPost({
        team_id: currentTeam.id,
        author_id: user.id,
        title: title.trim(),
        body: body.trim(),
        priority,
        category,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      });

      // LINE通知 + アプリ内通知（非同期・失敗許容）
      sendNotification({
        team_id: currentTeam.id,
        notification_type: "post",
        title: `新しい投稿: ${title.trim()}`,
        message_body: body.trim().slice(0, 100),
        link: "/posts",
        meta: { author_name: user.user_metadata?.display_name ?? "" },
      });

      router.push("/posts");
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  if (teamLoading) {
    return <Loading />;
  }

  if (!currentTeam) {
    return <ErrorDisplay title="チーム未選択" message="チームを選択してください。" />;
  }

  if (currentMembership && !canPost()) {
    return <ErrorDisplay title="権限がありません" message="投稿権限がありません。" />;
  }

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
        <Link
          href="/posts"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          キャンセル
        </Link>
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">新規投稿</h2>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!title.trim() || !body.trim() || isSubmitting}
        >
          {isSubmitting ? "送信中..." : "投稿"}
        </Button>
      </div>

      <div className="space-y-5 p-4">
        {/* 重要度 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            重要度
          </label>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={cn(
                  "flex-1 rounded-lg border p-2 text-center transition-colors",
                  priority === opt.value
                    ? opt.value === "urgent"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : opt.value === "important"
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-500 dark:border-gray-600"
                )}
                onClick={() => setPriority(opt.value)}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="mt-0.5 text-[10px]">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* カテゴリ */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            カテゴリ
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  category === opt.value
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                )}
                onClick={() => setCategory(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* タイトル */}
        <Input
          id="post-title"
          label="タイトル"
          placeholder="連絡のタイトルを入力"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* 本文 */}
        <Textarea
          id="post-body"
          label="本文"
          placeholder="連絡内容を入力..."
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        {/* 画像プレビュー */}
        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                <button
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white"
                  onClick={() => setImageUrls((prev) => prev.filter((_, j) => j !== i))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 画像添付 */}
        <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-4 text-sm text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-500 dark:border-gray-600">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
          {isUploading ? "アップロード中..." : "画像を添付"}
        </label>

        {submitError && (
          <p className="text-sm text-red-600">{submitError}</p>
        )}
      </div>
    </div>
  );
}
