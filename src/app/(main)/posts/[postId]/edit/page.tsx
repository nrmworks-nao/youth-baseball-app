"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { cn } from "@/lib/utils/cn";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { getPost, updatePost } from "@/lib/supabase/queries/posts";
import { supabase } from "@/lib/supabase/client";
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

export default function EditPostPage() {
  const params = useParams();
  const postId = params.postId as string;
  const router = useRouter();
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<PostPriority>("normal");
  const [category, setCategory] = useState<PostCategory>("other");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 投稿データの読み込み
  useEffect(() => {
    if (teamLoading) return;

    const fetchPost = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("ログインが必要です");

        const postData = await getPost(postId);
        if (!postData) throw new Error("投稿が見つかりません");

        // 権限チェック: 投稿者本人 or サイト管理者のみ編集可能
        if (postData.author_id !== user.id && !currentMembership?.is_admin) {
          router.push(`/posts/${postId}`);
          return;
        }

        setTitle(postData.title);
        setBody(postData.body);
        setPriority(postData.priority as PostPriority);
        setCategory(postData.category as PostCategory);
        setImageUrls(postData.image_urls ?? []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId, teamLoading, currentMembership, router]);

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
    if (!title.trim() || !body.trim()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await updatePost(postId, {
        title: title.trim(),
        body: body.trim(),
        priority,
        category,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      });

      router.push(`/posts/${postId}`);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  if (isLoading || teamLoading) {
    return <Loading text="投稿を読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <Link
          href={`/posts/${postId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          キャンセル
        </Link>
        <h2 className="text-base font-bold text-gray-900">投稿を編集</h2>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!title.trim() || !body.trim() || isSubmitting}
        >
          {isSubmitting ? "保存中..." : "保存"}
        </Button>
      </div>

      <div className="space-y-5 p-4">
        {/* 重要度 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
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
                    : "border-gray-200 text-gray-500"
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
          <label className="mb-2 block text-sm font-medium text-gray-700">
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
                    : "bg-gray-100 text-gray-600"
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
        <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-4 text-sm text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-500">
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
