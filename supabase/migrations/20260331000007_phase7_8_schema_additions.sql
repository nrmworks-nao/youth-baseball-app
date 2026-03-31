-- Phase 7+8: スキーマ追加（LINE通知設定フラグ、通知リンク）

-- team_line_config に通知カテゴリ別フラグを追加
ALTER TABLE team_line_config ADD COLUMN IF NOT EXISTS notify_post BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE team_line_config ADD COLUMN IF NOT EXISTS notify_event BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE team_line_config ADD COLUMN IF NOT EXISTS notify_payment BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE team_line_config ADD COLUMN IF NOT EXISTS notify_shop BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE team_line_config ADD COLUMN IF NOT EXISTS batch_mode BOOLEAN NOT NULL DEFAULT false;

-- notifications に遷移先リンクを追加
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- users に line_user_id を追加（LINE個別通知用）
ALTER TABLE users ADD COLUMN IF NOT EXISTS line_user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON users(line_user_id) WHERE line_user_id IS NOT NULL;
