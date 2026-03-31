-- チームブランディング機能: banner_url カラム追加 & team-assets Storageバケット

-- ============================================================
-- 1. teams テーブルに banner_url カラム追加
-- ============================================================
ALTER TABLE teams ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- ============================================================
-- 2. team-assets Storageバケット作成（公開バケット）
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-assets', 'team-assets', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Storage RLS ポリシー
-- ============================================================

-- 閲覧は全員可（公開バケット）
CREATE POLICY "Team assets are publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'team-assets');

-- アップロードはログインユーザーのみ
CREATE POLICY "Team admins can upload team assets"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'team-assets' AND auth.role() = 'authenticated'
);

-- 削除もログインユーザーのみ
CREATE POLICY "Team admins can delete team assets"
ON storage.objects FOR DELETE USING (
  bucket_id = 'team-assets' AND auth.role() = 'authenticated'
);
