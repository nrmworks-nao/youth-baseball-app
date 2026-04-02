-- パート3: アルバム・会計・ショップ テーブルのRLSポリシー修正
-- permission_group を新ロール名に変更、is_admin フラグ対応

-- ============================================================
-- アルバム
-- ============================================================

-- albums: SELECT はチームメンバー全員
DROP POLICY IF EXISTS "albums_select_team" ON albums;
CREATE POLICY "albums_select_team" ON albums FOR SELECT USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);

-- albums: INSERT — director, president, captain, coach, publicity + is_admin
DROP POLICY IF EXISTS "albums_insert" ON albums;
CREATE POLICY "albums_insert" ON albums FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('director', 'president', 'captain', 'coach', 'publicity') OR is_admin = true))
);

-- albums: UPDATE — director, president, captain, coach, publicity + is_admin
DROP POLICY IF EXISTS "albums_update" ON albums;
CREATE POLICY "albums_update" ON albums FOR UPDATE USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('director', 'president', 'captain', 'coach', 'publicity') OR is_admin = true))
);

-- albums: DELETE — director, president, captain, coach, publicity + is_admin
DROP POLICY IF EXISTS "albums_delete" ON albums;
CREATE POLICY "albums_delete" ON albums FOR DELETE USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('director', 'president', 'captain', 'coach', 'publicity') OR is_admin = true))
);

-- album_photos: SELECT はチームメンバー全員
DROP POLICY IF EXISTS "album_photos_select_team" ON album_photos;
CREATE POLICY "album_photos_select_team" ON album_photos FOR SELECT USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);

-- album_photos: INSERT — 全ロール（チームメンバー）
DROP POLICY IF EXISTS "album_photos_insert" ON album_photos;
CREATE POLICY "album_photos_insert" ON album_photos FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);

-- album_photos: DELETE — director, president, captain, coach, publicity + is_admin + アップロード者本人
DROP POLICY IF EXISTS "album_photos_delete" ON album_photos;
CREATE POLICY "album_photos_delete" ON album_photos FOR DELETE USING (
  uploaded_by = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('director', 'president', 'captain', 'coach', 'publicity') OR is_admin = true))
);

-- ============================================================
-- 会計
-- ============================================================

-- fee_settings: SELECT はチームメンバー全員
DROP POLICY IF EXISTS "fee_settings_select_team" ON fee_settings;
CREATE POLICY "fee_settings_select_team" ON fee_settings FOR SELECT USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);

-- fee_settings: INSERT — president, vice_president, treasurer + is_admin
DROP POLICY IF EXISTS "fee_settings_insert" ON fee_settings;
CREATE POLICY "fee_settings_insert" ON fee_settings FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'vice_president', 'treasurer') OR is_admin = true))
);

-- fee_settings: UPDATE — president, vice_president, treasurer + is_admin
DROP POLICY IF EXISTS "fee_settings_update" ON fee_settings;
CREATE POLICY "fee_settings_update" ON fee_settings FOR UPDATE USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'vice_president', 'treasurer') OR is_admin = true))
);

-- fee_settings: DELETE — president, vice_president, treasurer + is_admin
DROP POLICY IF EXISTS "fee_settings_delete" ON fee_settings;
CREATE POLICY "fee_settings_delete" ON fee_settings FOR DELETE USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'vice_president', 'treasurer') OR is_admin = true))
);

-- invoices: SELECT — president, vice_president, treasurer + is_admin は全件
DROP POLICY IF EXISTS "invoices_select_admin_treasurer" ON invoices;
CREATE POLICY "invoices_select_admin_treasurer" ON invoices FOR SELECT USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'vice_president', 'treasurer') OR is_admin = true))
);

-- invoices: SELECT — 保護者は自分宛のみ
DROP POLICY IF EXISTS "invoices_select_own" ON invoices;
CREATE POLICY "invoices_select_own" ON invoices FOR SELECT USING (
  target_user_id = auth.uid()
);

-- invoices: INSERT — president, vice_president, treasurer + is_admin
DROP POLICY IF EXISTS "invoices_insert" ON invoices;
CREATE POLICY "invoices_insert" ON invoices FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'vice_president', 'treasurer') OR is_admin = true))
);

-- invoices: UPDATE — president, vice_president, treasurer + is_admin
DROP POLICY IF EXISTS "invoices_update" ON invoices;
CREATE POLICY "invoices_update" ON invoices FOR UPDATE USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'vice_president', 'treasurer') OR is_admin = true))
);

-- invoices: DELETE — president + is_admin
DROP POLICY IF EXISTS "invoices_delete" ON invoices;
CREATE POLICY "invoices_delete" ON invoices FOR DELETE USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group = 'president' OR is_admin = true))
);

-- invoice_items: SELECT — president, vice_president, treasurer + is_admin は全件
DROP POLICY IF EXISTS "invoice_items_select_admin_treasurer" ON invoice_items;
CREATE POLICY "invoice_items_select_admin_treasurer" ON invoice_items FOR SELECT USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'vice_president', 'treasurer') OR is_admin = true))
);

-- invoice_items: SELECT — 保護者は自分宛の請求書に紐づく明細のみ
DROP POLICY IF EXISTS "invoice_items_select_own" ON invoice_items;
CREATE POLICY "invoice_items_select_own" ON invoice_items FOR SELECT USING (
  invoice_id IN (SELECT id FROM invoices WHERE target_user_id = auth.uid())
);

-- invoice_items: INSERT — president, vice_president, treasurer + is_admin
DROP POLICY IF EXISTS "invoice_items_insert" ON invoice_items;
CREATE POLICY "invoice_items_insert" ON invoice_items FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'vice_president', 'treasurer') OR is_admin = true))
);

-- invoice_items: UPDATE — president, vice_president, treasurer + is_admin
DROP POLICY IF EXISTS "invoice_items_update" ON invoice_items;
CREATE POLICY "invoice_items_update" ON invoice_items FOR UPDATE USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'vice_president', 'treasurer') OR is_admin = true))
);

-- invoice_items: DELETE — president, vice_president, treasurer + is_admin
DROP POLICY IF EXISTS "invoice_items_delete" ON invoice_items;
CREATE POLICY "invoice_items_delete" ON invoice_items FOR DELETE USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'vice_president', 'treasurer') OR is_admin = true))
);

-- payments: SELECT — president, treasurer + is_admin は全件
DROP POLICY IF EXISTS "payments_select_admin_treasurer" ON payments;
CREATE POLICY "payments_select_admin_treasurer" ON payments FOR SELECT USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'treasurer') OR is_admin = true))
);

-- payments: SELECT — 保護者は自分のデータのみ
DROP POLICY IF EXISTS "payments_select_own" ON payments;
CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (
  payer_user_id = auth.uid()
);

-- payments: INSERT — president, treasurer + is_admin
DROP POLICY IF EXISTS "payments_insert" ON payments;
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'treasurer') OR is_admin = true))
);

-- payments: UPDATE — president, treasurer + is_admin
DROP POLICY IF EXISTS "payments_update" ON payments;
CREATE POLICY "payments_update" ON payments FOR UPDATE USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'treasurer') OR is_admin = true))
);

-- payments: DELETE — president + is_admin
DROP POLICY IF EXISTS "payments_delete" ON payments;
CREATE POLICY "payments_delete" ON payments FOR DELETE USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group = 'president' OR is_admin = true))
);

-- ledger_entries: SELECT — director, president, vice_president, treasurer + is_admin
DROP POLICY IF EXISTS "ledger_entries_select_admin_treasurer" ON ledger_entries;
CREATE POLICY "ledger_entries_select_admin_treasurer" ON ledger_entries FOR SELECT USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('director', 'president', 'vice_president', 'treasurer') OR is_admin = true))
);

-- ledger_entries: INSERT — president, treasurer + is_admin
DROP POLICY IF EXISTS "ledger_entries_insert" ON ledger_entries;
CREATE POLICY "ledger_entries_insert" ON ledger_entries FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'treasurer') OR is_admin = true))
);

-- ledger_entries: UPDATE — president, treasurer + is_admin
DROP POLICY IF EXISTS "ledger_entries_update" ON ledger_entries;
CREATE POLICY "ledger_entries_update" ON ledger_entries FOR UPDATE USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'treasurer') OR is_admin = true))
);

-- ledger_entries: DELETE — president, treasurer + is_admin
DROP POLICY IF EXISTS "ledger_entries_delete" ON ledger_entries;
CREATE POLICY "ledger_entries_delete" ON ledger_entries FOR DELETE USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('president', 'treasurer') OR is_admin = true))
);

-- ============================================================
-- ショップ
-- ============================================================

-- shop_categories: SELECT は認証済みユーザー全員
DROP POLICY IF EXISTS "shop_categories_select_all" ON shop_categories;
CREATE POLICY "shop_categories_select_all" ON shop_categories FOR SELECT USING (auth.uid() IS NOT NULL);

-- shop_categories: INSERT — is_admin のみ
DROP POLICY IF EXISTS "shop_categories_insert_admin" ON shop_categories;
CREATE POLICY "shop_categories_insert_admin" ON shop_categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
);

-- shop_categories: UPDATE — is_admin のみ
DROP POLICY IF EXISTS "shop_categories_update_admin" ON shop_categories;
CREATE POLICY "shop_categories_update_admin" ON shop_categories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
);

-- shop_categories: DELETE — is_admin のみ
DROP POLICY IF EXISTS "shop_categories_delete_admin" ON shop_categories;
CREATE POLICY "shop_categories_delete_admin" ON shop_categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
);

-- shop_products: SELECT は認証済みユーザー全員
DROP POLICY IF EXISTS "shop_products_select_all" ON shop_products;
CREATE POLICY "shop_products_select_all" ON shop_products FOR SELECT USING (auth.uid() IS NOT NULL);

-- shop_products: INSERT — is_admin のみ
DROP POLICY IF EXISTS "shop_products_insert_admin" ON shop_products;
CREATE POLICY "shop_products_insert_admin" ON shop_products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
);

-- shop_products: UPDATE — is_admin のみ
DROP POLICY IF EXISTS "shop_products_update_admin" ON shop_products;
CREATE POLICY "shop_products_update_admin" ON shop_products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
);

-- shop_products: DELETE — is_admin のみ
DROP POLICY IF EXISTS "shop_products_delete_admin" ON shop_products;
CREATE POLICY "shop_products_delete_admin" ON shop_products FOR DELETE USING (
  EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
);

-- shop_product_images: SELECT は認証済みユーザー全員
DROP POLICY IF EXISTS "shop_product_images_select_all" ON shop_product_images;
CREATE POLICY "shop_product_images_select_all" ON shop_product_images FOR SELECT USING (auth.uid() IS NOT NULL);

-- shop_product_images: INSERT — is_admin のみ
DROP POLICY IF EXISTS "shop_product_images_insert_admin" ON shop_product_images;
CREATE POLICY "shop_product_images_insert_admin" ON shop_product_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
);

-- shop_product_images: DELETE — is_admin のみ
DROP POLICY IF EXISTS "shop_product_images_delete_admin" ON shop_product_images;
CREATE POLICY "shop_product_images_delete_admin" ON shop_product_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
);

-- shop_product_links: SELECT は認証済みユーザー全員
DROP POLICY IF EXISTS "shop_product_links_select_all" ON shop_product_links;
CREATE POLICY "shop_product_links_select_all" ON shop_product_links FOR SELECT USING (auth.uid() IS NOT NULL);

-- shop_product_links: INSERT — is_admin のみ
DROP POLICY IF EXISTS "shop_product_links_insert_admin" ON shop_product_links;
CREATE POLICY "shop_product_links_insert_admin" ON shop_product_links FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
);

-- shop_product_links: UPDATE — is_admin のみ
DROP POLICY IF EXISTS "shop_product_links_update_admin" ON shop_product_links;
CREATE POLICY "shop_product_links_update_admin" ON shop_product_links FOR UPDATE USING (
  EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
);

-- shop_product_links: DELETE — is_admin のみ
DROP POLICY IF EXISTS "shop_product_links_delete_admin" ON shop_product_links;
CREATE POLICY "shop_product_links_delete_admin" ON shop_product_links FOR DELETE USING (
  EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
);

-- team_pinned_products: SELECT はチームメンバー全員
DROP POLICY IF EXISTS "team_pinned_products_select_team" ON team_pinned_products;
CREATE POLICY "team_pinned_products_select_team" ON team_pinned_products FOR SELECT USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
);

-- team_pinned_products: INSERT — director, president + is_admin
DROP POLICY IF EXISTS "team_pinned_products_insert" ON team_pinned_products;
CREATE POLICY "team_pinned_products_insert" ON team_pinned_products FOR INSERT WITH CHECK (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('director', 'president') OR is_admin = true))
);

-- team_pinned_products: UPDATE — director, president + is_admin
DROP POLICY IF EXISTS "team_pinned_products_update" ON team_pinned_products;
CREATE POLICY "team_pinned_products_update" ON team_pinned_products FOR UPDATE USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('director', 'president') OR is_admin = true))
);

-- team_pinned_products: DELETE — director, president + is_admin
DROP POLICY IF EXISTS "team_pinned_products_delete" ON team_pinned_products;
CREATE POLICY "team_pinned_products_delete" ON team_pinned_products FOR DELETE USING (
  team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND (permission_group IN ('director', 'president') OR is_admin = true))
);
