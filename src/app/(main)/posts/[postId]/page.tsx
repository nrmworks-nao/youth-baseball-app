"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

// デモデータ
const DEMO_POST: {
  id: string;
  title: string;
  body: string;
  priority: string;
  category: string;
  author: { display_name: string; picture_url: string | null };
  created_at: string;
} = {
  id: "1",
  title: "【重要】4/6 練習試合の集合時間変更",
  body: "4/6の練習試合ですが、相手チームの都合により集合時間が変更になりました。\n\n変更前: 9:00集合\n変更後: 8:30集合\n\n場所は変わらず市民球場です。\nユニフォーム着用でお願いします。\n\n遅れる場合はLINEでご連絡ください。",
  priority: "important",
  category: "schedule",
  author: { display_name: "山本監督", picture_url: null },
  created_at: "2026-03-29T18:00:00",
};

const DEMO_COMMENTS = [
  {
    id: "1",
    body: "承知しました！8:30に向かいます。",
    author: { display_name: "佐藤" },
    created_at: "2026-03-29T18:30:00",
  },
  {
    id: "2",
    body: "了解です。子供に伝えます。",
    author: { display_name: "田中" },
    created_at: "2026-03-29T19:00:00",
  },
  {
    id: "3",
    body: "ありがとうございます。少し遅れるかもしれません。",
    author: { display_name: "鈴木" },
    created_at: "2026-03-29T20:15:00",
  },
];

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function PostDetailPage() {
  const params = useParams();
  const post = DEMO_POST; // TODO: getPost(params.postId)

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(12);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(DEMO_COMMENTS);

  const handleLike = () => {
    if (isLiked) {
      setLikeCount((c) => c - 1);
    } else {
      setLikeCount((c) => c + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: String(comments.length + 1),
      body: commentText,
      author: { display_name: "自分" },
      created_at: new Date().toISOString(),
    };
    setComments([...comments, newComment]);
    setCommentText("");
  };

  return (
    <div className="flex flex-col">
      {/* 戻るリンク */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <Link
          href="/posts"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
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
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          連絡一覧
        </Link>
      </div>

      <div className="space-y-4 p-4">
        {/* 投稿本文 */}
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center gap-2">
              {post.priority === "urgent" && (
                <Badge variant="urgent">緊急</Badge>
              )}
              {post.priority === "important" && (
                <Badge variant="important">重要</Badge>
              )}
            </div>
            <h1 className="text-lg font-bold text-gray-900">{post.title}</h1>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium">
                {post.author.display_name.charAt(0)}
              </div>
              <span>{post.author.display_name}</span>
              <span>{formatDateTime(post.created_at)}</span>
            </div>

            <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {post.body}
            </div>

            {/* いいねボタン */}
            <div className="flex items-center gap-4 border-t border-gray-100 pt-3">
              <button
                className={cn(
                  "flex items-center gap-1 text-sm transition-colors",
                  isLiked
                    ? "text-green-600"
                    : "text-gray-400 hover:text-gray-600"
                )}
                onClick={handleLike}
              >
                <svg
                  className="h-5 w-5"
                  fill={isLiked ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3.25A.75.75 0 0 1 14.25 2.5a2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m.729-8.07a48.474 48.474 0 0 0-.726 8.07m.726-8.07a48.345 48.345 0 0 1 .288-3.202c.14-.95-.603-1.798-1.566-1.798h-.29c-.638 0-1.18.434-1.285 1.064A48.46 48.46 0 0 0 3 12.288c0 1.655.09 3.288.267 4.892.127.628.669 1.068 1.305 1.068h.29c.96 0 1.7-.845 1.561-1.793a47.577 47.577 0 0 1-.419-5.065"
                  />
                </svg>
                {likeCount}
              </button>
              <span className="text-sm text-gray-400">
                コメント {comments.length}件
              </span>
            </div>
          </CardContent>
        </Card>

        {/* コメント一覧 */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">コメント</h2>
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600">
                {comment.author.display_name.charAt(0)}
              </div>
              <div className="flex-1 rounded-xl bg-gray-100 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">
                    {comment.author.display_name}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {formatDateTime(comment.created_at)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-gray-700">{comment.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* コメント入力 */}
        <div className="sticky bottom-20 flex gap-2 rounded-xl bg-white p-2 shadow-lg">
          <input
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            placeholder="コメントを入力..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
          />
          <Button
            size="icon"
            className="h-10 w-10 rounded-full"
            disabled={!commentText.trim()}
            onClick={handleComment}
          >
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
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
