"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import {
  getAllShopProducts,
  getShopCategories,
  createShopProduct,
  updateShopProduct,
  deleteShopProduct,
  createShopCategory,
  updateShopCategory,
  deleteShopCategory,
} from "@/lib/supabase/queries/shop";
import { supabase } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { ShopCategory, ShopProduct } from "@/types";

type Tab = "products" | "categories";

export default function AdminShopPage() {
  const router = useRouter();
  const { currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { canManageShop } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);

  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 商品フォーム
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [productLinks, setProductLinks] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // カテゴリフォーム
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prods, cats] = await Promise.all([
        getAllShopProducts(),
        getShopCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!teamLoading) {
      if (!canManageShop()) {
        router.replace("/shop");
        return;
      }
      fetchData();
    }
  }, [teamLoading, canManageShop, fetchData, router]);

  const resetProductForm = () => {
    setProductName("");
    setProductBrand("");
    setProductCategory("");
    setProductDescription("");
    setPriceMin("");
    setPriceMax("");
    setProductLinks({});
    setEditingProductId(null);
  };

  const handleSaveProduct = async () => {
    if (!productName.trim()) return;
    setIsSaving(true);
    try {
      const data = {
        name: productName.trim(),
        brand: productBrand.trim() || undefined,
        category_id: productCategory || undefined,
        description: productDescription.trim() || undefined,
        price_min: priceMin ? Number(priceMin) : undefined,
        price_max: priceMax ? Number(priceMax) : undefined,
      };

      if (editingProductId) {
        await updateShopProduct(editingProductId, data);
      } else {
        const newProduct = await createShopProduct(data);
        // 購入リンクを追加
        const linkEntries = Object.entries(productLinks).filter(([, url]) => (url as string).trim());
        if (linkEntries.length > 0) {
          const linksData = linkEntries.map(([store, url], i) => ({
            product_id: newProduct.id,
            store_name: store,
            url: (url as string).trim(),
            sort_order: i,
          }));
          await supabase.from("shop_product_links").insert(linksData);
        }
      }

      resetProductForm();
      setShowProductForm(false);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("この商品を削除しますか？")) return;
    try {
      await deleteShopProduct(id);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleEditProduct = (product: ShopProduct) => {
    setEditingProductId(product.id);
    setProductName(product.name);
    setProductBrand(product.brand ?? "");
    setProductCategory(product.category_id ?? "");
    setProductDescription(product.description ?? "");
    setPriceMin(product.price_min?.toString() ?? "");
    setPriceMax(product.price_max?.toString() ?? "");
    setShowProductForm(true);
  };

  const handleToggleActive = async (product: ShopProduct) => {
    try {
      await updateShopProduct(product.id, { is_active: !product.is_active });
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim() || !categorySlug.trim()) return;
    setIsSaving(true);
    try {
      if (editingCategoryId) {
        await updateShopCategory(editingCategoryId, { name: categoryName.trim() });
      } else {
        await createShopCategory({ name: categoryName.trim(), slug: categorySlug.trim() });
      }
      setCategoryName("");
      setCategorySlug("");
      setEditingCategoryId(null);
      setShowCategoryForm(false);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("このカテゴリを削除しますか？")) return;
    try {
      await deleteShopCategory(id);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (teamLoading || isLoading) {
    return <Loading text="商品管理を読み込み中..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchData} />;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/shop" className="text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h2 className="text-base font-bold text-gray-900">商品管理</h2>
      </div>

      {/* タブ */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setTab("products")}
          className={`flex-1 py-3 text-sm font-medium ${
            tab === "products"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500"
          }`}
        >
          商品
        </button>
        <button
          onClick={() => setTab("categories")}
          className={`flex-1 py-3 text-sm font-medium ${
            tab === "categories"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500"
          }`}
        >
          カテゴリ
        </button>
      </div>

      <div className="space-y-4 p-4">
        {tab === "products" ? (
          <>
            <Button size="sm" onClick={() => { resetProductForm(); setShowProductForm(!showProductForm); }}>
              {showProductForm ? "閉じる" : "+ 商品を追加"}
            </Button>

            {showProductForm && (
              <Card className="p-4">
                <h3 className="mb-3 text-sm font-medium text-gray-900">
                  {editingProductId ? "商品編集" : "商品登録"}
                </h3>
                <div className="space-y-3">
                  <Input label="商品名" value={productName} onChange={(e) => setProductName(e.target.value)} />
                  <Input label="ブランド" value={productBrand} onChange={(e) => setProductBrand(e.target.value)} />
                  <Select label="カテゴリ" value={productCategory} onChange={(e) => setProductCategory(e.target.value)}>
                    <option value="">選択...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                  <Textarea label="説明" value={productDescription} onChange={(e) => setProductDescription(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="最低価格" type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
                    <Input label="最高価格" type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
                  </div>
                  {!editingProductId && (
                    <>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">商品画像</label>
                        <input type="file" accept="image/*" multiple className="text-sm text-gray-500" />
                      </div>
                      <h4 className="text-xs font-medium text-gray-700">ECサイトリンク</h4>
                      <div className="space-y-2">
                        {["Amazon", "楽天市場", "Yahoo!ショッピング"].map((store) => (
                          <Input
                            key={store}
                            label={store}
                            placeholder={`${store}の商品URL`}
                            value={productLinks[store] ?? ""}
                            onChange={(e) => setProductLinks({ ...productLinks, [store]: e.target.value })}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  <Button className="w-full" onClick={handleSaveProduct} disabled={isSaving || !productName.trim()}>
                    {isSaving ? "保存中..." : editingProductId ? "更新" : "登録"}
                  </Button>
                </div>
              </Card>
            )}

            {/* 商品一覧 */}
            <div className="space-y-2">
              {products.map((product) => {
                const catName = (product as unknown as { shop_categories?: { name: string } }).shop_categories?.name;
                return (
                  <Card key={product.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                          <Badge variant={product.is_active ? "primary" : "default"}>
                            {product.is_active ? "公開" : "非公開"}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {product.brand}{catName ? ` · ${catName}` : ""}{product.price_min != null ? ` · ¥${product.price_min.toLocaleString()}〜` : ""}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleToggleActive(product)}>
                          {product.is_active ? "非公開" : "公開"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)}>
                          編集
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)}>
                          削除
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <Button size="sm" onClick={() => { setEditingCategoryId(null); setCategoryName(""); setCategorySlug(""); setShowCategoryForm(!showCategoryForm); }}>
              {showCategoryForm ? "閉じる" : "+ カテゴリを追加"}
            </Button>

            {showCategoryForm && (
              <Card className="p-4">
                <div className="space-y-3">
                  <Input label="カテゴリ名" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
                  <Input label="スラッグ" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} placeholder="例: bat, glove" disabled={!!editingCategoryId} />
                  <Button className="w-full" onClick={handleSaveCategory} disabled={isSaving || !categoryName.trim()}>
                    {isSaving ? "保存中..." : editingCategoryId ? "更新" : "追加"}
                  </Button>
                </div>
              </Card>
            )}

            <div className="space-y-2">
              {categories.map((cat) => (
                <Card key={cat.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-400">slug: {cat.slug}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingCategoryId(cat.id);
                        setCategoryName(cat.name);
                        setCategorySlug(cat.slug);
                        setShowCategoryForm(true);
                      }}>
                        編集
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(cat.id)}>
                        削除
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
