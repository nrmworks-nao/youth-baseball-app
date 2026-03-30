"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DEMO_CATEGORIES = [
  { id: "all", name: "すべて", slug: "all" },
  { id: "c1", name: "バット", slug: "bat" },
  { id: "c2", name: "グローブ", slug: "glove" },
  { id: "c3", name: "スパイク", slug: "spike" },
  { id: "c4", name: "ウェア", slug: "wear" },
  { id: "c5", name: "その他", slug: "other" },
];

const DEMO_PINNED = [
  {
    id: "p1",
    product_id: "prod1",
    product_name: "ミズノ 少年軟式グローブ セレクトナイン",
    brand: "ミズノ",
    price_min: 8800,
    price_max: 12000,
    comment: "初心者に最適！軽くて柔らかく、すぐに馴染みます。うちの子もこれでデビューしました。",
    pinner_name: "山本監督",
    category: "グローブ",
    image_url: null,
    rating: 5,
  },
  {
    id: "p2",
    product_id: "prod3",
    product_name: "アシックス スターシャイン S",
    brand: "アシックス",
    price_min: 4500,
    price_max: 6000,
    comment: "コスパ良し。成長期なのですぐサイズアウトするから、これくらいがちょうどいいです。",
    pinner_name: "田中コーチ",
    category: "スパイク",
    image_url: null,
    rating: 4,
  },
];

const DEMO_PRODUCTS = [
  { id: "prod1", name: "ミズノ 少年軟式グローブ セレクトナイン", brand: "ミズノ", price_min: 8800, price_max: 12000, category: "グローブ", rating: 5, image_url: null },
  { id: "prod2", name: "ゼット ブラックキャノン MAX", brand: "ゼット", price_min: 15000, price_max: 22000, category: "バット", rating: 4, image_url: null },
  { id: "prod3", name: "アシックス スターシャイン S", brand: "アシックス", price_min: 4500, price_max: 6000, category: "スパイク", rating: 4, image_url: null },
  { id: "prod4", name: "SSK テクニカルパッドTシャツ", brand: "SSK", price_min: 2200, price_max: 3500, category: "ウェア", rating: 3, image_url: null },
  { id: "prod5", name: "ローリングス 軟式ボール M号", brand: "ローリングス", price_min: 600, price_max: 800, category: "その他", rating: 0, image_url: null },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-3.5 w-3.5 ${star <= rating ? "text-yellow-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredProducts =
    activeCategory === "all"
      ? DEMO_PRODUCTS
      : DEMO_PRODUCTS.filter((p) => p.category === DEMO_CATEGORIES.find((c) => c.id === activeCategory)?.name);

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">買い物</h2>
      </div>

      {/* チームのおすすめ */}
      {DEMO_PINNED.length > 0 && (
        <div className="bg-gradient-to-b from-green-50 to-white px-4 py-4">
          <h3 className="mb-3 flex items-center gap-1 text-sm font-bold text-gray-900">
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            チームのおすすめ
          </h3>
          <div className="space-y-3">
            {DEMO_PINNED.map((pin) => (
              <Link key={pin.id} href={`/shop/${pin.product_id}`}>
                <Card className="p-3 transition-colors hover:bg-gray-50">
                  <div className="flex gap-3">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{pin.product_name}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <StarRating rating={pin.rating} />
                        <span className="text-xs text-gray-500">
                          ¥{pin.price_min?.toLocaleString()}〜
                        </span>
                      </div>
                      <div className="mt-1 rounded bg-green-50 p-2">
                        <p className="text-xs text-gray-700">
                          &ldquo;{pin.comment}&rdquo;
                        </p>
                        <p className="mt-0.5 text-[10px] text-gray-400">— {pin.pinner_name}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* カテゴリタブ */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 bg-white px-4 py-2">
        {DEMO_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === cat.id
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 商品一覧 */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {filteredProducts.map((product) => (
          <Link key={product.id} href={`/shop/${product.id}`}>
            <Card className="overflow-hidden transition-colors hover:bg-gray-50">
              <div className="flex h-28 items-center justify-center bg-gray-100">
                <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
              </div>
              <div className="p-2">
                <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">{product.brand}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900">
                    ¥{product.price_min?.toLocaleString()}〜
                  </span>
                  {product.rating > 0 && <StarRating rating={product.rating} />}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
