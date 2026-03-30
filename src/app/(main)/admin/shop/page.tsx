"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const DEMO_CATEGORIES = [
  { id: "c1", name: "バット", slug: "bat", sort_order: 0 },
  { id: "c2", name: "グローブ", slug: "glove", sort_order: 1 },
  { id: "c3", name: "スパイク", slug: "spike", sort_order: 2 },
  { id: "c4", name: "ウェア", slug: "wear", sort_order: 3 },
  { id: "c5", name: "その他", slug: "other", sort_order: 4 },
];

const DEMO_PRODUCTS = [
  { id: "1", name: "ミズノ 少年軟式グローブ", brand: "ミズノ", category: "グローブ", price_min: 8800, is_active: true },
  { id: "2", name: "ゼット ブラックキャノン MAX", brand: "ゼット", category: "バット", price_min: 15000, is_active: true },
  { id: "3", name: "アシックス スターシャイン", brand: "アシックス", category: "スパイク", price_min: 4500, is_active: true },
  { id: "4", name: "SSK テクニカルTシャツ", brand: "SSK", category: "ウェア", price_min: 2200, is_active: false },
];

type Tab = "products" | "categories";

export default function AdminShopPage() {
  const [tab, setTab] = useState<Tab>("products");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // 商品フォーム
  const [productName, setProductName] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // カテゴリフォーム
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");

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
            <Button size="sm" onClick={() => setShowProductForm(!showProductForm)}>
              {showProductForm ? "閉じる" : "+ 商品を追加"}
            </Button>

            {showProductForm && (
              <Card className="p-4">
                <h3 className="mb-3 text-sm font-medium text-gray-900">商品登録</h3>
                <div className="space-y-3">
                  <Input label="商品名" value={productName} onChange={(e) => setProductName(e.target.value)} />
                  <Input label="ブランド" value={productBrand} onChange={(e) => setProductBrand(e.target.value)} />
                  <Select label="カテゴリ" value={productCategory} onChange={(e) => setProductCategory(e.target.value)}>
                    <option value="">選択...</option>
                    {DEMO_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                  <Textarea label="説明" value={productDescription} onChange={(e) => setProductDescription(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="最低価格" type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
                    <Input label="最高価格" type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">商品画像</label>
                    <input type="file" accept="image/*" multiple className="text-sm text-gray-500" />
                  </div>
                  <h4 className="text-xs font-medium text-gray-700">ECサイトリンク</h4>
                  <div className="space-y-2">
                    {["Amazon", "楽天市場", "Yahoo!ショッピング"].map((store) => (
                      <Input key={store} label={store} placeholder={`${store}の商品URL`} />
                    ))}
                  </div>
                  <Button className="w-full">登録</Button>
                </div>
              </Card>
            )}

            {/* 商品一覧 */}
            <div className="space-y-2">
              {DEMO_PRODUCTS.map((product) => (
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
                        {product.brand} · {product.category} · ¥{product.price_min.toLocaleString()}〜
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline">編集</Button>
                      <Button size="sm" variant="destructive">削除</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <Button size="sm" onClick={() => setShowCategoryForm(!showCategoryForm)}>
              {showCategoryForm ? "閉じる" : "+ カテゴリを追加"}
            </Button>

            {showCategoryForm && (
              <Card className="p-4">
                <div className="space-y-3">
                  <Input label="カテゴリ名" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
                  <Input label="スラッグ" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} placeholder="例: bat, glove" />
                  <Button className="w-full">追加</Button>
                </div>
              </Card>
            )}

            <div className="space-y-2">
              {DEMO_CATEGORIES.map((cat) => (
                <Card key={cat.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-400">slug: {cat.slug}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline">編集</Button>
                      <Button size="sm" variant="destructive">削除</Button>
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
