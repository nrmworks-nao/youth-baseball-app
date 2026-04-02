-- ============================================================
-- RLSポリシー修正: 旧ロール名 → 新ロール名
-- system_admin → is_admin フラグ判定
-- team_admin → director
-- manager → coach
-- パート4/4（最終）: チーム間連携・通知・Storage
-- ============================================================

-- ============================================================
-- 1. team_profiles
-- ============================================================
DROP POLICY IF EXISTS "team_profiles_insert" ON team_profiles;
CREATE POLICY "team_profiles_insert" ON team_profiles
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.user_id = auth.uid()
        AND (
          tm.permission_group IN ('director', 'president', 'vice_president')
          OR u.is_admin = true
        )
    )
  );

DROP POLICY IF EXISTS "team_profiles_update" ON team_profiles;
CREATE POLICY "team_profiles_update" ON team_profiles
  FOR UPDATE USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.user_id = auth.uid()
        AND (
          tm.permission_group IN ('director', 'president', 'vice_president')
          OR u.is_admin = true
        )
    )
  );

-- ============================================================
-- 2. inter_team_messages
-- ============================================================
DROP POLICY IF EXISTS "inter_team_messages_select" ON inter_team_messages;
CREATE POLICY "inter_team_messages_select" ON inter_team_messages
  FOR SELECT USING (
    from_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
    OR to_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "inter_team_messages_insert" ON inter_team_messages;
CREATE POLICY "inter_team_messages_insert" ON inter_team_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND from_team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.user_id = auth.uid()
        AND (
          tm.permission_group IN ('director', 'president', 'vice_president')
          OR u.is_admin = true
        )
    )
  );

DROP POLICY IF EXISTS "inter_team_messages_update" ON inter_team_messages;
CREATE POLICY "inter_team_messages_update" ON inter_team_messages
  FOR UPDATE USING (
    to_team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.user_id = auth.uid()
        AND (
          tm.permission_group IN ('director', 'president', 'vice_president')
          OR u.is_admin = true
        )
    )
  );

-- ============================================================
-- 3. match_requests
-- ============================================================
DROP POLICY IF EXISTS "match_requests_select" ON match_requests;
CREATE POLICY "match_requests_select" ON match_requests
  FOR SELECT USING (
    from_team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.user_id = auth.uid()
        AND (
          tm.permission_group IN ('director', 'president', 'vice_president', 'coach')
          OR u.is_admin = true
        )
    )
    OR to_team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.user_id = auth.uid()
        AND (
          tm.permission_group IN ('director', 'president', 'vice_president', 'coach')
          OR u.is_admin = true
        )
    )
  );

DROP POLICY IF EXISTS "match_requests_insert" ON match_requests;
CREATE POLICY "match_requests_insert" ON match_requests
  FOR INSERT WITH CHECK (
    requested_by = auth.uid()
    AND from_team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.user_id = auth.uid()
        AND (
          tm.permission_group IN ('director', 'president', 'vice_president', 'coach')
          OR u.is_admin = true
        )
    )
  );

DROP POLICY IF EXISTS "match_requests_update" ON match_requests;
CREATE POLICY "match_requests_update" ON match_requests
  FOR UPDATE USING (
    from_team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.user_id = auth.uid()
        AND (
          tm.permission_group IN ('director', 'president', 'vice_president', 'coach')
          OR u.is_admin = true
        )
    )
    OR to_team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.user_id = auth.uid()
        AND (
          tm.permission_group IN ('director', 'president', 'vice_president', 'coach')
          OR u.is_admin = true
        )
    )
  );

-- ============================================================
-- 4. match_request_dates
-- ============================================================
DROP POLICY IF EXISTS "match_request_dates_select" ON match_request_dates;
CREATE POLICY "match_request_dates_select" ON match_request_dates
  FOR SELECT USING (
    match_request_id IN (
      SELECT id FROM match_requests
      WHERE from_team_id IN (
        SELECT tm.team_id FROM team_members tm
        JOIN users u ON u.id = tm.user_id
        WHERE tm.user_id = auth.uid()
          AND (
            tm.permission_group IN ('director', 'president', 'vice_president', 'coach')
            OR u.is_admin = true
          )
      )
      OR to_team_id IN (
        SELECT tm.team_id FROM team_members tm
        JOIN users u ON u.id = tm.user_id
        WHERE tm.user_id = auth.uid()
          AND (
            tm.permission_group IN ('director', 'president', 'vice_president', 'coach')
            OR u.is_admin = true
          )
      )
    )
  );

DROP POLICY IF EXISTS "match_request_dates_insert" ON match_request_dates;
CREATE POLICY "match_request_dates_insert" ON match_request_dates
  FOR INSERT WITH CHECK (
    match_request_id IN (
      SELECT id FROM match_requests
      WHERE from_team_id IN (
        SELECT tm.team_id FROM team_members tm
        JOIN users u ON u.id = tm.user_id
        WHERE tm.user_id = auth.uid()
          AND (
            tm.permission_group IN ('director', 'president', 'vice_president', 'coach')
            OR u.is_admin = true
          )
      )
    )
  );

DROP POLICY IF EXISTS "match_request_dates_update" ON match_request_dates;
DROP POLICY IF EXISTS "match_request_dates_delete" ON match_request_dates;
CREATE POLICY "match_request_dates_delete" ON match_request_dates
  FOR DELETE USING (
    match_request_id IN (
      SELECT id FROM match_requests
      WHERE from_team_id IN (
        SELECT tm.team_id FROM team_members tm
        JOIN users u ON u.id = tm.user_id
        WHERE tm.user_id = auth.uid()
          AND (
            tm.permission_group IN ('director', 'president', 'vice_president', 'coach')
            OR u.is_admin = true
          )
      )
    )
  );

-- ============================================================
-- 5. head_to_head_records
-- ============================================================
DROP POLICY IF EXISTS "head_to_head_records_insert" ON head_to_head_records;
CREATE POLICY "head_to_head_records_insert" ON head_to_head_records
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.user_id = auth.uid()
        AND (
          tm.permission_group IN ('director', 'coach')
          OR u.is_admin = true
        )
    )
  );

DROP POLICY IF EXISTS "head_to_head_records_update" ON head_to_head_records;
CREATE POLICY "head_to_head_records_update" ON head_to_head_records
  FOR UPDATE USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.user_id = auth.uid()
        AND (
          tm.permission_group IN ('director', 'coach')
          OR u.is_admin = true
        )
    )
  );

-- ============================================================
-- 6. team_line_config（is_admin のみ）
-- ============================================================
DROP POLICY IF EXISTS "team_line_config_select" ON team_line_config;
CREATE POLICY "team_line_config_select" ON team_line_config
  FOR SELECT USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.user_id = auth.uid()
        AND u.is_admin = true
    )
  );

DROP POLICY IF EXISTS "team_line_config_insert" ON team_line_config;
CREATE POLICY "team_line_config_insert" ON team_line_config
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.user_id = auth.uid()
        AND u.is_admin = true
    )
  );

DROP POLICY IF EXISTS "team_line_config_update" ON team_line_config;
CREATE POLICY "team_line_config_update" ON team_line_config
  FOR UPDATE USING (
    team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.user_id = auth.uid()
        AND u.is_admin = true
    )
  );

-- ============================================================
-- 7. notifications
-- ============================================================
-- SELECT: 全ロール（自分宛のみ） — 既存ポリシーはそのままでOK
-- notifications_select_own は user_id = auth.uid() なので変更不要

-- INSERT: director, president, vice_president, coach + is_admin
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    team_id IS NULL
    OR team_id IN (
      SELECT tm.team_id FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.user_id = auth.uid()
        AND (
          tm.permission_group IN ('director', 'president', 'vice_president', 'coach')
          OR u.is_admin = true
        )
    )
  );

-- UPDATE: 全ロール（自分宛の既読更新） — 既存ポリシーはそのままでOK
-- notifications_update_own は user_id = auth.uid() なので変更不要

-- ============================================================
-- 8-10. Storage ポリシー（storage.objects）
-- albums / avatars / scorebooks の DELETE ポリシー
-- 旧: team_admin, publicity → 新: director + is_admin
-- ============================================================

-- albums
DROP POLICY IF EXISTS "albums: owner or admin/publicity can delete" ON storage.objects;
CREATE POLICY "albums: owner or director/admin can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'albums'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.team_members tm
        JOIN public.users u ON u.id = tm.user_id
        WHERE tm.team_id = storage.team_id_from_path(name)
          AND tm.user_id = auth.uid()
          AND (
            tm.permission_group = 'director'
            OR u.is_admin = true
          )
      )
    )
  );

-- avatars
DROP POLICY IF EXISTS "avatars: owner or admin/publicity can delete" ON storage.objects;
CREATE POLICY "avatars: owner or director/admin can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.team_members tm
        JOIN public.users u ON u.id = tm.user_id
        WHERE tm.team_id = storage.team_id_from_path(name)
          AND tm.user_id = auth.uid()
          AND (
            tm.permission_group = 'director'
            OR u.is_admin = true
          )
      )
    )
  );

-- scorebooks
DROP POLICY IF EXISTS "scorebooks: owner or admin/publicity can delete" ON storage.objects;
CREATE POLICY "scorebooks: owner or director/admin can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'scorebooks'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.team_members tm
        JOIN public.users u ON u.id = tm.user_id
        WHERE tm.team_id = storage.team_id_from_path(name)
          AND tm.user_id = auth.uid()
          AND (
            tm.permission_group = 'director'
            OR u.is_admin = true
          )
      )
    )
  );
