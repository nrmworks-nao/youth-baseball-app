-- 招待リンク・メンバー参加・選手登録に関するRLSポリシー追加

-- ============================================================
-- team_members: 招待コード経由の参加時に自分自身をINSERT可能
-- （既存ポリシーで user_id = auth.uid() の条件があるため追加不要）
-- ============================================================

-- team_members: vice_president も UPDATE 可能にする
DROP POLICY IF EXISTS "team_members_update_admin" ON team_members;
CREATE POLICY "team_members_update_admin_vp" ON team_members
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president')
    )
  );

-- team_members: vice_president も DELETE 可能にする
DROP POLICY IF EXISTS "team_members_delete_admin" ON team_members;
CREATE POLICY "team_members_delete_admin_vp" ON team_members
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president')
    )
    OR user_id = auth.uid()
  );

-- ============================================================
-- teams: vice_president も更新可能にする
-- ============================================================
DROP POLICY IF EXISTS "teams_update_admin" ON teams;
CREATE POLICY "teams_update_admin_vp" ON teams
  FOR UPDATE USING (
    id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president')
    )
  );

-- ============================================================
-- players: 参加フロー時（自分自身のINSERT、parent含む）
-- 既存ポリシーは admin/manager のみなので parent を追加
-- ============================================================
DROP POLICY IF EXISTS "players_insert_admin_manager" ON players;
CREATE POLICY "players_insert_admin_manager_parent" ON players
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
    -- parentは自分の子供の登録時（user_childrenとの連携はAPI側で担保）
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'parent'
    )
  );

-- players: 自分の子供の保護者はUPDATE可能
DROP POLICY IF EXISTS "players_update_admin_manager" ON players;
CREATE POLICY "players_update_admin_manager_parent" ON players
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager', 'vice_president')
    )
    OR id IN (
      SELECT player_id FROM user_children WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- user_children: 同じチームメンバーなら閲覧可（既存ポリシーで対応済み）
-- user_children: team_admin は全件閲覧可能（既存ポリシーの team_member 条件に含まれる）
-- ============================================================

-- team_members の is_active = false のレコードも閲覧可能にする（承認待ち表示用）
-- 既存ポリシーは同じチームのメンバーなら閲覧可なのでそのまま利用可能
-- ただしis_active=falseの自分のレコードは閲覧できるようにする
CREATE POLICY "team_members_select_own" ON team_members
  FOR SELECT USING (user_id = auth.uid());
