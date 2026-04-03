"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  getProductLinks,
  upsertProductLinks,
  getProductImages,
  uploadProductImage,
  deleteProductImage,
} from "@/lib/supabase/queries/shop";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { ShopCategory, ShopProduct, ShopProductImage } from "@/types";

type Tab = "products" | "categories";
type LinkMode = "url" | "html";
type ProductLinkForm = { store_name: string; url: string; mode: LinkMode };

const EC_SITE_OPTIONS = ["Amazon", "楽天市場", "Yahoo!ショッピング", "その他"] as const;

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
  const [productLinkForms, setProductLinkForms] = useState<ProductLinkForm[]>([]);
  const [existingImages, setExistingImages] = useState<ShopProductImage[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 編集中の商品IDを追跡（非同期fetch結果が古い場合に上書きを防ぐ）
  const editSessionRef = useRef<string | null>(null);

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
    setProductLinkForms([]);
    setExistingImages([]);
    setNewImageFiles([]);
    setEditingProductId(null);
    editSessionRef.current = null;
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

      const validLinks = productLinkForms
        .filter((l: ProductLinkForm) => l.mode === "html" ? l.url.trim() : l.store_name && l.url.trim())
        .map((l) => ({
          store_name: l.mode === "html" ? "楽天市場（HTML）" : l.store_name,
          url: l.url.trim(),
        }));

      let productId: string;
      if (editingProductId) {
        await updateShopProduct(editingProductId, data);
        await upsertProductLinks(editingProductId, validLinks);
        productId = editingProductId;
      } else {
        const newProduct = await createShopProduct(data);
        if (validLinks.length > 0) {
          await upsertProductLinks(newProduct.id, validLinks);
        }
        productId = newProduct.id;
      }

      // 新規画像をアップロード
      if (newImageFiles.length > 0) {
        const totalImages = existingImages.length + newImageFiles.length;
        if (totalImages > 5) {
          throw new Error("画像は最大5枚までです");
        }
        for (const file of newImageFiles) {
          await uploadProductImage(productId, file);
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

  const handleEditProduct = async (product: ShopProduct) => {
    resetProductForm();
    const sessionId = product.id;
    editSessionRef.current = sessionId;
    setEditingProductId(product.id);
    setProductName(product.name);
    setProductBrand(product.brand ?? "");
    setProductCategory(product.category_id ?? "");
    setProductDescription(product.description ?? "");
    setPriceMin(product.price_min?.toString() ?? "");
    setPriceMax(product.price_max?.toString() ?? "");
    setShowProductForm(true);
    try {
      const [links, images] = await Promise.all([
        getProductLinks(product.id),
        getProductImages(product.id),
      ]);
      // 非同期fetch中に別の商品の編集が開始された場合、古い結果を無視
      if (editSessionRef.current !== sessionId) return;
      setProductLinkForms(links.map((l) => ({
        store_name: l.store_name,
        url: l.url,
        mode: (l.url.trimStart().startsWith("<") ? "html" : "url") as LinkMode,
      })));
      setExistingImages(images);
    } catch {
      if (editSessionRef.current !== sessionId) return;
      setProductLinkForms([]);
      setExistingImages([]);
    }
  };

  const handleDeleteImage = async (image: ShopProductImage) => {
    try {
      await deleteProductImage(image.id, image.image_url);
      setExistingImages((prev) => prev.filter((img) => img.id !== image.id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const totalAllowed = 5 - existingImages.length;
    const selected = Array.from(files).slice(0, totalAllowed);
    setNewImageFiles(selected);
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
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      商品画像（最大5枚）
                    </label>
                    {/* 既存画像サムネイル */}
                    {existingImages.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {existingImages.map((img) => (
                          <div key={img.id} className="relative h-16 w-16 overflow-hidden rounded-lg border">
                            <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(img)}
                              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* 新規ファイル選択 */}
                    {existingImages.length < 5 && (
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        multiple
                        onChange={handleImageFileChange}
                        className="text-sm text-gray-500"
                      />
                    )}
                    {newImageFiles.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        {newImageFiles.length}件の画像を選択中（保存時にアップロード）
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-gray-700">購入リンク</h4>
                    <div className="space-y-3">
                      {productLinkForms.map((link, index) => (
                        <div key={index} className="rounded-lg border border-gray-200 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            {/* モード切替タブ */}
                            <div className="flex rounded-md border border-gray-300 text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...productLinkForms];
                                  updated[index] = { ...updated[index], mode: "url", url: "" };
                                  setProductLinkForms(updated);
                                }}
                                className={`rounded-l-md px-3 py-1 ${link.mode === "url" ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                              >
                                URLリンク
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...productLinkForms];
                                  updated[index] = { ...updated[index], mode: "html", store_name: "楽天市場（HTML）", url: "" };
                                  setProductLinkForms(updated);
                                }}
                                className={`rounded-r-md px-3 py-1 ${link.mode === "html" ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                              >
                                HTMLソース
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProductLinkForms(productLinkForms.filter((_, i) => i !== index))}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {link.mode === "url" ? (
                            <div className="space-y-1">
                              <Select
                                label=""
                                value={link.store_name}
                                onChange={(e) => {
                                  const updated = [...productLinkForms];
                                  updated[index] = { ...updated[index], store_name: e.target.value };
                                  setProductLinkForms(updated);
                                }}
                              >
                                <option value="">ECサイトを選択...</option>
                                {EC_SITE_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </Select>
                              <Input
                                label=""
                                placeholder="https://..."
                                value={link.url}
                                onChange={(e) => {
                                  const updated = [...productLinkForms];
                                  updated[index] = { ...updated[index], url: e.target.value };
                                  setProductLinkForms(updated);
                                }}
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Textarea
                                label=""
                                placeholder="楽天アフィリエイトのHTMLソースを貼り付け..."
                                value={link.url}
                                onChange={(e) => {
                                  const updated = [...productLinkForms];
                                  updated[index] = { ...updated[index], url: e.target.value };
                                  setProductLinkForms(updated);
                                }}
                                rows={5}
                              />
                              {link.url.trim() && (
                                <div>
                                  <p className="mb-1 text-xs font-medium text-gray-500">プレビュー:</p>
                                  <div
                                    className="rounded border border-gray-200 bg-white p-2"
                                    dangerouslySetInnerHTML={{ __html: link.url }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setProductLinkForms([...productLinkForms, { store_name: "", url: "", mode: "url" }])}
                      >
                        + リンク追加
                      </Button>
                    </div>
                  </div>
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
                const thumbUrl = product.images?.[0]?.image_url;
                return (
                  <Card key={product.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                        {thumbUrl ? (
                          <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate text-sm font-medium text-gray-900">{product.name}</h4>
                            <Badge variant={product.is_active ? "primary" : "default"}>
                              {product.is_active ? "公開" : "非公開"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {product.brand}{catName ? ` · ${catName}` : ""}{product.price_min != null ? ` · ¥${product.price_min.toLocaleString()}〜` : ""}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 gap-1">
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
