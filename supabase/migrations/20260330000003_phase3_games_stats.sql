-- Phase 3: 試合・成績
-- games, game_scorebook_images, game_lineups, player_game_stats
-- player_measurements, player_fitness_records

-- ============================================================
-- games テーブル
-- ============================================================
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- カレンダーイベントとの紐づけ
  opponent_name TEXT NOT NULL,
  game_date DATE NOT NULL,
  venue TEXT,
  game_type TEXT NOT NULL DEFAULT 'practice', -- practice, tournament, league
  result TEXT, -- win, lose, draw
  score_team INTEGER,
  score_opponent INTEGER,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_games_team_id ON games(team_id);
CREATE INDEX idx_games_team_date ON games(team_id, game_date DESC);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "games_select_team" ON games
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "games_insert" ON games
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "games_update" ON games
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "games_delete" ON games
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin')
    )
  );

-- ============================================================
-- game_scorebook_images テーブル
-- ============================================================
CREATE TABLE game_scorebook_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_game_scorebook_images_game_id ON game_scorebook_images(game_id);

ALTER TABLE game_scorebook_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_scorebook_images_select_team" ON game_scorebook_images
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "game_scorebook_images_insert" ON game_scorebook_images
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "game_scorebook_images_delete" ON game_scorebook_images
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

-- ============================================================
-- game_lineups テーブル
-- ============================================================
CREATE TABLE game_lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  batting_order INTEGER, -- 打順
  position TEXT, -- 守備位置
  is_starter BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, player_id)
);

CREATE INDEX idx_game_lineups_game_id ON game_lineups(game_id);

ALTER TABLE game_lineups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_lineups_select_team" ON game_lineups
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "game_lineups_insert" ON game_lineups
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "game_lineups_update" ON game_lineups
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "game_lineups_delete" ON game_lineups
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

-- ============================================================
-- player_game_stats テーブル（打撃・守備・投手成績を統合）
-- ============================================================
CREATE TABLE player_game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  -- 打撃成績
  at_bats INTEGER NOT NULL DEFAULT 0,        -- 打数
  hits INTEGER NOT NULL DEFAULT 0,           -- 安打
  doubles INTEGER NOT NULL DEFAULT 0,        -- 二塁打
  triples INTEGER NOT NULL DEFAULT 0,        -- 三塁打
  home_runs INTEGER NOT NULL DEFAULT 0,      -- 本塁打
  rbis INTEGER NOT NULL DEFAULT 0,           -- 打点
  walks INTEGER NOT NULL DEFAULT 0,          -- 四球
  strikeouts INTEGER NOT NULL DEFAULT 0,     -- 三振
  stolen_bases INTEGER NOT NULL DEFAULT 0,   -- 盗塁
  sacrifice_hits INTEGER NOT NULL DEFAULT 0, -- 犠打
  -- 守備成績
  putouts INTEGER NOT NULL DEFAULT 0,        -- 刺殺
  assists INTEGER NOT NULL DEFAULT 0,        -- 補殺
  errors INTEGER NOT NULL DEFAULT 0,         -- 失策
  -- 投手成績
  innings_pitched NUMERIC(4,1) NOT NULL DEFAULT 0, -- 投球回
  pitches_thrown INTEGER NOT NULL DEFAULT 0,        -- 投球数
  earned_runs INTEGER NOT NULL DEFAULT 0,           -- 自責点
  hits_allowed INTEGER NOT NULL DEFAULT 0,          -- 被安打
  walks_allowed INTEGER NOT NULL DEFAULT 0,         -- 与四球
  strikeouts_pitched INTEGER NOT NULL DEFAULT 0,    -- 奪三振
  is_winning_pitcher BOOLEAN NOT NULL DEFAULT false,
  is_losing_pitcher BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, player_id)
);

CREATE INDEX idx_player_game_stats_game_id ON player_game_stats(game_id);
CREATE INDEX idx_player_game_stats_player_id ON player_game_stats(player_id);
CREATE INDEX idx_player_game_stats_team_id ON player_game_stats(team_id);

ALTER TABLE player_game_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_game_stats_select_team" ON player_game_stats
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "player_game_stats_insert" ON player_game_stats
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "player_game_stats_update" ON player_game_stats
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

-- ============================================================
-- player_measurements テーブル（身体測定）
-- ============================================================
CREATE TABLE player_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  measured_at DATE NOT NULL,
  height_cm NUMERIC(5,1), -- 身長
  weight_kg NUMERIC(5,1), -- 体重
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_player_measurements_player_id ON player_measurements(player_id);
CREATE INDEX idx_player_measurements_team_id ON player_measurements(team_id);

ALTER TABLE player_measurements ENABLE ROW LEVEL SECURITY;

-- チームメンバーは閲覧可（保護者は自分の子のみ別途制御）
CREATE POLICY "player_measurements_select_admin_manager" ON player_measurements
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

-- 保護者は自分の子供のみ閲覧可
CREATE POLICY "player_measurements_select_parent" ON player_measurements
  FOR SELECT USING (
    player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
  );

CREATE POLICY "player_measurements_insert" ON player_measurements
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
    OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
  );

CREATE POLICY "player_measurements_update" ON player_measurements
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
    OR player_id IN (SELECT player_id FROM user_children WHERE user_id = auth.uid())
  );

-- ============================================================
-- player_fitness_records テーブル（体力測定）
-- ============================================================
CREATE TABLE player_fitness_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  measured_at DATE NOT NULL,
  sprint_50m NUMERIC(5,2),     -- 50m走（秒）
  throw_distance NUMERIC(5,1), -- 遠投（m）
  standing_jump NUMERIC(5,1),  -- 立ち幅跳び（cm）
  sit_ups INTEGER,             -- 上体起こし（回）
  shuttle_run NUMERIC(5,2),    -- シャトルラン
  flexibility NUMERIC(5,1),    -- 長座体前屈（cm）
  grip_strength NUMERIC(5,1),  -- 握力（kg）
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_player_fitness_records_player_id ON player_fitness_records(player_id);
CREATE INDEX idx_player_fitness_records_team_id ON player_fitness_records(team_id);

ALTER TABLE player_fitness_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_fitness_records_select_team" ON player_fitness_records
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "player_fitness_records_insert" ON player_fitness_records
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "player_fitness_records_update" ON player_fitness_records
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

-- updated_at トリガー
CREATE TRIGGER set_updated_at_games BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_player_game_stats BEFORE UPDATE ON player_game_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_player_measurements BEFORE UPDATE ON player_measurements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_player_fitness_records BEFORE UPDATE ON player_fitness_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
