-- Phase 4 スキーマ整合性修正
-- マイグレーション定義とアプリコード（types/queries）の差分を解消する

-- ============================================================
-- player_cards テーブル（未作成だった）
-- ============================================================
CREATE TABLE IF NOT EXISTS player_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  card_rank TEXT NOT NULL DEFAULT 'bronze', -- bronze, silver, gold, platinum
  photo_url TEXT,
  batting_throw TEXT,
  favorite_pro_player TEXT,
  best_play TEXT,
  future_dream TEXT,
  selected_badge_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id)
);

CREATE INDEX IF NOT EXISTS idx_player_cards_player_id ON player_cards(player_id);
CREATE INDEX IF NOT EXISTS idx_player_cards_team_id ON player_cards(team_id);

ALTER TABLE player_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_cards_select_team" ON player_cards
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "player_cards_insert" ON player_cards
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "player_cards_update" ON player_cards
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

-- ============================================================
-- badge_definitions: アプリが期待するカラムを追加
-- ============================================================
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS icon_color TEXT DEFAULT '#22c55e';
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS is_preset BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS condition_key TEXT;
ALTER TABLE badge_definitions ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- player_milestones: アプリが期待するカラムを追加
-- ============================================================
ALTER TABLE player_milestones ADD COLUMN IF NOT EXISTS milestone_date DATE;
ALTER TABLE player_milestones ADD COLUMN IF NOT EXISTS is_auto BOOLEAN NOT NULL DEFAULT false;

-- occurred_at が存在する場合、milestone_date にデータを移行
UPDATE player_milestones SET milestone_date = occurred_at::date WHERE milestone_date IS NULL AND occurred_at IS NOT NULL;

-- ============================================================
-- weekly_awards: アプリが期待するカラムを追加
-- award_type→category, reason→comment, award_date→awarded_at として追加
-- ============================================================
ALTER TABLE weekly_awards ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE weekly_awards ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE weekly_awards ADD COLUMN IF NOT EXISTS awarded_at DATE;
ALTER TABLE weekly_awards ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- 既存データの移行
UPDATE weekly_awards SET category = award_type WHERE category IS NULL AND award_type IS NOT NULL;
UPDATE weekly_awards SET comment = reason WHERE comment IS NULL AND reason IS NOT NULL;
UPDATE weekly_awards SET awarded_at = award_date WHERE awarded_at IS NULL AND award_date IS NOT NULL;
UPDATE weekly_awards SET created_by = awarded_by WHERE created_by IS NULL AND awarded_by IS NOT NULL;

-- ============================================================
-- player_goals: アプリが期待するカラムを追加
-- ============================================================
ALTER TABLE player_goals ADD COLUMN IF NOT EXISTS target_metric TEXT;
ALTER TABLE player_goals ADD COLUMN IF NOT EXISTS target_value NUMERIC DEFAULT 0;
ALTER TABLE player_goals ADD COLUMN IF NOT EXISTS current_value NUMERIC DEFAULT 0;
ALTER TABLE player_goals ADD COLUMN IF NOT EXISTS deadline DATE;

-- 既存データの移行
UPDATE player_goals SET deadline = target_date WHERE deadline IS NULL AND target_date IS NOT NULL;

-- ============================================================
-- best_plays: アプリが期待するカラムを追加
-- ============================================================
ALTER TABLE best_plays ADD COLUMN IF NOT EXISTS game_id UUID REFERENCES games(id) ON DELETE SET NULL;
ALTER TABLE best_plays ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE best_plays ADD COLUMN IF NOT EXISTS is_auto BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE best_plays ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- media_url→photo_url 移行
UPDATE best_plays SET photo_url = media_url WHERE photo_url IS NULL AND media_url IS NOT NULL;
UPDATE best_plays SET created_by = posted_by WHERE created_by IS NULL AND posted_by IS NOT NULL;

-- media_url の NOT NULL 制約を緩和（photo_url を使うため）
ALTER TABLE best_plays ALTER COLUMN media_url DROP NOT NULL;

-- ============================================================
-- monthly_reviews: アプリが期待するカラムを追加
-- ============================================================
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS practice_attendance_rate NUMERIC;
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS games_played INTEGER;
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS batting_avg NUMERIC;
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS batting_avg_change NUMERIC;
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS height_cm NUMERIC;
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS height_change NUMERIC;
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS weight_kg NUMERIC;
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS weight_change NUMERIC;
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS badges_earned JSONB DEFAULT '[]'::jsonb;
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS best_play_summary TEXT;
ALTER TABLE monthly_reviews ADD COLUMN IF NOT EXISTS positive_message TEXT;

-- ============================================================
-- player_cards updated_at トリガー
-- ============================================================
CREATE TRIGGER set_updated_at_player_cards BEFORE UPDATE ON player_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
