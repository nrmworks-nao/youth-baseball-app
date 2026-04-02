"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { getShopCategories, getShopProducts, getTeamPinnedProducts } from "@/lib/supabase/queries/shop";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { ShopCategory, ShopProduct, TeamPinnedProduct } from "@/types";

// サンプルおすすめ商品（TODO: DB連携に切り替え）
const SAMPLE_RECOMMENDED_PRODUCTS = [
  {
    id: "sample-1",
    name: "ミズノ 少年軟式グローブ",
    comment: "初心者におすすめ！軽くて使いやすいです。",
  },
  {
    id: "sample-2",
    name: "ゼット 少年軟式バット",
    comment: "低学年向け、振りやすい軽量モデル",
  },
  {
    id: "sample-3",
    name: "SSK 練習球 1ダース",
    comment: "チーム練習用に最適",
  },
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
  const { currentTeam, isLoading: teamLoading } = useCurrentTeam();
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [pinnedProducts, setPinnedProducts] = useState<TeamPinnedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cats, prods] = await Promise.all([
        getShopCategories(),
        getShopProducts(),
      ]);
      setCategories(cats);
      setProducts(prods);

      if (currentTeam) {
        const pinned = await getTeamPinnedProducts(currentTeam.id);
        setPinnedProducts(pinned);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (!teamLoading) {
      fetchData();
    }
  }, [teamLoading, fetchData]);

  const handleCategoryChange = useCallback(async (categoryId: string) => {
    setActiveCategory(categoryId);
    try {
      const prods = await getShopProducts(categoryId === "all" ? undefined : categoryId);
      setProducts(prods);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  if (teamLoading || isLoading) {
    return <Loading text="商品を読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">買い物</h2>
      </div>

      {/* おすすめ商品（サンプル） */}
      {pinnedProducts.length === 0 && (
        <div className="bg-gradient-to-b from-green-50 to-white px-4 py-4">
          <h3 className="mb-3 flex items-center gap-1 text-sm font-bold text-gray-900">
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            おすすめ商品
          </h3>
          <div className="space-y-3">
            {SAMPLE_RECOMMENDED_PRODUCTS.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="flex gap-3">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <div className="mt-1 rounded bg-green-50 p-2">
                      <p className="text-xs text-gray-700">{item.comment}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* チームのおすすめ */}
      {pinnedProducts.length > 0 && (
        <div className="bg-gradient-to-b from-green-50 to-white px-4 py-4">
          <h3 className="mb-3 flex items-center gap-1 text-sm font-bold text-gray-900">
            <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            チームのおすすめ
          </h3>
          <div className="space-y-3">
            {pinnedProducts.map((pin) => {
              const product = pin.product as ShopProduct | undefined;
              const pinnerName = (pin as unknown as { users?: { display_name: string } }).users?.display_name ?? "メンバー";
              const imageUrl = product?.images?.[0]?.image_url;
              return (
                <Link key={pin.id} href={`/shop/${pin.product_id}`}>
                  <Card className="p-3 transition-colors hover:bg-gray-50">
                    <div className="flex gap-3">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 overflow-hidden">
                        {imageUrl ? (
                          <img src={imageUrl} alt={product?.name} className="h-full w-full object-cover" />
                        ) : (
                          <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{product?.name}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            ¥{product?.price_min?.toLocaleString()}〜
                          </span>
                        </div>
                        {pin.comment && (
                          <div className="mt-1 rounded bg-green-50 p-2">
                            <p className="text-xs text-gray-700">
                              &ldquo;{pin.comment}&rdquo;
                            </p>
                            <p className="mt-0.5 text-[10px] text-gray-400">— {pinnerName}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* カテゴリタブ */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 bg-white px-4 py-2">
        <button
          onClick={() => handleCategoryChange("all")}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          すべて
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
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
        {products.length === 0 ? (
          <p className="col-span-2 py-8 text-center text-sm text-gray-400">商品がありません</p>
        ) : (
          products.map((product) => {
            const imageUrl = product.images?.[0]?.image_url;
            return (
              <Link key={product.id} href={`/shop/${product.id}`}>
                <Card className="overflow-hidden transition-colors hover:bg-gray-50">
                  <div className="flex h-28 items-center justify-center bg-gray-100 overflow-hidden">
                    {imageUrl ? (
                      <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                      </svg>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.brand}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-900">
                        ¥{product.price_min?.toLocaleString()}〜
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
