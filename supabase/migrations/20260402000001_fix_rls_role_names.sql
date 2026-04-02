-- RLSポリシー修正: 旧ロール名(system_admin, team_admin, manager)を新ロール名に置き換え
-- パート1: teams, team_members, users, user_children, players, events, event_attendances,
--          posts, post_reactions, post_comments

-- ============================================================
-- teams: UPDATE → director + is_admin
-- ============================================================
DROP POLICY IF EXISTS "teams_update_admin" ON teams;
CREATE POLICY "teams_update_admin" ON teams FOR UPDATE USING (
  id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

-- ============================================================
-- team_members: INSERT/UPDATE/DELETE → director, president, vice_president + is_admin
-- ============================================================
DROP POLICY IF EXISTS "team_members_insert_admin" ON team_members;
CREATE POLICY "team_members_insert_admin" ON team_members FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'president', 'vice_president') OR is_admin = true)
  ) OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "team_members_update_admin" ON team_members;
CREATE POLICY "team_members_update_admin" ON team_members FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'president', 'vice_president') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "team_members_delete_admin" ON team_members;
CREATE POLICY "team_members_delete_admin" ON team_members FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'president', 'vice_president') OR is_admin = true)
  ) OR user_id = auth.uid()
);

-- ============================================================
-- users: 既存のまま（自分のデータのみ） — 変更不要
-- ============================================================

-- ============================================================
-- user_children: INSERT/DELETE → director + is_admin + 自分の子供
-- ============================================================
DROP POLICY IF EXISTS "user_children_insert" ON user_children;
CREATE POLICY "user_children_insert" ON user_children FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "user_children_delete" ON user_children;
CREATE POLICY "user_children_delete" ON user_children FOR DELETE USING (
  user_id = auth.uid()
  OR team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

-- ============================================================
-- players: INSERT/UPDATE → director, coach + is_admin、DELETE → director + is_admin
-- ============================================================
DROP POLICY IF EXISTS "players_insert_admin_manager" ON players;
CREATE POLICY "players_insert_admin_manager" ON players FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "players_update_admin_manager" ON players;
CREATE POLICY "players_update_admin_manager" ON players FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "players_delete_admin" ON players;
CREATE POLICY "players_delete_admin" ON players FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

-- ============================================================
-- events: INSERT/UPDATE/DELETE → director, captain, coach + is_admin
-- ============================================================
DROP POLICY IF EXISTS "events_insert" ON events;
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'captain', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "events_update" ON events;
CREATE POLICY "events_update" ON events FOR UPDATE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'captain', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "events_delete" ON events;
CREATE POLICY "events_delete" ON events FOR DELETE USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'captain', 'coach') OR is_admin = true)
  )
);

-- ============================================================
-- event_attendances: INSERT/UPDATE → 全ロール（自分 or 自分の子供）
-- ============================================================
DROP POLICY IF EXISTS "event_attendances_insert" ON event_attendances;
CREATE POLICY "event_attendances_insert" ON event_attendances FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
  OR team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'captain', 'coach') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "event_attendances_update" ON event_attendances;
CREATE POLICY "event_attendances_update" ON event_attendances FOR UPDATE USING (
  user_id = auth.uid()
  OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
  OR team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'captain', 'coach') OR is_admin = true)
  )
);

-- ============================================================
-- posts: INSERT → director, president, vice_president, captain, coach, treasurer, publicity + is_admin
--        UPDATE/DELETE → director + is_admin
-- ============================================================
DROP POLICY IF EXISTS "posts_insert" ON posts;
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group IN ('director', 'president', 'vice_president', 'captain', 'coach', 'treasurer', 'publicity') OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "posts_update" ON posts;
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (
  author_id = auth.uid()
  OR team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

DROP POLICY IF EXISTS "posts_delete" ON posts;
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (
  author_id = auth.uid()
  OR team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

-- ============================================================
-- post_reactions: INSERT/DELETE → 全ロール（既存のまま、ロール制限なし）
-- ============================================================
-- post_reactions は user_id = auth.uid() のチェックのみでロール制限なし
-- 変更不要

-- ============================================================
-- post_comments: INSERT → 全ロール、DELETE → director + is_admin + 自分のコメント
-- ============================================================
DROP POLICY IF EXISTS "post_comments_delete" ON post_comments;
CREATE POLICY "post_comments_delete" ON post_comments FOR DELETE USING (
  user_id = auth.uid()
  OR team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
      AND (permission_group = 'director' OR is_admin = true)
  )
);

-- post_comments INSERT/UPDATE は user_id = auth.uid() のみでロール制限なし — 変更不要
