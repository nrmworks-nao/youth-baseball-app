import { supabase } from "@/lib/supabase/client";
import type { ShopCategory, ShopProduct, TeamPinnedProduct } from "@/types";

// === カテゴリ ===

/** カテゴリ一覧取得 */
export async function getShopCategories() {
  const { data, error } = await supabase
    .from("shop_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as ShopCategory[];
}

/** カテゴリ作成 */
export async function createShopCategory(data: {
  name: string;
  slug: string;
  description?: string;
  sort_order?: number;
}) {
  const { data: category, error } = await supabase
    .from("shop_categories")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return category as ShopCategory;
}

/** カテゴリ更新 */
export async function updateShopCategory(
  id: string,
  data: { name?: string; description?: string; sort_order?: number }
) {
  const { data: category, error } = await supabase
    .from("shop_categories")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return category as ShopCategory;
}

/** カテゴリ削除 */
export async function deleteShopCategory(id: string) {
  const { error } = await supabase.from("shop_categories").delete().eq("id", id);
  if (error) throw error;
}

// === 商品 ===

/** 商品一覧取得 */
export async function getShopProducts(categoryId?: string) {
  let query = supabase
    .from("shop_products")
    .select("*, shop_categories(name, slug), shop_product_images(id, image_url, sort_order)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as ShopProduct[];
}

/** 商品詳細取得 */
export async function getShopProduct(productId: string) {
  const { data, error } = await supabase
    .from("shop_products")
    .select(
      "*, shop_categories(name, slug), shop_product_images(id, image_url, sort_order), shop_product_links(id, store_name, url, price, sort_order)"
    )
    .eq("id", productId)
    .single();
  if (error) throw error;
  return data as ShopProduct;
}

/** 商品作成 */
export async function createShopProduct(data: {
  category_id?: string;
  name: string;
  description?: string;
  brand?: string;
  price_min?: number;
  price_max?: number;
  age_group?: string;
}) {
  const { data: product, error } = await supabase
    .from("shop_products")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return product as ShopProduct;
}

/** 商品更新 */
export async function updateShopProduct(
  id: string,
  data: Partial<{
    category_id: string;
    name: string;
    description: string;
    brand: string;
    price_min: number;
    price_max: number;
    age_group: string;
    is_active: boolean;
  }>
) {
  const { data: product, error } = await supabase
    .from("shop_products")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return product as ShopProduct;
}

/** 商品削除 */
export async function deleteShopProduct(id: string) {
  const { error } = await supabase.from("shop_products").delete().eq("id", id);
  if (error) throw error;
}

// === チームおすすめ ===

/** チームのおすすめ商品一覧 */
export async function getTeamPinnedProducts(teamId: string) {
  const { data, error } = await supabase
    .from("team_pinned_products")
    .select(
      "*, shop_products(*, shop_categories(name), shop_product_images(image_url, sort_order)), users!team_pinned_products_pinned_by_fkey(display_name)"
    )
    .eq("team_id", teamId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as TeamPinnedProduct[];
}

/** おすすめ追加 */
export async function pinProduct(data: {
  team_id: string;
  product_id: string;
  comment: string;
  pinned_by: string;
}) {
  const { data: pinned, error } = await supabase
    .from("team_pinned_products")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return pinned as TeamPinnedProduct;
}

/** おすすめ解除 */
export async function unpinProduct(teamId: string, productId: string) {
  const { error } = await supabase
    .from("team_pinned_products")
    .delete()
    .eq("team_id", teamId)
    .eq("product_id", productId);
  if (error) throw error;
}
