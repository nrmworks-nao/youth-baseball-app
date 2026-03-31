-- 招待リンク・メンバー参加・選手登録に必要なカラム追加

-- teams: 招待リンク有効期限、承認設定
ALTER TABLE teams ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS require_approval BOOLEAN NOT NULL DEFAULT false;

-- team_members: 有効フラグ（承認待ち対応）
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- players: 投げ打ち、有効フラグ
ALTER TABLE players ADD COLUMN IF NOT EXISTS throwing_hand TEXT; -- 右投/左投
ALTER TABLE players ADD COLUMN IF NOT EXISTS batting_hand TEXT;  -- 右打/左打/両打
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- user_children: 保護者との関係
ALTER TABLE user_children ADD COLUMN IF NOT EXISTS relationship TEXT; -- 父/母/祖父/祖母/その他

-- users: 電話番号
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- team_members の is_active に基づくインデックス
CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON team_members(team_id, is_active);

-- players の is_active に基づくインデックス
CREATE INDEX IF NOT EXISTS idx_players_is_active ON players(team_id, is_active);
