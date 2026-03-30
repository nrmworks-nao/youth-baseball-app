-- Phase 2: カレンダー・連絡
-- events, event_attendances, posts, post_reactions, post_comments

-- ============================================================
-- events テーブル
-- ============================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'practice', -- practice, game, meeting, other
  location TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT, -- iCal RRULE形式
  parent_event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- 繰り返しの親イベント
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_team_id ON events(team_id);
CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_events_team_start ON events(team_id, start_at);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 同じチームのメンバーは閲覧可
CREATE POLICY "events_select_team_member" ON events
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- team_admin, vice_president, managerはイベント管理可
CREATE POLICY "events_insert" ON events
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
    )
  );

CREATE POLICY "events_update" ON events
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
    )
  );

CREATE POLICY "events_delete" ON events
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
    )
  );

-- ============================================================
-- event_attendances テーブル
-- ============================================================
CREATE TABLE event_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE, -- 選手の出欠
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- 保護者自身の出欠
  status TEXT NOT NULL DEFAULT 'pending', -- present, absent, pending, late
  note TEXT,
  responded_by UUID REFERENCES users(id), -- 回答者（保護者が子供の出欠を回答）
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 選手または保護者のどちらかは必須
  CONSTRAINT chk_attendance_target CHECK (player_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX idx_event_attendances_event_id ON event_attendances(event_id);
CREATE INDEX idx_event_attendances_team_id ON event_attendances(team_id);
CREATE INDEX idx_event_attendances_player_id ON event_attendances(player_id);

ALTER TABLE event_attendances ENABLE ROW LEVEL SECURITY;

-- 同じチームのメンバーは出欠情報を閲覧可
CREATE POLICY "event_attendances_select_team" ON event_attendances
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- 管理者は全出欠を管理可、保護者は自分の子供・自分のみ
CREATE POLICY "event_attendances_insert" ON event_attendances
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
    )
    OR user_id = auth.uid()
    OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
  );

CREATE POLICY "event_attendances_update" ON event_attendances
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
    )
    OR user_id = auth.uid()
    OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
  );

-- ============================================================
-- posts テーブル
-- ============================================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT, -- お知らせ、連絡、その他
  image_urls TEXT[], -- 画像URL配列
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_team_id ON posts(team_id);
CREATE INDEX idx_posts_team_created ON posts(team_id, created_at DESC);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 同じチームのメンバーは閲覧可
CREATE POLICY "posts_select_team_member" ON posts
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- team_admin, vice_president, manager, publicityは投稿可
CREATE POLICY "posts_insert" ON posts
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager', 'publicity')
    )
  );

CREATE POLICY "posts_update" ON posts
  FOR UPDATE USING (
    author_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin')
    )
  );

CREATE POLICY "posts_delete" ON posts
  FOR DELETE USING (
    author_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin')
    )
  );

-- ============================================================
-- post_reactions テーブル
-- ============================================================
CREATE TABLE post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL, -- 👍, ❤️, 😊 等
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

CREATE INDEX idx_post_reactions_post_id ON post_reactions(post_id);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_reactions_select_team" ON post_reactions
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- 全チームメンバーがリアクション可
CREATE POLICY "post_reactions_insert" ON post_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "post_reactions_delete" ON post_reactions
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- post_comments テーブル
-- ============================================================
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_comments_select_team" ON post_comments
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- 全チームメンバーがコメント可
CREATE POLICY "post_comments_insert" ON post_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "post_comments_update" ON post_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "post_comments_delete" ON post_comments
  FOR DELETE USING (
    user_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin')
    )
  );

-- updated_at トリガー
CREATE TRIGGER set_updated_at_events BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_event_attendances BEFORE UPDATE ON event_attendances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_posts BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_post_comments BEFORE UPDATE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
