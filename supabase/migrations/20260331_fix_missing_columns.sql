-- teams テーブルの不足カラム追加
-- Naoya さんが Supabase SQL Editor で実行してください
--
-- 原因: phase1_auth_team_base マイグレーションで league カラムが定義されていなかった
-- 影響: POST /api/teams/create が PGRST204 エラー（500）を返していた

-- teams テーブルに league カラムを追加
ALTER TABLE teams ADD COLUMN IF NOT EXISTS league VARCHAR(100);

-- 確認用（実行後にコメント解除して確認可能）:
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name = 'teams'
-- ORDER BY ordinal_position;
