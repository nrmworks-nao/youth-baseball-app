-- Phase 5: アルバム
-- albums, album_photos, photo_likes

-- ============================================================
-- albums テーブル
-- ============================================================
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_photo_url TEXT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- イベントとの紐づけ
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_albums_team_id ON albums(team_id);

ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "albums_select_team" ON albums
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "albums_insert" ON albums
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'publicity')
    )
  );

CREATE POLICY "albums_update" ON albums
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'publicity')
    )
  );

CREATE POLICY "albums_delete" ON albums
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin')
    )
  );

-- ============================================================
-- album_photos テーブル
-- ============================================================
CREATE TABLE album_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  taken_at TIMESTAMPTZ,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_album_photos_album_id ON album_photos(album_id);
CREATE INDEX idx_album_photos_team_id ON album_photos(team_id);

ALTER TABLE album_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "album_photos_select_team" ON album_photos
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- team_admin, publicity, parentがアップロード可
CREATE POLICY "album_photos_insert" ON album_photos
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'publicity', 'parent')
    )
  );

CREATE POLICY "album_photos_delete" ON album_photos
  FOR DELETE USING (
    uploaded_by = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'publicity')
    )
  );

-- ============================================================
-- photo_likes テーブル
-- ============================================================
CREATE TABLE photo_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES album_photos(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

CREATE INDEX idx_photo_likes_photo_id ON photo_likes(photo_id);

ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photo_likes_select_team" ON photo_likes
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "photo_likes_insert" ON photo_likes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "photo_likes_delete" ON photo_likes
  FOR DELETE USING (user_id = auth.uid());

-- updated_at トリガー
CREATE TRIGGER set_updated_at_albums BEFORE UPDATE ON albums
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
