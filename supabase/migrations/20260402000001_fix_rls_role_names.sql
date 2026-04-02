-- RLSポリシーのロール名を新しい権限グループ名に修正
-- 旧: system_admin, team_admin, manager
-- 新: director, coach (+ is_admin フラグはサイト管理用)
--
-- 対象ファイル:
--   20260330100001_rls_policies_all_idempotent.sql
--   20260331000002_rls_invite_member_registration.sql
--   20260331000005_phase4_schema_alignment.sql

-- ============================================================
-- teams
-- ============================================================
-- teams_update_admin は 20260331000002 で teams_update_admin_vp に置き換え済み
DROP POLICY IF EXISTS "teams_update_admin_vp" ON teams;
CREATE POLICY "teams_update_admin_vp" ON teams
  FOR UPDATE USING (
    id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president') OR is_admin = true)
    )
  );

-- ============================================================
-- team_members
-- ============================================================
DROP POLICY IF EXISTS "team_members_insert_admin" ON team_members;
CREATE POLICY "team_members_insert_admin" ON team_members
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
    OR user_id = auth.uid()
  );

-- team_members_update_admin は 20260331000002 で team_members_update_admin_vp に置き換え済み
DROP POLICY IF EXISTS "team_members_update_admin_vp" ON team_members;
CREATE POLICY "team_members_update_admin_vp" ON team_members
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president') OR is_admin = true)
    )
  );

-- team_members_delete_admin は 20260331000002 で team_members_delete_admin_vp に置き換え済み
DROP POLICY IF EXISTS "team_members_delete_admin_vp" ON team_members;
CREATE POLICY "team_members_delete_admin_vp" ON team_members
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president') OR is_admin = true)
    )
    OR user_id = auth.uid()
  );

-- ============================================================
-- players
-- ============================================================
-- players_insert は 20260331000002 で players_insert_admin_manager_parent に置き換え済み
DROP POLICY IF EXISTS "players_insert_admin_manager_parent" ON players;
CREATE POLICY "players_insert_admin_manager_parent" ON players
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'parent'
    )
  );

-- players_update は 20260331000002 で players_update_admin_manager_parent に置き換え済み
DROP POLICY IF EXISTS "players_update_admin_manager_parent" ON players;
CREATE POLICY "players_update_admin_manager_parent" ON players
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach', 'vice_president') OR is_admin = true)
    )
    OR id IN (
      SELECT player_id FROM user_children WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "players_delete_admin" ON players;
CREATE POLICY "players_delete_admin" ON players
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

-- ============================================================
-- user_children
-- ============================================================
DROP POLICY IF EXISTS "user_children_insert" ON user_children;
CREATE POLICY "user_children_insert" ON user_children
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "user_children_delete" ON user_children;
CREATE POLICY "user_children_delete" ON user_children
  FOR DELETE USING (
    user_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

-- ============================================================
-- events
-- ============================================================
DROP POLICY IF EXISTS "events_insert" ON events;
CREATE POLICY "events_insert" ON events
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "events_update" ON events;
CREATE POLICY "events_update" ON events
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "events_delete" ON events;
CREATE POLICY "events_delete" ON events
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
    )
  );

-- ============================================================
-- event_attendances
-- ============================================================
DROP POLICY IF EXISTS "event_attendances_insert" ON event_attendances;
CREATE POLICY "event_attendances_insert" ON event_attendances
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
    )
    OR user_id = auth.uid()
    OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "event_attendances_update" ON event_attendances;
CREATE POLICY "event_attendances_update" ON event_attendances
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
    )
    OR user_id = auth.uid()
    OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
  );

-- ============================================================
-- posts
-- ============================================================
DROP POLICY IF EXISTS "posts_insert" ON posts;
CREATE POLICY "posts_insert" ON posts
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president', 'coach', 'publicity') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "posts_update" ON posts;
CREATE POLICY "posts_update" ON posts
  FOR UPDATE USING (
    author_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "posts_delete" ON posts;
CREATE POLICY "posts_delete" ON posts
  FOR DELETE USING (
    author_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

-- ============================================================
-- post_comments
-- ============================================================
DROP POLICY IF EXISTS "post_comments_delete" ON post_comments;
CREATE POLICY "post_comments_delete" ON post_comments
  FOR DELETE USING (
    user_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

-- ============================================================
-- games
-- ============================================================
DROP POLICY IF EXISTS "games_insert" ON games;
CREATE POLICY "games_insert" ON games
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "games_update" ON games;
CREATE POLICY "games_update" ON games
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "games_delete" ON games;
CREATE POLICY "games_delete" ON games
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

-- ============================================================
-- game_scorebook_images
-- ============================================================
DROP POLICY IF EXISTS "game_scorebook_images_insert" ON game_scorebook_images;
CREATE POLICY "game_scorebook_images_insert" ON game_scorebook_images
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "game_scorebook_images_delete" ON game_scorebook_images;
CREATE POLICY "game_scorebook_images_delete" ON game_scorebook_images
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

-- ============================================================
-- game_lineups
-- ============================================================
DROP POLICY IF EXISTS "game_lineups_insert" ON game_lineups;
CREATE POLICY "game_lineups_insert" ON game_lineups
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "game_lineups_update" ON game_lineups;
CREATE POLICY "game_lineups_update" ON game_lineups
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "game_lineups_delete" ON game_lineups;
CREATE POLICY "game_lineups_delete" ON game_lineups
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

-- ============================================================
-- player_game_stats
-- ============================================================
DROP POLICY IF EXISTS "player_game_stats_insert" ON player_game_stats;
CREATE POLICY "player_game_stats_insert" ON player_game_stats
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "player_game_stats_update" ON player_game_stats;
CREATE POLICY "player_game_stats_update" ON player_game_stats
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

-- ============================================================
-- player_measurements
-- ============================================================
DROP POLICY IF EXISTS "player_measurements_select_admin_manager" ON player_measurements;
CREATE POLICY "player_measurements_select_admin_coach" ON player_measurements
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "player_measurements_insert" ON player_measurements;
CREATE POLICY "player_measurements_insert" ON player_measurements
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
    OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "player_measurements_update" ON player_measurements;
CREATE POLICY "player_measurements_update" ON player_measurements
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
    OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
  );

-- ============================================================
-- player_fitness_records
-- ============================================================
DROP POLICY IF EXISTS "player_fitness_records_insert" ON player_fitness_records;
CREATE POLICY "player_fitness_records_insert" ON player_fitness_records
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "player_fitness_records_update" ON player_fitness_records;
CREATE POLICY "player_fitness_records_update" ON player_fitness_records
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

-- ============================================================
-- badge_definitions
-- ============================================================
DROP POLICY IF EXISTS "badge_definitions_insert" ON badge_definitions;
CREATE POLICY "badge_definitions_insert" ON badge_definitions
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "badge_definitions_update" ON badge_definitions;
CREATE POLICY "badge_definitions_update" ON badge_definitions
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

-- ============================================================
-- player_badges
-- ============================================================
DROP POLICY IF EXISTS "player_badges_insert" ON player_badges;
CREATE POLICY "player_badges_insert" ON player_badges
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

-- ============================================================
-- player_milestones
-- ============================================================
DROP POLICY IF EXISTS "player_milestones_insert" ON player_milestones;
CREATE POLICY "player_milestones_insert" ON player_milestones
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

-- ============================================================
-- milestone_comments
-- ============================================================
DROP POLICY IF EXISTS "milestone_comments_delete" ON milestone_comments;
CREATE POLICY "milestone_comments_delete" ON milestone_comments
  FOR DELETE USING (
    user_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

-- ============================================================
-- weekly_awards
-- ============================================================
DROP POLICY IF EXISTS "weekly_awards_insert" ON weekly_awards;
CREATE POLICY "weekly_awards_insert" ON weekly_awards
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "weekly_awards_update" ON weekly_awards;
CREATE POLICY "weekly_awards_update" ON weekly_awards
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

-- ============================================================
-- player_goals
-- ============================================================
DROP POLICY IF EXISTS "player_goals_insert" ON player_goals;
CREATE POLICY "player_goals_insert" ON player_goals
  FOR INSERT WITH CHECK (
    player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "player_goals_update" ON player_goals;
CREATE POLICY "player_goals_update" ON player_goals
  FOR UPDATE USING (
    player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

-- ============================================================
-- goal_comments
-- ============================================================
DROP POLICY IF EXISTS "goal_comments_delete" ON goal_comments;
CREATE POLICY "goal_comments_delete" ON goal_comments
  FOR DELETE USING (
    user_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

-- ============================================================
-- team_challenges
-- ============================================================
DROP POLICY IF EXISTS "team_challenges_insert" ON team_challenges;
CREATE POLICY "team_challenges_insert" ON team_challenges
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "team_challenges_update" ON team_challenges;
CREATE POLICY "team_challenges_update" ON team_challenges
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

-- ============================================================
-- best_plays
-- ============================================================
DROP POLICY IF EXISTS "best_plays_insert" ON best_plays;
CREATE POLICY "best_plays_insert" ON best_plays
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach', 'publicity') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "best_plays_delete" ON best_plays;
CREATE POLICY "best_plays_delete" ON best_plays
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

-- ============================================================
-- monthly_reviews
-- ============================================================
DROP POLICY IF EXISTS "monthly_reviews_insert" ON monthly_reviews;
CREATE POLICY "monthly_reviews_insert" ON monthly_reviews
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "monthly_reviews_update" ON monthly_reviews;
CREATE POLICY "monthly_reviews_update" ON monthly_reviews
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
    OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
  );

-- ============================================================
-- albums
-- ============================================================
DROP POLICY IF EXISTS "albums_insert" ON albums;
CREATE POLICY "albums_insert" ON albums
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'publicity') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "albums_update" ON albums;
CREATE POLICY "albums_update" ON albums
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'publicity') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "albums_delete" ON albums;
CREATE POLICY "albums_delete" ON albums
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

-- ============================================================
-- album_photos
-- ============================================================
DROP POLICY IF EXISTS "album_photos_insert" ON album_photos;
CREATE POLICY "album_photos_insert" ON album_photos
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'publicity', 'parent') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "album_photos_delete" ON album_photos;
CREATE POLICY "album_photos_delete" ON album_photos
  FOR DELETE USING (
    uploaded_by = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'publicity') OR is_admin = true)
    )
  );

-- ============================================================
-- fee_settings
-- ============================================================
DROP POLICY IF EXISTS "fee_settings_insert" ON fee_settings;
CREATE POLICY "fee_settings_insert" ON fee_settings
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'treasurer') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "fee_settings_update" ON fee_settings;
CREATE POLICY "fee_settings_update" ON fee_settings
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'treasurer') OR is_admin = true)
    )
  );

-- ============================================================
-- invoices
-- ============================================================
DROP POLICY IF EXISTS "invoices_select_admin_treasurer" ON invoices;
CREATE POLICY "invoices_select_admin_treasurer" ON invoices
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'treasurer') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "invoices_insert" ON invoices;
CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'treasurer') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "invoices_update" ON invoices;
CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'treasurer') OR is_admin = true)
    )
  );

-- ============================================================
-- invoice_items
-- ============================================================
DROP POLICY IF EXISTS "invoice_items_select_admin_treasurer" ON invoice_items;
CREATE POLICY "invoice_items_select_admin_treasurer" ON invoice_items
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'treasurer') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "invoice_items_insert" ON invoice_items;
CREATE POLICY "invoice_items_insert" ON invoice_items
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'treasurer') OR is_admin = true)
    )
  );

-- ============================================================
-- payments
-- ============================================================
DROP POLICY IF EXISTS "payments_select_admin_treasurer" ON payments;
CREATE POLICY "payments_select_admin_treasurer" ON payments
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'treasurer') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "payments_insert" ON payments;
CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'treasurer') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "payments_update" ON payments;
CREATE POLICY "payments_update" ON payments
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'treasurer') OR is_admin = true)
    )
  );

-- ============================================================
-- ledger_entries
-- ============================================================
DROP POLICY IF EXISTS "ledger_entries_select_admin_treasurer" ON ledger_entries;
CREATE POLICY "ledger_entries_select_admin_treasurer" ON ledger_entries
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'treasurer') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "ledger_entries_insert" ON ledger_entries;
CREATE POLICY "ledger_entries_insert" ON ledger_entries
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'treasurer') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "ledger_entries_update" ON ledger_entries;
CREATE POLICY "ledger_entries_update" ON ledger_entries
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'treasurer') OR is_admin = true)
    )
  );

-- ============================================================
-- shop_categories (サイト管理者のみ = is_admin)
-- ============================================================
DROP POLICY IF EXISTS "shop_categories_insert_admin" ON shop_categories;
CREATE POLICY "shop_categories_insert_admin" ON shop_categories
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "shop_categories_update_admin" ON shop_categories;
CREATE POLICY "shop_categories_update_admin" ON shop_categories
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "shop_categories_delete_admin" ON shop_categories;
CREATE POLICY "shop_categories_delete_admin" ON shop_categories
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- shop_products (サイト管理者のみ = is_admin)
-- ============================================================
DROP POLICY IF EXISTS "shop_products_insert_admin" ON shop_products;
CREATE POLICY "shop_products_insert_admin" ON shop_products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "shop_products_update_admin" ON shop_products;
CREATE POLICY "shop_products_update_admin" ON shop_products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "shop_products_delete_admin" ON shop_products;
CREATE POLICY "shop_products_delete_admin" ON shop_products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- shop_product_images (サイト管理者のみ = is_admin)
-- ============================================================
DROP POLICY IF EXISTS "shop_product_images_insert_admin" ON shop_product_images;
CREATE POLICY "shop_product_images_insert_admin" ON shop_product_images
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "shop_product_images_delete_admin" ON shop_product_images;
CREATE POLICY "shop_product_images_delete_admin" ON shop_product_images
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- shop_product_links (サイト管理者のみ = is_admin)
-- ============================================================
DROP POLICY IF EXISTS "shop_product_links_insert_admin" ON shop_product_links;
CREATE POLICY "shop_product_links_insert_admin" ON shop_product_links
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "shop_product_links_update_admin" ON shop_product_links;
CREATE POLICY "shop_product_links_update_admin" ON shop_product_links
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- team_pinned_products
-- ============================================================
DROP POLICY IF EXISTS "team_pinned_products_insert" ON team_pinned_products;
CREATE POLICY "team_pinned_products_insert" ON team_pinned_products
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "team_pinned_products_delete" ON team_pinned_products;
CREATE POLICY "team_pinned_products_delete" ON team_pinned_products
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

-- ============================================================
-- team_profiles
-- ============================================================
DROP POLICY IF EXISTS "team_profiles_insert" ON team_profiles;
CREATE POLICY "team_profiles_insert" ON team_profiles
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "team_profiles_update" ON team_profiles;
CREATE POLICY "team_profiles_update" ON team_profiles
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

-- ============================================================
-- team_line_config
-- ============================================================
DROP POLICY IF EXISTS "team_line_config_select" ON team_line_config;
CREATE POLICY "team_line_config_select" ON team_line_config
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "team_line_config_insert" ON team_line_config;
CREATE POLICY "team_line_config_insert" ON team_line_config
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "team_line_config_update" ON team_line_config;
CREATE POLICY "team_line_config_update" ON team_line_config
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group = 'director' OR is_admin = true)
    )
  );

-- ============================================================
-- inter_team_messages
-- ============================================================
DROP POLICY IF EXISTS "inter_team_messages_select" ON inter_team_messages;
CREATE POLICY "inter_team_messages_select" ON inter_team_messages
  FOR SELECT USING (
    from_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president') OR is_admin = true)
    )
    OR to_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "inter_team_messages_insert" ON inter_team_messages;
CREATE POLICY "inter_team_messages_insert" ON inter_team_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND from_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "inter_team_messages_update" ON inter_team_messages;
CREATE POLICY "inter_team_messages_update" ON inter_team_messages
  FOR UPDATE USING (
    to_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president') OR is_admin = true)
    )
  );

-- ============================================================
-- match_requests
-- ============================================================
DROP POLICY IF EXISTS "match_requests_select" ON match_requests;
CREATE POLICY "match_requests_select" ON match_requests
  FOR SELECT USING (
    from_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
    )
    OR to_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "match_requests_insert" ON match_requests;
CREATE POLICY "match_requests_insert" ON match_requests
  FOR INSERT WITH CHECK (
    requested_by = auth.uid()
    AND from_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "match_requests_update" ON match_requests;
CREATE POLICY "match_requests_update" ON match_requests
  FOR UPDATE USING (
    from_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
    )
    OR to_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
    )
  );

-- ============================================================
-- match_request_dates
-- ============================================================
DROP POLICY IF EXISTS "match_request_dates_select" ON match_request_dates;
CREATE POLICY "match_request_dates_select" ON match_request_dates
  FOR SELECT USING (
    match_request_id IN (
      SELECT id FROM match_requests
      WHERE from_team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
          AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
      )
      OR to_team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
          AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
      )
    )
  );

DROP POLICY IF EXISTS "match_request_dates_insert" ON match_request_dates;
CREATE POLICY "match_request_dates_insert" ON match_request_dates
  FOR INSERT WITH CHECK (
    match_request_id IN (
      SELECT id FROM match_requests
      WHERE from_team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
          AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
      )
    )
  );

DROP POLICY IF EXISTS "match_request_dates_update" ON match_request_dates;
CREATE POLICY "match_request_dates_update" ON match_request_dates
  FOR UPDATE USING (
    match_request_id IN (
      SELECT id FROM match_requests
      WHERE from_team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
          AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
      )
      OR to_team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
          AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
      )
    )
  );

-- ============================================================
-- head_to_head_records
-- ============================================================
DROP POLICY IF EXISTS "head_to_head_records_insert" ON head_to_head_records;
CREATE POLICY "head_to_head_records_insert" ON head_to_head_records
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "head_to_head_records_update" ON head_to_head_records;
CREATE POLICY "head_to_head_records_update" ON head_to_head_records
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

-- ============================================================
-- notifications
-- ============================================================
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    team_id IS NULL
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'vice_president', 'coach') OR is_admin = true)
    )
  );

-- ============================================================
-- player_cards (from phase4_schema_alignment)
-- ============================================================
DROP POLICY IF EXISTS "player_cards_insert" ON player_cards;
CREATE POLICY "player_cards_insert" ON player_cards
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );

DROP POLICY IF EXISTS "player_cards_update" ON player_cards;
CREATE POLICY "player_cards_update" ON player_cards
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND (permission_group IN ('director', 'coach') OR is_admin = true)
    )
  );
