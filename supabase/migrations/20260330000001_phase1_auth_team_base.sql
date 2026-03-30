-- Phase 1: 認証・チーム基盤
-- users, teams, team_members, players, user_children

-- カスタム型
CREATE TYPE permission_group AS ENUM (
  'system_admin',
  'team_admin',
  'vice_president',
  'treasurer',
  'manager',
  'publicity',
  'parent'
);

CREATE TYPE card_rank AS ENUM (
  'bronze',
  'silver',
  'gold',
  'platinum'
);

-- ============================================================
-- users テーブル
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  line_id TEXT UNIQUE,
  line_display_name TEXT,
  line_picture_url TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 自分のレコードは閲覧・更新可
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 同じチームのメンバーの情報は閲覧可
CREATE POLICY "users_select_team_members" ON users
  FOR SELECT USING (
    id IN (
      SELECT tm.user_id FROM team_members tm
      WHERE tm.team_id IN (
        SELECT tm2.team_id FROM team_members tm2 WHERE tm2.user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- teams テーブル
-- ============================================================
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  invite_code TEXT UNIQUE,
  region TEXT,
  category TEXT, -- 学童、少年、中学 等
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- チームメンバーはチーム情報を閲覧可
CREATE POLICY "teams_select_member" ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- team_adminのみ更新可
CREATE POLICY "teams_update_admin" ON teams
  FOR UPDATE USING (
    id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'team_admin'
    )
  );

-- 認証済みユーザーはチーム作成可
CREATE POLICY "teams_insert_authenticated" ON teams
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 招待コードでのチーム検索用（未所属でも招待リンクからアクセス可）
CREATE POLICY "teams_select_by_invite_code" ON teams
  FOR SELECT USING (invite_code IS NOT NULL);

-- ============================================================
-- team_members テーブル
-- ============================================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_group permission_group NOT NULL DEFAULT 'parent',
  display_title TEXT, -- UI表示用肩書き（自由入力）
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 同じチームのメンバーは閲覧可
CREATE POLICY "team_members_select_same_team" ON team_members
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- team_adminのみメンバー管理可
CREATE POLICY "team_members_insert_admin" ON team_members
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'team_admin'
    )
    OR user_id = auth.uid() -- 自分自身の参加（招待受付）
  );

CREATE POLICY "team_members_update_admin" ON team_members
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'team_admin'
    )
  );

CREATE POLICY "team_members_delete_admin" ON team_members
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'team_admin'
    )
    OR user_id = auth.uid() -- 自分自身の脱退
  );

-- ============================================================
-- players テーブル
-- ============================================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number INTEGER, -- 背番号
  position TEXT, -- ポジション
  birth_date DATE,
  grade INTEGER, -- 学年
  avatar_url TEXT,
  -- キッズ機能用プロフィール
  favorite_pro_player TEXT,
  favorite_play TEXT,
  dream TEXT,
  -- 選手カード
  card_rank card_rank NOT NULL DEFAULT 'bronze',
  card_photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_team_id ON players(team_id);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- 同じチームのメンバーは選手情報を閲覧可
CREATE POLICY "players_select_team_member" ON players
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- team_admin, managerは選手を追加・更新可
CREATE POLICY "players_insert_admin_manager" ON players
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "players_update_admin_manager" ON players
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "players_delete_admin" ON players
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin')
    )
  );

-- ============================================================
-- user_children テーブル（保護者-選手紐づけ）
-- ============================================================
CREATE TABLE user_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, player_id)
);

CREATE INDEX idx_user_children_user_id ON user_children(user_id);
CREATE INDEX idx_user_children_player_id ON user_children(player_id);
CREATE INDEX idx_user_children_team_id ON user_children(team_id);

ALTER TABLE user_children ENABLE ROW LEVEL SECURITY;

-- 同じチームのメンバーは閲覧可
CREATE POLICY "user_children_select_team_member" ON user_children
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- team_adminまたは本人のみ追加・削除可
CREATE POLICY "user_children_insert" ON user_children
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'team_admin'
    )
  );

CREATE POLICY "user_children_delete" ON user_children
  FOR DELETE USING (
    user_id = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'team_admin'
    )
  );

-- ============================================================
-- updated_at 自動更新用トリガー関数
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_teams BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_team_members BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_players BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
