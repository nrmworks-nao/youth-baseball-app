-- team_members の自己参照RLSポリシー問題を修正
-- 既存の "team_members_select_same_team" ポリシーは自己参照（サブクエリで同じテーブルを参照）のため、
-- 新規メンバー（チーム作成直後）のSELECTがブロックされる場合がある。
-- 自分自身のレコードを直接SELECTできるポリシーを追加して解消する。

DROP POLICY IF EXISTS "team_members_select_own" ON team_members;
CREATE POLICY "team_members_select_own" ON team_members
  FOR SELECT
  USING (user_id = auth.uid());
