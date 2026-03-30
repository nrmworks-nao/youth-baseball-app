-- Phase 8: チーム間連携・通知
-- team_profiles, team_line_config
-- inter_team_messages, match_requests, match_request_dates, head_to_head_records
-- notifications

-- ============================================================
-- team_profiles テーブル（対外公開プロフィール）
-- ============================================================
CREATE TABLE team_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  introduction TEXT,
  home_ground TEXT, -- ホームグラウンド
  practice_schedule TEXT, -- 練習スケジュール説明
  member_count INTEGER,
  founded_year INTEGER,
  contact_email TEXT,
  website_url TEXT,
  photo_urls TEXT[],
  is_public BOOLEAN NOT NULL DEFAULT false, -- 公開/非公開
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE team_profiles ENABLE ROW LEVEL SECURITY;

-- 公開プロフィールは全認証ユーザーが閲覧可
CREATE POLICY "team_profiles_select_public" ON team_profiles
  FOR SELECT USING (is_public = true AND auth.uid() IS NOT NULL);

-- チームメンバーは自チームを閲覧可（非公開でも）
CREATE POLICY "team_profiles_select_own_team" ON team_profiles
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- team_adminのみ管理可
CREATE POLICY "team_profiles_insert" ON team_profiles
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin')
    )
  );

CREATE POLICY "team_profiles_update" ON team_profiles
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin')
    )
  );

-- ============================================================
-- team_line_config テーブル（LINE連携設定）
-- ============================================================
CREATE TABLE team_line_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  line_channel_id TEXT,
  line_channel_secret TEXT,
  line_channel_access_token TEXT,
  line_group_id TEXT, -- LINEグループID
  liff_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE team_line_config ENABLE ROW LEVEL SECURITY;

-- team_adminのみ閲覧・管理可
CREATE POLICY "team_line_config_select" ON team_line_config
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin')
    )
  );

CREATE POLICY "team_line_config_insert" ON team_line_config
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin')
    )
  );

CREATE POLICY "team_line_config_update" ON team_line_config
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin')
    )
  );

-- ============================================================
-- inter_team_messages テーブル（チーム間メッセージ）
-- ============================================================
CREATE TABLE inter_team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  to_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  parent_message_id UUID REFERENCES inter_team_messages(id) ON DELETE SET NULL, -- スレッド
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inter_team_messages_from ON inter_team_messages(from_team_id);
CREATE INDEX idx_inter_team_messages_to ON inter_team_messages(to_team_id);

ALTER TABLE inter_team_messages ENABLE ROW LEVEL SECURITY;

-- 送信チーム・受信チームのadmin/vice_presidentが閲覧可
CREATE POLICY "inter_team_messages_select" ON inter_team_messages
  FOR SELECT USING (
    from_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president')
    )
    OR to_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president')
    )
  );

CREATE POLICY "inter_team_messages_insert" ON inter_team_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND from_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president')
    )
  );

CREATE POLICY "inter_team_messages_update" ON inter_team_messages
  FOR UPDATE USING (
    to_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president')
    )
  );

-- ============================================================
-- match_requests テーブル（練習試合申込）
-- ============================================================
CREATE TABLE match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  to_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id),
  message TEXT,
  preferred_venue TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined, cancelled
  responded_by UUID REFERENCES users(id),
  responded_at TIMESTAMPTZ,
  confirmed_date DATE, -- 確定した日時
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_requests_from ON match_requests(from_team_id);
CREATE INDEX idx_match_requests_to ON match_requests(to_team_id);

ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_requests_select" ON match_requests
  FOR SELECT USING (
    from_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
    )
    OR to_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
    )
  );

CREATE POLICY "match_requests_insert" ON match_requests
  FOR INSERT WITH CHECK (
    requested_by = auth.uid()
    AND from_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
    )
  );

CREATE POLICY "match_requests_update" ON match_requests
  FOR UPDATE USING (
    from_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
    )
    OR to_team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
    )
  );

-- ============================================================
-- match_request_dates テーブル（練習試合候補日）
-- ============================================================
CREATE TABLE match_request_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_request_id UUID NOT NULL REFERENCES match_requests(id) ON DELETE CASCADE,
  proposed_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_selected BOOLEAN NOT NULL DEFAULT false, -- 確定した日程
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_request_dates_request ON match_request_dates(match_request_id);

ALTER TABLE match_request_dates ENABLE ROW LEVEL SECURITY;

-- match_requestsと同じ権限
CREATE POLICY "match_request_dates_select" ON match_request_dates
  FOR SELECT USING (
    match_request_id IN (
      SELECT id FROM match_requests
      WHERE from_team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
          AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
      )
      OR to_team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
          AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
      )
    )
  );

CREATE POLICY "match_request_dates_insert" ON match_request_dates
  FOR INSERT WITH CHECK (
    match_request_id IN (
      SELECT id FROM match_requests
      WHERE from_team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
          AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
      )
    )
  );

CREATE POLICY "match_request_dates_update" ON match_request_dates
  FOR UPDATE USING (
    match_request_id IN (
      SELECT id FROM match_requests
      WHERE from_team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
          AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
      )
      OR to_team_id IN (
        SELECT team_id FROM team_members
        WHERE user_id = auth.uid()
          AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
      )
    )
  );

-- ============================================================
-- head_to_head_records テーブル（対戦成績）
-- ============================================================
CREATE TABLE head_to_head_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  opponent_name TEXT NOT NULL, -- チーム未登録の相手にも対応
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  game_date DATE NOT NULL,
  result TEXT NOT NULL, -- win, lose, draw
  score_team INTEGER,
  score_opponent INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_head_to_head_records_team_id ON head_to_head_records(team_id);
CREATE INDEX idx_head_to_head_records_opponent ON head_to_head_records(opponent_team_id);

ALTER TABLE head_to_head_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "head_to_head_records_select_team" ON head_to_head_records
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "head_to_head_records_insert" ON head_to_head_records
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "head_to_head_records_update" ON head_to_head_records
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

-- ============================================================
-- notifications テーブル
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 通知先ユーザー
  title TEXT NOT NULL,
  body TEXT,
  notification_type TEXT NOT NULL, -- event, post, attendance, payment, match_request 等
  reference_type TEXT, -- 参照先テーブル名
  reference_id UUID, -- 参照先ID
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  is_sent_line BOOLEAN NOT NULL DEFAULT false, -- LINE通知送信済みか
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_team_id ON notifications(team_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 自分宛ての通知のみ閲覧可
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- 自分の通知のみ更新可（既読にする）
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- チームの管理者が通知を作成可（システムからの発行を想定）
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    team_id IS NULL -- システム通知
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
    )
  );

-- updated_at トリガー
CREATE TRIGGER set_updated_at_team_profiles BEFORE UPDATE ON team_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_team_line_config BEFORE UPDATE ON team_line_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_match_requests BEFORE UPDATE ON match_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
