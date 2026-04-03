"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import { getShopProduct, getTeamPinnedProducts, pinProduct, unpinProduct } from "@/lib/supabase/queries/shop";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import { supabase } from "@/lib/supabase/client";
import type { ShopProduct, TeamPinnedProduct } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink } from "lucide-react";

const STORE_COLORS: Record<string, string> = {
  Amazon: "bg-orange-500 hover:bg-orange-600",
  "楽天市場": "bg-red-600 hover:bg-red-700",
  "Yahoo!ショッピング": "bg-red-500 hover:bg-red-600",
};

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.productId as string;
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { canPinProduct } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);

  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [pinnedData, setPinnedData] = useState<TeamPinnedProduct | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // おすすめコメント追加フォーム
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinComment, setPinComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const prod = await getShopProduct(productId);
      setProduct(prod);

      if (currentTeam) {
        const pinned = await getTeamPinnedProducts(currentTeam.id);
        const thisPin = pinned.find((p) => p.product_id === productId);
        setPinnedData(thisPin ?? null);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [productId, currentTeam]);

  useEffect(() => {
    if (!teamLoading) {
      fetchData();
    }
  }, [teamLoading, fetchData]);

  const handlePin = async () => {
    if (!currentTeam || !pinComment.trim()) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await pinProduct({
        team_id: currentTeam.id,
        product_id: productId,
        comment: pinComment.trim(),
        pinned_by: user.id,
      });
      setPinComment("");
      setShowPinForm(false);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnpin = async () => {
    if (!currentTeam || !pinnedData) return;
    try {
      await unpinProduct(currentTeam.id, productId);
      setPinnedData(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (teamLoading || isLoading) {
    return <Loading text="商品情報を読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  if (!product) {
    return <ErrorDisplay title="商品が見つかりません" message="商品が存在しないか削除された可能性があります。" />;
  }

  const images = product.images ?? [];
  const links = product.links ?? [];
  const categoryName = (product as unknown as { shop_categories?: { name: string } }).shop_categories?.name;
  const pinnerName = pinnedData
    ? (pinnedData as unknown as { users?: { display_name: string } }).users?.display_name ?? "メンバー"
    : "";

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
        <div className="flex h-64 items-center justify-center bg-gray-100 overflow-hidden">
          {images.length > 0 && images[currentSlide]?.image_url ? (
            <img src={images[currentSlide].image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          )}
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 w-2 rounded-full ${i === currentSlide ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 p-4">
        {/* 商品情報 */}
        <div>
          {categoryName && <Badge variant="default">{categoryName}</Badge>}
          <h1 className="mt-2 text-lg font-bold text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-500">{product.brand}</p>
          {product.price_min != null && (
            <p className="mt-1 text-lg font-bold text-green-700">
              ¥{product.price_min.toLocaleString()}
              {product.price_max != null && ` 〜 ¥${product.price_max.toLocaleString()}`}
            </p>
          )}
        </div>

        {/* 説明 */}
        {product.description && (
          <Card>
            <CardContent className="py-3">
              <p className="text-sm text-gray-700">{product.description}</p>
            </CardContent>
          </Card>
        )}

        {/* チームおすすめコメント */}
        {pinnedData && (
          <Card className="border-l-4 border-l-green-500 bg-green-50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-medium text-green-700">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  チームおすすめ
                </div>
                {canPinProduct() && (
                  <button onClick={handleUnpin} className="text-xs text-red-500 hover:underline">
                    削除
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-700">
                &ldquo;{pinnedData.comment}&rdquo;
              </p>
              <p className="mt-1 text-xs text-gray-500">
                — {pinnerName}
              </p>
            </CardContent>
          </Card>
        )}

        {/* おすすめコメント追加 */}
        {canPinProduct() && !pinnedData && (
          <>
            {!showPinForm ? (
              <Button variant="outline" className="w-full" onClick={() => setShowPinForm(true)}>
                おすすめコメントを追加
              </Button>
            ) : (
              <Card className="p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-900">おすすめコメント</h3>
                <Textarea
                  label=""
                  value={pinComment}
                  onChange={(e) => setPinComment(e.target.value)}
                  placeholder="おすすめポイントを入力..."
                />
                <div className="mt-2 flex gap-2">
                  <Button onClick={handlePin} disabled={!pinComment.trim() || isSaving} className="flex-1">
                    {isSaving ? "保存中..." : "追加"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowPinForm(false)} className="flex-1">
                    キャンセル
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}

        {/* 購入ボタン */}
        {links.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">購入する</h3>
            {links.map((link) =>
              link.url.trimStart().startsWith("<") ? (
                <div
                  key={link.id}
                  className="flex justify-center"
                  dangerouslySetInnerHTML={{ __html: link.url }}
                />
              ) : (
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
                      <span className="flex items-center gap-1.5">
                        {link.store_name}で購入
                        <ExternalLink className="h-4 w-4" />
                      </span>
                      {link.price != null && <span className="font-bold">¥{link.price.toLocaleString()}</span>}
                    </span>
                  </Button>
                </a>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
