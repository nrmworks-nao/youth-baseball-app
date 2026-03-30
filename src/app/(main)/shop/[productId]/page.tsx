"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DEMO_PRODUCT = {
  id: "prod1",
  name: "ミズノ 少年軟式グローブ セレクトナイン",
  brand: "ミズノ",
  description:
    "少年野球初心者に最適なオールラウンドグローブ。柔らかい革を使用しており、すぐに手に馴染みます。Sサイズは低学年向け、Mサイズは高学年向けです。",
  price_min: 8800,
  price_max: 12000,
  age_group: "all",
  category: "グローブ",
  images: [
    { id: "img1", image_url: "", sort_order: 0 },
    { id: "img2", image_url: "", sort_order: 1 },
    { id: "img3", image_url: "", sort_order: 2 },
  ],
  links: [
    { id: "l1", store_name: "Amazon", url: "#", price: 9800 },
    { id: "l2", store_name: "楽天市場", url: "#", price: 8800 },
    { id: "l3", store_name: "Yahoo!ショッピング", url: "#", price: 9200 },
  ],
};

const DEMO_TEAM_COMMENT = {
  comment:
    "初心者に最適！軽くて柔らかく、すぐに馴染みます。うちの子もこれでデビューしました。低学年はSサイズ、4年生以上はMサイズがおすすめです。",
  pinner_name: "山本監督",
  pinner_title: "監督",
};

const STORE_COLORS: Record<string, string> = {
  Amazon: "bg-orange-500 hover:bg-orange-600",
  "楽天市場": "bg-red-600 hover:bg-red-700",
  "Yahoo!ショッピング": "bg-red-500 hover:bg-red-600",
};

export default function ProductDetailPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  return (
    <div className="flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/shop" className="text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h2 className="text-base font-bold text-gray-900">商品詳細</h2>
      </div>

      {/* 画像スライダー */}
      <div className="relative">
        <div className="flex h-64 items-center justify-center bg-gray-100">
          <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
        </div>
        {/* スライダーインジケーター */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {DEMO_PRODUCT.images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 w-2 rounded-full ${i === currentSlide ? "bg-white" : "bg-white/50"}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* 商品情報 */}
        <div>
          <Badge variant="default">{DEMO_PRODUCT.category}</Badge>
          <h1 className="mt-2 text-lg font-bold text-gray-900">{DEMO_PRODUCT.name}</h1>
          <p className="text-sm text-gray-500">{DEMO_PRODUCT.brand}</p>
          <p className="mt-1 text-lg font-bold text-green-700">
            ¥{DEMO_PRODUCT.price_min.toLocaleString()} 〜 ¥{DEMO_PRODUCT.price_max.toLocaleString()}
          </p>
        </div>

        {/* 説明 */}
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-gray-700">{DEMO_PRODUCT.description}</p>
          </CardContent>
        </Card>

        {/* チームおすすめコメント */}
        {DEMO_TEAM_COMMENT && (
          <Card className="border-l-4 border-l-green-500 bg-green-50">
            <CardContent className="py-3">
              <div className="flex items-center gap-1 text-xs font-medium text-green-700">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                チームおすすめ
              </div>
              <p className="mt-2 text-sm text-gray-700">
                &ldquo;{DEMO_TEAM_COMMENT.comment}&rdquo;
              </p>
              <p className="mt-1 text-xs text-gray-500">
                — {DEMO_TEAM_COMMENT.pinner_name}（{DEMO_TEAM_COMMENT.pinner_title}）
              </p>
            </CardContent>
          </Card>
        )}

        {/* 購入ボタン */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">購入する</h3>
          {DEMO_PRODUCT.links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                className={`w-full text-white ${STORE_COLORS[link.store_name] ?? "bg-gray-600 hover:bg-gray-700"}`}
                size="lg"
              >
                <span className="flex items-center justify-between w-full">
                  <span>{link.store_name}で購入</span>
                  <span className="font-bold">¥{link.price?.toLocaleString()}</span>
                </span>
              </Button>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
