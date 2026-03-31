-- users テーブルに通知設定カラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_settings JSONB NOT NULL DEFAULT '{"schedule": true, "post": true, "accounting": true}'::jsonb;
