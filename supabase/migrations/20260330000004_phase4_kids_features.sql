-- Phase 4: キッズ機能
-- badge_definitions, player_badges, player_milestones, milestone_comments
-- weekly_awards, player_goals, goal_comments
-- team_challenges, best_plays, monthly_reviews

-- ============================================================
-- badge_definitions テーブル
-- ============================================================
CREATE TABLE badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE, -- NULLならシステム共通バッジ
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  category TEXT, -- batting, fielding, pitching, effort, attendance 等
  condition_type TEXT, -- auto, manual
  condition_value JSONB, -- 自動付与条件のJSON
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_badge_definitions_team_id ON badge_definitions(team_id);

ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;

-- チームメンバーまたはシステム共通バッジは閲覧可
CREATE POLICY "badge_definitions_select" ON badge_definitions
  FOR SELECT USING (
    team_id IS NULL
    OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "badge_definitions_insert" ON badge_definitions
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "badge_definitions_update" ON badge_definitions
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

-- ============================================================
-- player_badges テーブル
-- ============================================================
CREATE TABLE player_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  awarded_by UUID REFERENCES users(id), -- NULLなら自動付与
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_player_badges_player_id ON player_badges(player_id);
CREATE INDEX idx_player_badges_team_id ON player_badges(team_id);

ALTER TABLE player_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_badges_select_team" ON player_badges
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "player_badges_insert" ON player_badges
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

-- ============================================================
-- player_milestones テーブル（成長タイムライン）
-- ============================================================
CREATE TABLE player_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL, -- first_hit, first_homerun, badge_earned, rank_up 等
  title TEXT NOT NULL,
  description TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reference_id UUID, -- 関連エンティティのID（バッジID、試合ID等）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_player_milestones_player_id ON player_milestones(player_id);
CREATE INDEX idx_player_milestones_team_id ON player_milestones(team_id);

ALTER TABLE player_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_milestones_select_team" ON player_milestones
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "player_milestones_insert" ON player_milestones
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

-- ============================================================
-- milestone_comments テーブル
-- ============================================================
CREATE TABLE milestone_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES player_milestones(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestone_comments_milestone_id ON milestone_comments(milestone_id);

ALTER TABLE milestone_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestone_comments_select_team" ON milestone_comments
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "milestone_comments_insert" ON milestone_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "milestone_comments_delete" ON milestone_comments
  FOR DELETE USING (
    user_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin')
    )
  );

-- ============================================================
-- weekly_awards テーブル（MVP・がんばったで賞）
-- ============================================================
CREATE TABLE weekly_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  award_type TEXT NOT NULL, -- mvp, effort, improvement 等
  title TEXT NOT NULL,
  reason TEXT,
  award_date DATE NOT NULL,
  awarded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_weekly_awards_team_id ON weekly_awards(team_id);
CREATE INDEX idx_weekly_awards_player_id ON weekly_awards(player_id);

ALTER TABLE weekly_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_awards_select_team" ON weekly_awards
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "weekly_awards_insert" ON weekly_awards
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "weekly_awards_update" ON weekly_awards
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

-- ============================================================
-- player_goals テーブル（マイ目標）
-- ============================================================
CREATE TABLE player_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active', -- active, achieved, cancelled
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_player_goals_player_id ON player_goals(player_id);
CREATE INDEX idx_player_goals_team_id ON player_goals(team_id);

ALTER TABLE player_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_goals_select_team" ON player_goals
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- 保護者は自分の子供の目標を管理可、管理者は全員分
CREATE POLICY "player_goals_insert" ON player_goals
  FOR INSERT WITH CHECK (
    player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "player_goals_update" ON player_goals
  FOR UPDATE USING (
    player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

-- ============================================================
-- goal_comments テーブル
-- ============================================================
CREATE TABLE goal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES player_goals(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_goal_comments_goal_id ON goal_comments(goal_id);

ALTER TABLE goal_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goal_comments_select_team" ON goal_comments
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "goal_comments_insert" ON goal_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "goal_comments_delete" ON goal_comments
  FOR DELETE USING (
    user_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin')
    )
  );

-- ============================================================
-- team_challenges テーブル
-- ============================================================
CREATE TABLE team_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value INTEGER, -- 目標値
  current_value INTEGER NOT NULL DEFAULT 0,
  unit TEXT, -- 回、本、km 等
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, cancelled
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_challenges_team_id ON team_challenges(team_id);

ALTER TABLE team_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_challenges_select_team" ON team_challenges
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "team_challenges_insert" ON team_challenges
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "team_challenges_update" ON team_challenges
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

-- ============================================================
-- best_plays テーブル
-- ============================================================
CREATE TABLE best_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL, -- 動画・写真URL
  media_type TEXT NOT NULL DEFAULT 'image', -- image, video
  play_date DATE,
  posted_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_best_plays_team_id ON best_plays(team_id);

ALTER TABLE best_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "best_plays_select_team" ON best_plays
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "best_plays_insert" ON best_plays
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager', 'publicity')
    )
  );

CREATE POLICY "best_plays_delete" ON best_plays
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin')
    )
  );

-- ============================================================
-- monthly_reviews テーブル（月間ふりかえり）
-- ============================================================
CREATE TABLE monthly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  summary TEXT, -- 自動生成 or 手動入力のまとめ
  highlights JSONB, -- ハイライト情報（バッジ、記録等）
  coach_comment TEXT, -- コーチからのコメント
  parent_comment TEXT, -- 保護者からのコメント
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, player_id, year, month)
);

CREATE INDEX idx_monthly_reviews_player_id ON monthly_reviews(player_id);
CREATE INDEX idx_monthly_reviews_team_id ON monthly_reviews(team_id);

ALTER TABLE monthly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_reviews_select_team" ON monthly_reviews
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "monthly_reviews_insert" ON monthly_reviews
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "monthly_reviews_update" ON monthly_reviews
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
    OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
  );

-- updated_at トリガー
CREATE TRIGGER set_updated_at_player_goals BEFORE UPDATE ON player_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_team_challenges BEFORE UPDATE ON team_challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_monthly_reviews BEFORE UPDATE ON monthly_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
