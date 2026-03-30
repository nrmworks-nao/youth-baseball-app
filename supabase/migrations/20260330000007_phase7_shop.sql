-- Phase 7: 買い物
-- shop_categories, shop_products, shop_product_images, shop_product_links, team_pinned_products

-- ============================================================
-- shop_categories テーブル
-- ============================================================
CREATE TABLE shop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES shop_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;

-- 全認証ユーザー閲覧可
CREATE POLICY "shop_categories_select_all" ON shop_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- system_adminのみ管理可
CREATE POLICY "shop_categories_insert_admin" ON shop_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "shop_categories_update_admin" ON shop_categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "shop_categories_delete_admin" ON shop_categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

-- ============================================================
-- shop_products テーブル
-- ============================================================
CREATE TABLE shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES shop_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  price_min INTEGER, -- 最低価格（参考）
  price_max INTEGER, -- 最高価格（参考）
  age_group TEXT, -- 低学年, 高学年, 中学生, all
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shop_products_category_id ON shop_products(category_id);

ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;

-- 全認証ユーザー閲覧可
CREATE POLICY "shop_products_select_all" ON shop_products
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- system_adminのみ管理可
CREATE POLICY "shop_products_insert_admin" ON shop_products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "shop_products_update_admin" ON shop_products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "shop_products_delete_admin" ON shop_products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

-- ============================================================
-- shop_product_images テーブル
-- ============================================================
CREATE TABLE shop_product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shop_product_images_product_id ON shop_product_images(product_id);

ALTER TABLE shop_product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_product_images_select_all" ON shop_product_images
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "shop_product_images_insert_admin" ON shop_product_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "shop_product_images_delete_admin" ON shop_product_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

-- ============================================================
-- shop_product_links テーブル（ECサイトへのリンク）
-- ============================================================
CREATE TABLE shop_product_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL, -- Amazon, 楽天, Yahoo 等
  url TEXT NOT NULL,
  price INTEGER, -- そのストアでの価格
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shop_product_links_product_id ON shop_product_links(product_id);

ALTER TABLE shop_product_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_product_links_select_all" ON shop_product_links
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "shop_product_links_insert_admin" ON shop_product_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "shop_product_links_update_admin" ON shop_product_links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

-- ============================================================
-- team_pinned_products テーブル（チームおすすめ商品）
-- ============================================================
CREATE TABLE team_pinned_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  comment TEXT, -- おすすめコメント
  pinned_by UUID NOT NULL REFERENCES users(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, product_id)
);

CREATE INDEX idx_team_pinned_products_team_id ON team_pinned_products(team_id);

ALTER TABLE team_pinned_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_pinned_products_select_team" ON team_pinned_products
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "team_pinned_products_insert" ON team_pinned_products
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "team_pinned_products_delete" ON team_pinned_products
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

-- updated_at トリガー
CREATE TRIGGER set_updated_at_shop_products BEFORE UPDATE ON shop_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_shop_product_links BEFORE UPDATE ON shop_product_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
