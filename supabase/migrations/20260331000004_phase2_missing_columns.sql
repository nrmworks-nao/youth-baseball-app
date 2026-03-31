-- Phase 2 補完: 不足カラム・テーブルの追加
-- post_read_status テーブル、posts.priority カラム、events 追加カラム、event_attendances の車出しカラム

-- ============================================================
-- posts テーブルに priority カラム追加
-- ============================================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal';
-- CHECK: normal, important, urgent

-- ============================================================
-- events テーブルに追加カラム
-- ============================================================
ALTER TABLE events ADD COLUMN IF NOT EXISTS meeting_time TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS meeting_place TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS items_to_bring TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS rsvp_deadline TIMESTAMPTZ;

-- ============================================================
-- event_attendances テーブルに車出し関連カラム追加
-- ============================================================
ALTER TABLE event_attendances ADD COLUMN IF NOT EXISTS can_drive BOOLEAN DEFAULT false;
ALTER TABLE event_attendances ADD COLUMN IF NOT EXISTS car_capacity INTEGER DEFAULT 0;

-- event_attendances に player_id ベースの UNIQUE 制約（出欠 upsert 用）
-- player_id がある場合: event_id + player_id でユニーク
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_attendances_event_player
  ON event_attendances(event_id, player_id) WHERE player_id IS NOT NULL;
-- user_id がある場合（保護者自身）: event_id + user_id でユニーク（player_id IS NULL）
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_attendances_event_user
  ON event_attendances(event_id, user_id) WHERE player_id IS NULL AND user_id IS NOT NULL;

-- ============================================================
-- post_read_status テーブル（既読管理）
-- ============================================================
CREATE TABLE IF NOT EXISTS post_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_read_status_post_id ON post_read_status(post_id);
CREATE INDEX IF NOT EXISTS idx_post_read_status_user_id ON post_read_status(user_id);

ALTER TABLE post_read_status ENABLE ROW LEVEL SECURITY;

-- 自分の既読情報は閲覧可
CREATE POLICY "post_read_status_select_own" ON post_read_status
  FOR SELECT USING (user_id = auth.uid());

-- 同じチームのメンバーは既読情報を閲覧可（管理者向け既読一覧表示用）
CREATE POLICY "post_read_status_select_team" ON post_read_status
  FOR SELECT USING (
    post_id IN (
      SELECT p.id FROM posts p
      JOIN team_members tm ON tm.team_id = p.team_id
      WHERE tm.user_id = auth.uid()
    )
  );

-- 自分の既読を登録
CREATE POLICY "post_read_status_insert_own" ON post_read_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 自分の既読を更新
CREATE POLICY "post_read_status_update_own" ON post_read_status
  FOR UPDATE USING (user_id = auth.uid());
