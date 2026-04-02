-- RLSポリシー修正: 旧ロール名(system_admin/team_admin/manager)を新権限グループ+is_adminに置き換え
-- パート2: 試合関連・選手測定・キッズ機能テーブル

-- ============================================================
-- 1. games
-- ============================================================
DROP POLICY IF EXISTS "games_insert" ON games;
CREATE POLICY "games_insert" ON games FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "games_update" ON games;
CREATE POLICY "games_update" ON games FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "games_delete" ON games;
CREATE POLICY "games_delete" ON games FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

-- ============================================================
-- 2. game_lineups
-- ============================================================
DROP POLICY IF EXISTS "game_lineups_insert" ON game_lineups;
CREATE POLICY "game_lineups_insert" ON game_lineups FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "game_lineups_update" ON game_lineups;
CREATE POLICY "game_lineups_update" ON game_lineups FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "game_lineups_delete" ON game_lineups;
CREATE POLICY "game_lineups_delete" ON game_lineups FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

-- ============================================================
-- 3. player_game_stats
-- ============================================================
DROP POLICY IF EXISTS "player_game_stats_insert" ON player_game_stats;
CREATE POLICY "player_game_stats_insert" ON player_game_stats FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "player_game_stats_update" ON player_game_stats;
CREATE POLICY "player_game_stats_update" ON player_game_stats FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

-- ============================================================
-- 4. game_scorebook_images
-- ============================================================
DROP POLICY IF EXISTS "game_scorebook_images_insert" ON game_scorebook_images;
CREATE POLICY "game_scorebook_images_insert" ON game_scorebook_images FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "game_scorebook_images_delete" ON game_scorebook_images;
CREATE POLICY "game_scorebook_images_delete" ON game_scorebook_images FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

-- ============================================================
-- 5. player_measurements
-- ============================================================
DROP POLICY IF EXISTS "player_measurements_insert" ON player_measurements;
CREATE POLICY "player_measurements_insert" ON player_measurements FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "player_measurements_update" ON player_measurements;
CREATE POLICY "player_measurements_update" ON player_measurements FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "player_measurements_delete" ON player_measurements;
CREATE POLICY "player_measurements_delete" ON player_measurements FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

-- ============================================================
-- 6. player_fitness_records
-- ============================================================
DROP POLICY IF EXISTS "player_fitness_records_insert" ON player_fitness_records;
CREATE POLICY "player_fitness_records_insert" ON player_fitness_records FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "player_fitness_records_update" ON player_fitness_records;
CREATE POLICY "player_fitness_records_update" ON player_fitness_records FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "player_fitness_records_delete" ON player_fitness_records;
CREATE POLICY "player_fitness_records_delete" ON player_fitness_records FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

-- ============================================================
-- 7. badge_definitions
-- ============================================================
DROP POLICY IF EXISTS "badge_definitions_insert" ON badge_definitions;
CREATE POLICY "badge_definitions_insert" ON badge_definitions FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "badge_definitions_update" ON badge_definitions;
CREATE POLICY "badge_definitions_update" ON badge_definitions FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "badge_definitions_delete" ON badge_definitions;
CREATE POLICY "badge_definitions_delete" ON badge_definitions FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

-- ============================================================
-- 8. player_badges
-- ============================================================
DROP POLICY IF EXISTS "player_badges_insert" ON player_badges;
CREATE POLICY "player_badges_insert" ON player_badges FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

-- ============================================================
-- 9. player_milestones
-- ============================================================
DROP POLICY IF EXISTS "player_milestones_insert" ON player_milestones;
CREATE POLICY "player_milestones_insert" ON player_milestones FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
  OR player_id IN (
    SELECT player_id FROM user_children WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "player_milestones_delete" ON player_milestones;
CREATE POLICY "player_milestones_delete" ON player_milestones FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

-- ============================================================
-- 10. milestone_comments
-- ============================================================
DROP POLICY IF EXISTS "milestone_comments_insert" ON milestone_comments;
CREATE POLICY "milestone_comments_insert" ON milestone_comments FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "milestone_comments_delete" ON milestone_comments;
CREATE POLICY "milestone_comments_delete" ON milestone_comments FOR DELETE USING (
  user_id = auth.uid()
  OR team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

-- ============================================================
-- 11. weekly_awards
-- ============================================================
DROP POLICY IF EXISTS "weekly_awards_insert" ON weekly_awards;
CREATE POLICY "weekly_awards_insert" ON weekly_awards FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "weekly_awards_update" ON weekly_awards;
CREATE POLICY "weekly_awards_update" ON weekly_awards FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "weekly_awards_delete" ON weekly_awards;
CREATE POLICY "weekly_awards_delete" ON weekly_awards FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

-- ============================================================
-- 12. player_goals
-- ============================================================
DROP POLICY IF EXISTS "player_goals_insert" ON player_goals;
CREATE POLICY "player_goals_insert" ON player_goals FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
  OR player_id IN (
    SELECT player_id FROM user_children WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "player_goals_update" ON player_goals;
CREATE POLICY "player_goals_update" ON player_goals FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
  OR player_id IN (
    SELECT player_id FROM user_children WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "player_goals_delete" ON player_goals;
CREATE POLICY "player_goals_delete" ON player_goals FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

-- ============================================================
-- 13. goal_comments
-- ============================================================
DROP POLICY IF EXISTS "goal_comments_insert" ON goal_comments;
CREATE POLICY "goal_comments_insert" ON goal_comments FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "goal_comments_delete" ON goal_comments;
CREATE POLICY "goal_comments_delete" ON goal_comments FOR DELETE USING (
  user_id = auth.uid()
  OR team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

-- ============================================================
-- 14. team_challenges
-- ============================================================
DROP POLICY IF EXISTS "team_challenges_insert" ON team_challenges;
CREATE POLICY "team_challenges_insert" ON team_challenges FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "team_challenges_update" ON team_challenges;
CREATE POLICY "team_challenges_update" ON team_challenges FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "team_challenges_delete" ON team_challenges;
CREATE POLICY "team_challenges_delete" ON team_challenges FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

-- ============================================================
-- 15. best_plays
-- ============================================================
DROP POLICY IF EXISTS "best_plays_insert" ON best_plays;
CREATE POLICY "best_plays_insert" ON best_plays FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "best_plays_delete" ON best_plays;
CREATE POLICY "best_plays_delete" ON best_plays FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

-- ============================================================
-- 16. monthly_reviews
-- ============================================================
DROP POLICY IF EXISTS "monthly_reviews_insert" ON monthly_reviews;
CREATE POLICY "monthly_reviews_insert" ON monthly_reviews FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "monthly_reviews_update" ON monthly_reviews;
CREATE POLICY "monthly_reviews_update" ON monthly_reviews FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

-- ============================================================
-- 17. player_cards（テーブルが存在する場合のみ）
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_cards') THEN
    EXECUTE 'DROP POLICY IF EXISTS "player_cards_insert" ON player_cards';
    EXECUTE 'CREATE POLICY "player_cards_insert" ON player_cards FOR INSERT WITH CHECK (
      team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
          AND (permission_group IN (''director'', ''coach'') OR is_admin = true)
      )
    )';

    EXECUTE 'DROP POLICY IF EXISTS "player_cards_update" ON player_cards';
    EXECUTE 'CREATE POLICY "player_cards_update" ON player_cards FOR UPDATE USING (
      team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
          AND (permission_group IN (''director'', ''coach'') OR is_admin = true)
      )
    )';
  END IF;
END
$$;
