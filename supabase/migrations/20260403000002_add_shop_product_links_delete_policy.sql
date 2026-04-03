-- shop_product_links に DELETE ポリシーが欠落していたため、
-- upsertProductLinks() の DELETE → INSERT パターンで削除が失敗し、
-- リンクが更新のたびに重複していた問題を修正

DROP POLICY IF EXISTS "shop_product_links_delete_admin" ON shop_product_links;
CREATE POLICY "shop_product_links_delete_admin" ON shop_product_links FOR DELETE USING (
  EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
);
