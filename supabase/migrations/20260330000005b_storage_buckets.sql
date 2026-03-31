-- Storage バケット作成 & RLS ポリシー
-- albums / avatars / scorebooks の3バケットを一括管理

-- ============================================================
-- 1. バケット作成（存在しない場合のみ）
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('albums',     'albums',     false, 10485760),
  ('avatars',    'avatars',    false, 10485760),
  ('scorebooks', 'scorebooks', false, 10485760)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit;

-- ============================================================
-- 2. ヘルパー関数: パスの1階層目からチームIDを取得
-- ============================================================
CREATE OR REPLACE FUNCTION storage.team_id_from_path(path text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (split_part(path, '/', 1))::uuid;
$$;

-- ============================================================
-- 3. RLS ポリシー（各バケット共通方針）
--    パス構成: {teamId}/...
--    SELECT / INSERT: 同じチームのメンバー
--    DELETE: アップロード者本人 or team_admin / publicity
-- ============================================================

-- ----------------------------------------------------------
-- albums
-- ----------------------------------------------------------
CREATE POLICY "albums: team members can read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'albums'
    AND EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = storage.team_id_from_path(name)
        AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "albums: team members can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'albums'
    AND EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = storage.team_id_from_path(name)
        AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "albums: owner or admin/publicity can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'albums'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = storage.team_id_from_path(name)
          AND team_members.user_id = auth.uid()
          AND team_members.permission_group IN ('team_admin', 'publicity')
      )
    )
  );

-- ----------------------------------------------------------
-- avatars
-- ----------------------------------------------------------
CREATE POLICY "avatars: team members can read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = storage.team_id_from_path(name)
        AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "avatars: team members can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = storage.team_id_from_path(name)
        AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "avatars: owner or admin/publicity can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = storage.team_id_from_path(name)
          AND team_members.user_id = auth.uid()
          AND team_members.permission_group IN ('team_admin', 'publicity')
      )
    )
  );

-- ----------------------------------------------------------
-- scorebooks
-- ----------------------------------------------------------
CREATE POLICY "scorebooks: team members can read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'scorebooks'
    AND EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = storage.team_id_from_path(name)
        AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "scorebooks: team members can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'scorebooks'
    AND EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = storage.team_id_from_path(name)
        AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "scorebooks: owner or admin/publicity can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'scorebooks'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = storage.team_id_from_path(name)
          AND team_members.user_id = auth.uid()
          AND team_members.permission_group IN ('team_admin', 'publicity')
      )
    )
  );
