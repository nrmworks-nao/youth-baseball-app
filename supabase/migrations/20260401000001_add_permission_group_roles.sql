-- 権限グループに新しいロールを追加: director, president, captain, coach
-- 既存の permission_group ENUM型に値を追加する

ALTER TYPE permission_group ADD VALUE IF NOT EXISTS 'director';
ALTER TYPE permission_group ADD VALUE IF NOT EXISTS 'president';
ALTER TYPE permission_group ADD VALUE IF NOT EXISTS 'captain';
ALTER TYPE permission_group ADD VALUE IF NOT EXISTS 'coach';
