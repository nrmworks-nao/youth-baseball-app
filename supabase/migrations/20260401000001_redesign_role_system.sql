-- ロール設計見直し: サイト管理者(is_admin)分離、role8種、display_title廃止

-- is_admin カラム追加
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 既存の team_admin ユーザーを is_admin = true に変更
UPDATE team_members SET is_admin = true WHERE permission_group = 'team_admin';
UPDATE team_members SET permission_group = 'director' WHERE permission_group = 'team_admin';

-- system_admin も is_admin = true に（存在する場合）
UPDATE team_members SET is_admin = true WHERE permission_group = 'system_admin';
UPDATE team_members SET permission_group = 'director' WHERE permission_group = 'system_admin';

-- manager → coach に統合（旧managerはcoachとして扱う）
UPDATE team_members SET permission_group = 'coach' WHERE permission_group = 'manager';

-- permission_group の制約更新
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_permission_group_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_permission_group_check
  CHECK (permission_group IN ('director', 'president', 'vice_president', 'captain', 'coach', 'treasurer', 'publicity', 'parent'));
