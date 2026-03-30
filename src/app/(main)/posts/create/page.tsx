"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import type { PostPriority, PostCategory } from "@/types";

const PRIORITY_OPTIONS: { value: PostPriority; label: string; description: string }[] = [
  { value: "normal", label: "通常", description: "一般的な連絡" },
  { value: "important", label: "重要", description: "確認必須の連絡" },
  { value: "urgent", label: "緊急", description: "至急対応が必要" },
];

const CATEGORY_OPTIONS: { value: PostCategory; label: string }[] = [
  { value: "general", label: "一般" },
  { value: "schedule", label: "スケジュール" },
  { value: "report", label: "報告" },
  { value: "other", label: "その他" },
];

export default function CreatePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<PostPriority>("normal");
  const [category, setCategory] = useState<PostCategory>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return;
    setIsSubmitting(true);
    try {
      // TODO: createPost({ team_id, author_id, title, body, priority, category })
      console.log("投稿作成:", { title, body, priority, category });
      router.push("/posts");
    } catch (error) {
      console.error("投稿エラー:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <Link
          href="/posts"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          キャンセル
        </Link>
        <h2 className="text-base font-bold text-gray-900">新規投稿</h2>
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

        {/* 画像添付（今後実装） */}
        <button className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-4 text-sm text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-500">
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
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
            />
          </svg>
          画像を添付
        </button>
      </div>
    </div>
  );
}
