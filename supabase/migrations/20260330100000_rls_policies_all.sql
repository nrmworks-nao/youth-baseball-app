ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scorebook_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_fitness_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE best_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_product_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_pinned_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_line_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE inter_team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_request_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE head_to_head_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_select_team_members" ON users FOR SELECT USING (id IN (SELECT tm.user_id FROM team_members tm WHERE tm.team_id IN (SELECT tm2.team_id FROM team_members tm2 WHERE tm2.user_id = auth.uid())));

CREATE POLICY "teams_select_member" ON teams FOR SELECT USING (id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "teams_update_admin" ON teams FOR UPDATE USING (id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group = 'team_admin'));
CREATE POLICY "teams_insert_authenticated" ON teams FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "teams_select_by_invite_code" ON teams FOR SELECT USING (invite_code IS NOT NULL);

CREATE POLICY "team_members_select_same_team" ON team_members FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "team_members_insert_admin" ON team_members FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group = 'team_admin') OR user_id = auth.uid());
CREATE POLICY "team_members_update_admin" ON team_members FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group = 'team_admin'));
CREATE POLICY "team_members_delete_admin" ON team_members FOR DELETE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group = 'team_admin') OR user_id = auth.uid());

CREATE POLICY "players_select_team_member" ON players FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "players_insert_admin_manager" ON players FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "players_update_admin_manager" ON players FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "players_delete_admin" ON players FOR DELETE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin')));

CREATE POLICY "user_children_select_team_member" ON user_children FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "user_children_insert" ON user_children FOR INSERT WITH CHECK (user_id = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group = 'team_admin'));
CREATE POLICY "user_children_delete" ON user_children FOR DELETE USING (user_id = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group = 'team_admin'));

CREATE POLICY "events_select_team_member" ON events FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')));
CREATE POLICY "events_update" ON events FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')));
CREATE POLICY "events_delete" ON events FOR DELETE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')));

CREATE POLICY "event_attendances_select_team" ON event_attendances FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "event_attendances_insert" ON event_attendances FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')) OR user_id = auth.uid() OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid()));
CREATE POLICY "event_attendances_update" ON event_attendances FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')) OR user_id = auth.uid() OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid()));

CREATE POLICY "posts_select_team_member" ON posts FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager', 'publicity')));
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (author_id = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin')));
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (author_id = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin')));

CREATE POLICY "post_reactions_select_team" ON post_reactions FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "post_reactions_insert" ON post_reactions FOR INSERT WITH CHECK (user_id = auth.uid() AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "post_reactions_delete" ON post_reactions FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "post_comments_select_team" ON post_comments FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "post_comments_insert" ON post_comments FOR INSERT WITH CHECK (user_id = auth.uid() AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "post_comments_update" ON post_comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "post_comments_delete" ON post_comments FOR DELETE USING (user_id = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin')));

CREATE POLICY "games_select_team" ON games FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "games_insert" ON games FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "games_update" ON games FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "games_delete" ON games FOR DELETE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin')));

CREATE POLICY "game_scorebook_images_select_team" ON game_scorebook_images FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "game_scorebook_images_insert" ON game_scorebook_images FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "game_scorebook_images_delete" ON game_scorebook_images FOR DELETE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));

CREATE POLICY "game_lineups_select_team" ON game_lineups FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "game_lineups_insert" ON game_lineups FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "game_lineups_update" ON game_lineups FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "game_lineups_delete" ON game_lineups FOR DELETE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));

CREATE POLICY "player_game_stats_select_team" ON player_game_stats FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "player_game_stats_insert" ON player_game_stats FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "player_game_stats_update" ON player_game_stats FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));

CREATE POLICY "player_measurements_select_admin_manager" ON player_measurements FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "player_measurements_select_parent" ON player_measurements FOR SELECT USING (player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid()));
CREATE POLICY "player_measurements_insert" ON player_measurements FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')) OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid()));
CREATE POLICY "player_measurements_update" ON player_measurements FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')) OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid()));

CREATE POLICY "player_fitness_records_select_team" ON player_fitness_records FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "player_fitness_records_insert" ON player_fitness_records FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "player_fitness_records_update" ON player_fitness_records FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));

CREATE POLICY "badge_definitions_select" ON badge_definitions FOR SELECT USING (team_id IS NULL OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "badge_definitions_insert" ON badge_definitions FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "badge_definitions_update" ON badge_definitions FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));

CREATE POLICY "player_badges_select_team" ON player_badges FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "player_badges_insert" ON player_badges FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));

CREATE POLICY "player_milestones_select_team" ON player_milestones FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "player_milestones_insert" ON player_milestones FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));

CREATE POLICY "milestone_comments_select_team" ON milestone_comments FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "milestone_comments_insert" ON milestone_comments FOR INSERT WITH CHECK (user_id = auth.uid() AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "milestone_comments_delete" ON milestone_comments FOR DELETE USING (user_id = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin')));

CREATE POLICY "weekly_awards_select_team" ON weekly_awards FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "weekly_awards_insert" ON weekly_awards FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "weekly_awards_update" ON weekly_awards FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));

CREATE POLICY "player_goals_select_team" ON player_goals FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "player_goals_insert" ON player_goals FOR INSERT WITH CHECK (player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid()) OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "player_goals_update" ON player_goals FOR UPDATE USING (player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid()) OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));

CREATE POLICY "goal_comments_select_team" ON goal_comments FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "goal_comments_insert" ON goal_comments FOR INSERT WITH CHECK (user_id = auth.uid() AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "goal_comments_delete" ON goal_comments FOR DELETE USING (user_id = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin')));

CREATE POLICY "team_challenges_select_team" ON team_challenges FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "team_challenges_insert" ON team_challenges FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "team_challenges_update" ON team_challenges FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));

CREATE POLICY "best_plays_select_team" ON best_plays FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "best_plays_insert" ON best_plays FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager', 'publicity')));
CREATE POLICY "best_plays_delete" ON best_plays FOR DELETE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin')));

CREATE POLICY "monthly_reviews_select_team" ON monthly_reviews FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "monthly_reviews_insert" ON monthly_reviews FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "monthly_reviews_update" ON monthly_reviews FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')) OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid()));

CREATE POLICY "albums_select_team" ON albums FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "albums_insert" ON albums FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'publicity')));
CREATE POLICY "albums_update" ON albums FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'publicity')));
CREATE POLICY "albums_delete" ON albums FOR DELETE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin')));

CREATE POLICY "album_photos_select_team" ON album_photos FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "album_photos_insert" ON album_photos FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'publicity', 'parent')));
CREATE POLICY "album_photos_delete" ON album_photos FOR DELETE USING (uploaded_by = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'publicity')));

CREATE POLICY "photo_likes_select_team" ON photo_likes FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "photo_likes_insert" ON photo_likes FOR INSERT WITH CHECK (user_id = auth.uid() AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "photo_likes_delete" ON photo_likes FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "fee_settings_select_team" ON fee_settings FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "fee_settings_insert" ON fee_settings FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'treasurer')));
CREATE POLICY "fee_settings_update" ON fee_settings FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'treasurer')));

CREATE POLICY "invoices_select_admin_treasurer" ON invoices FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'treasurer')));
CREATE POLICY "invoices_select_own" ON invoices FOR SELECT USING (target_user_id = auth.uid());
CREATE POLICY "invoices_insert" ON invoices FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'treasurer')));
CREATE POLICY "invoices_update" ON invoices FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'treasurer')));

CREATE POLICY "invoice_items_select_admin_treasurer" ON invoice_items FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'treasurer')));
CREATE POLICY "invoice_items_select_own" ON invoice_items FOR SELECT USING (invoice_id IN (SELECT id FROM invoices WHERE target_user_id = auth.uid()));
CREATE POLICY "invoice_items_insert" ON invoice_items FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'treasurer')));

CREATE POLICY "payments_select_admin_treasurer" ON payments FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'treasurer')));
CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (payer_user_id = auth.uid());
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'treasurer')));
CREATE POLICY "payments_update" ON payments FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'treasurer')));

CREATE POLICY "ledger_entries_select_admin_treasurer" ON ledger_entries FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'treasurer')));
CREATE POLICY "ledger_entries_insert" ON ledger_entries FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'treasurer')));
CREATE POLICY "ledger_entries_update" ON ledger_entries FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'treasurer')));

CREATE POLICY "shop_categories_select_all" ON shop_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "shop_categories_insert_admin" ON shop_categories FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND permission_group = 'system_admin'));
CREATE POLICY "shop_categories_update_admin" ON shop_categories FOR UPDATE USING (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND permission_group = 'system_admin'));
CREATE POLICY "shop_categories_delete_admin" ON shop_categories FOR DELETE USING (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND permission_group = 'system_admin'));

CREATE POLICY "shop_products_select_all" ON shop_products FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "shop_products_insert_admin" ON shop_products FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND permission_group = 'system_admin'));
CREATE POLICY "shop_products_update_admin" ON shop_products FOR UPDATE USING (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND permission_group = 'system_admin'));
CREATE POLICY "shop_products_delete_admin" ON shop_products FOR DELETE USING (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND permission_group = 'system_admin'));

CREATE POLICY "shop_product_images_select_all" ON shop_product_images FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "shop_product_images_insert_admin" ON shop_product_images FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND permission_group = 'system_admin'));
CREATE POLICY "shop_product_images_delete_admin" ON shop_product_images FOR DELETE USING (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND permission_group = 'system_admin'));

CREATE POLICY "shop_product_links_select_all" ON shop_product_links FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "shop_product_links_insert_admin" ON shop_product_links FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND permission_group = 'system_admin'));
CREATE POLICY "shop_product_links_update_admin" ON shop_product_links FOR UPDATE USING (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND permission_group = 'system_admin'));

CREATE POLICY "team_pinned_products_select_team" ON team_pinned_products FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "team_pinned_products_insert" ON team_pinned_products FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "team_pinned_products_delete" ON team_pinned_products FOR DELETE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));

CREATE POLICY "team_profiles_select_public" ON team_profiles FOR SELECT USING (is_public = true AND auth.uid() IS NOT NULL);
CREATE POLICY "team_profiles_select_own_team" ON team_profiles FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "team_profiles_insert" ON team_profiles FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin')));
CREATE POLICY "team_profiles_update" ON team_profiles FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin')));

CREATE POLICY "team_line_config_select" ON team_line_config FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin')));
CREATE POLICY "team_line_config_insert" ON team_line_config FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin')));
CREATE POLICY "team_line_config_update" ON team_line_config FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin')));

CREATE POLICY "inter_team_messages_select" ON inter_team_messages FOR SELECT USING (from_team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president')) OR to_team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president')));
CREATE POLICY "inter_team_messages_insert" ON inter_team_messages FOR INSERT WITH CHECK (sender_id = auth.uid() AND from_team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president')));
CREATE POLICY "inter_team_messages_update" ON inter_team_messages FOR UPDATE USING (to_team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president')));

CREATE POLICY "match_requests_select" ON match_requests FOR SELECT USING (from_team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')) OR to_team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')));
CREATE POLICY "match_requests_insert" ON match_requests FOR INSERT WITH CHECK (requested_by = auth.uid() AND from_team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')));
CREATE POLICY "match_requests_update" ON match_requests FOR UPDATE USING (from_team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')) OR to_team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')));

CREATE POLICY "match_request_dates_select" ON match_request_dates FOR SELECT USING (match_request_id IN (SELECT id FROM match_requests WHERE from_team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')) OR to_team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager'))));
CREATE POLICY "match_request_dates_insert" ON match_request_dates FOR INSERT WITH CHECK (match_request_id IN (SELECT id FROM match_requests WHERE from_team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager'))));
CREATE POLICY "match_request_dates_update" ON match_request_dates FOR UPDATE USING (match_request_id IN (SELECT id FROM match_requests WHERE from_team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')) OR to_team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager'))));

CREATE POLICY "head_to_head_records_select_team" ON head_to_head_records FOR SELECT USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "head_to_head_records_insert" ON head_to_head_records FOR INSERT WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));
CREATE POLICY "head_to_head_records_update" ON head_to_head_records FOR UPDATE USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'manager')));

CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (team_id IS NULL OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')));
