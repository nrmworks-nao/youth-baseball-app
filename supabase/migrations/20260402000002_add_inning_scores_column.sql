-- gamesテーブルにinning_scoresカラムを追加（JSONB型）
ALTER TABLE games ADD COLUMN IF NOT EXISTS inning_scores JSONB;

COMMENT ON COLUMN games.inning_scores IS 'イニングごとの得点。[{inning: 1, score_team: 3, score_opponent: 0}, ...]';
