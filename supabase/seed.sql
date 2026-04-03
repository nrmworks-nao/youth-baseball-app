-- ========================================
-- Youth Baseball Team Hub テストデータ
-- ========================================
-- 使用方法: supabase db reset (seed.sql が自動実行されます)

-- テスト用UUIDを変数として定義
-- チーム
DO $$
DECLARE
  v_team_id uuid := 'a0000000-0000-0000-0000-000000000001';
  v_admin_user_id uuid := 'b0000000-0000-0000-0000-000000000001';
  v_coach_user_id uuid := 'b0000000-0000-0000-0000-000000000002';
  v_parent1_user_id uuid := 'b0000000-0000-0000-0000-000000000003';
  v_parent2_user_id uuid := 'b0000000-0000-0000-0000-000000000004';
  v_parent3_user_id uuid := 'b0000000-0000-0000-0000-000000000005';
  v_player1_id uuid := 'c0000000-0000-0000-0000-000000000001';
  v_player2_id uuid := 'c0000000-0000-0000-0000-000000000002';
  v_player3_id uuid := 'c0000000-0000-0000-0000-000000000003';
  v_player4_id uuid := 'c0000000-0000-0000-0000-000000000004';
  v_player5_id uuid := 'c0000000-0000-0000-0000-000000000005';
  v_event1_id uuid := 'd0000000-0000-0000-0000-000000000001';
  v_event2_id uuid := 'd0000000-0000-0000-0000-000000000002';
  v_event3_id uuid := 'd0000000-0000-0000-0000-000000000003';
  v_post1_id uuid := 'e0000000-0000-0000-0000-000000000001';
  v_post2_id uuid := 'e0000000-0000-0000-0000-000000000002';
  v_game1_id uuid := 'f0000000-0000-0000-0000-000000000001';
  v_fee_setting_id uuid := 'f1000000-0000-0000-0000-000000000001';
  v_product1_id uuid := 'f2000000-0000-0000-0000-000000000001';
  v_product2_id uuid := 'f2000000-0000-0000-0000-000000000002';
  v_product3_id uuid := 'f2000000-0000-0000-0000-000000000003';
  v_category_id uuid := 'f3000000-0000-0000-0000-000000000001';
BEGIN

-- ========================================
-- 1. テスト用ユーザー
-- ========================================
INSERT INTO users (id, display_name, avatar_url, line_user_id) VALUES
  (v_admin_user_id, '山田太郎（管理者）', NULL, 'U_test_admin'),
  (v_coach_user_id, '佐藤花子（コーチ）', NULL, 'U_test_coach'),
  (v_parent1_user_id, '鈴木一郎（保護者1）', NULL, 'U_test_parent1'),
  (v_parent2_user_id, '田中美咲（保護者2）', NULL, 'U_test_parent2'),
  (v_parent3_user_id, '高橋健太（保護者3）', NULL, 'U_test_parent3')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 2. テスト用チーム
-- ========================================
INSERT INTO teams (id, name, region, description) VALUES
  (v_team_id, 'テスト少年野球クラブ', '東京都 世田谷区', '世田谷区で活動する少年野球チームです。毎週土日に練習しています。')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 3. チームメンバー
-- ========================================
INSERT INTO team_members (team_id, user_id, permission_group, display_title) VALUES
  (v_team_id, v_admin_user_id, 'team_admin', '監督'),
  (v_team_id, v_coach_user_id, 'manager', 'コーチ'),
  (v_team_id, v_parent1_user_id, 'parent', '保護者'),
  (v_team_id, v_parent2_user_id, 'parent', '保護者'),
  (v_team_id, v_parent3_user_id, 'parent', '保護者')
ON CONFLICT DO NOTHING;

-- ========================================
-- 4. テスト用選手（5名、各学年）
-- ========================================
INSERT INTO players (id, team_id, name, number, position, grade, birth_date) VALUES
  (v_player1_id, v_team_id, '鈴木大翔', 1,  'pitcher',      6, '2014-04-15'),
  (v_player2_id, v_team_id, '田中陽太', 6,  'shortstop',    5, '2015-08-22'),
  (v_player3_id, v_team_id, '高橋蓮',   3,  'first_base',   4, '2016-01-10'),
  (v_player4_id, v_team_id, '伊藤悠真', 8,  'center_field', 3, '2017-06-30'),
  (v_player5_id, v_team_id, '渡辺結月', 10, 'second_base',  2, '2018-11-05')
ON CONFLICT (id) DO NOTHING;

-- 保護者と選手の紐付け
INSERT INTO parent_player_relation (user_id, player_id) VALUES
  (v_parent1_user_id, v_player1_id),
  (v_parent2_user_id, v_player2_id),
  (v_parent3_user_id, v_player3_id)
ON CONFLICT DO NOTHING;

-- ========================================
-- 5. テスト用イベント（3件）
-- ========================================
INSERT INTO events (id, team_id, title, event_type, start_at, end_at, location, description, created_by) VALUES
  (v_event1_id, v_team_id, '通常練習', 'practice',
    '2026-04-05 09:00:00+09', '2026-04-05 12:00:00+09',
    '世田谷公園グラウンド', '基礎練習とバッティング練習', v_admin_user_id),
  (v_event2_id, v_team_id, '練習試合 vs 杉並ジュニア', 'game',
    '2026-04-12 13:00:00+09', '2026-04-12 16:00:00+09',
    '杉並区立グラウンド', '練習試合です。ユニフォーム持参。', v_admin_user_id),
  (v_event3_id, v_team_id, '春季大会 1回戦', 'game',
    '2026-04-19 10:00:00+09', '2026-04-19 14:00:00+09',
    '駒沢オリンピック公園野球場', '世田谷区春季大会の1回戦です。', v_admin_user_id)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 6. テスト用連絡投稿（2件）
-- ========================================
INSERT INTO posts (id, team_id, author_id, title, body, category, priority) VALUES
  (v_post1_id, v_team_id, v_admin_user_id,
    '春季大会のお知らせ',
    '4月19日（日）に世田谷区春季大会が開催されます。\n\n■ 集合時間: 8:30\n■ 集合場所: 駒沢オリンピック公園野球場\n■ 持ち物: ユニフォーム、水筒、お弁当\n\n出欠の回答をお願いします。',
    'schedule', 'important'),
  (v_post2_id, v_team_id, v_coach_user_id,
    '先週の練習について',
    '先週の練習お疲れさまでした。\n\nバッティングフォームの改善が見られた選手が多く、良い傾向です。\n引き続き基礎練習を大切にしていきましょう。\n\n次回の練習でもフォームチェックを行います。',
    'report', 'normal')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 7. テスト用試合結果（1試合分）
-- ========================================
INSERT INTO games (id, team_id, event_id, game_type, opponent_name, is_home, our_score, opponent_score, result, innings, game_date, notes) VALUES
  (v_game1_id, v_team_id, v_event2_id, 'practice', '杉並ジュニア', false, 5, 3, 'win', 6, '2026-04-12', '投打がかみ合った好ゲーム')
ON CONFLICT (id) DO NOTHING;

-- 打撃成績
INSERT INTO player_game_stats (game_id, player_id, batting_order, position, at_bats, hits, doubles, triples, home_runs, rbis, walks, strikeouts, stolen_bases, sacrifice_bunts, sacrifice_flies) VALUES
  (v_game1_id, v_player1_id, 1, 'pitcher',       3, 2, 1, 0, 0, 1, 1, 0, 1, 0, 0),
  (v_game1_id, v_player2_id, 2, 'shortstop',     3, 1, 0, 0, 0, 2, 0, 1, 0, 1, 0),
  (v_game1_id, v_player3_id, 3, 'first_base',    3, 2, 0, 0, 1, 2, 0, 0, 0, 0, 0),
  (v_game1_id, v_player4_id, 4, 'center_field',  3, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0),
  (v_game1_id, v_player5_id, 5, 'second_base',   2, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- 投手成績（鈴木大翔がフル登板）
UPDATE player_game_stats
SET innings_pitched = 6.0,
    pitching_hits = 4,
    pitching_runs = 3,
    pitching_earned_runs = 2,
    pitching_walks = 2,
    pitching_strikeouts = 8,
    pitching_pitch_count = 78,
    pitching_result = 'win'
WHERE game_id = v_game1_id AND player_id = v_player1_id;

-- ========================================
-- 8. テスト用バッジ定義（プリセット全種）
-- ========================================
INSERT INTO badge_definitions (team_id, name, description, category, icon_emoji, condition_type, condition_value) VALUES
  (v_team_id, 'ファーストヒット',       '初めてのヒットを打った',           'batting',  '🏏', 'first_hit', 1),
  (v_team_id, 'ファースト打点',         '初めての打点を記録した',           'batting',  '💥', 'first_rbi', 1),
  (v_team_id, 'ファーストホームラン',   '初めてのホームランを打った',       'batting',  '🏠', 'first_homerun', 1),
  (v_team_id, '3割バッター',            '通算打率が3割を超えた',            'batting',  '⭐', 'batting_avg_over', 300),
  (v_team_id, '盗塁王',                 '10盗塁を達成した',                 'running',  '💨', 'stolen_bases_total', 10),
  (v_team_id, 'ファースト奪三振',       '初めての奪三振を記録した',         'pitching', '🔥', 'first_strikeout_pitched', 1),
  (v_team_id, '完投賞',                 '初めての完投を達成した',           'pitching', '💪', 'first_complete_game', 1),
  (v_team_id, '初勝利',                 '投手として初めての勝利を記録した', 'pitching', '🏆', 'first_win', 1),
  (v_team_id, '無失策10試合',           '10試合連続無失策を達成した',       'fielding', '🧤', 'errorless_games', 10),
  (v_team_id, '皆勤賞',                 '練習を1ヶ月間欠席なし',           'effort',   '📅', 'perfect_attendance', 1),
  (v_team_id, 'チームプレイヤー',       '仲間を助けるプレーが評価された',   'special',  '🤝', 'manual', 0),
  (v_team_id, 'ナイスガッツ',           '最後まで諦めないプレーを見せた',   'effort',   '🔥', 'manual', 0)
ON CONFLICT DO NOTHING;

-- 選手にバッジを付与（テスト）
INSERT INTO player_badges (player_id, badge_definition_id, awarded_at, awarded_by)
SELECT v_player1_id, bd.id, NOW(), v_admin_user_id
FROM badge_definitions bd
WHERE bd.team_id = v_team_id AND bd.name IN ('ファーストヒット', '初勝利', 'ファースト奪三振')
ON CONFLICT DO NOTHING;

INSERT INTO player_badges (player_id, badge_definition_id, awarded_at, awarded_by)
SELECT v_player3_id, bd.id, NOW(), v_admin_user_id
FROM badge_definitions bd
WHERE bd.team_id = v_team_id AND bd.name IN ('ファーストヒット', 'ファーストホームラン', 'ファースト打点')
ON CONFLICT DO NOTHING;

-- ========================================
-- 9. テスト用商品（3商品）
-- ========================================
INSERT INTO shop_categories (id, name, sort_order) VALUES
  (v_category_id, '野球用品', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO shop_products (id, category_id, name, description, price, is_active) VALUES
  (v_product1_id, v_category_id, 'ミズノ 少年軟式グローブ', '少年野球向けオールラウンド用グローブ。柔らかい革で扱いやすい。', 8800, true),
  (v_product2_id, v_category_id, 'SSK 少年軟式バット', '軽量で振りやすいカーボン製バット。76cm/540g。', 12000, true),
  (v_product3_id, v_category_id, 'アシックス スタッドスパイク', '足に優しいジュニア用スパイク。マジックテープ式。', 5500, true)
ON CONFLICT (id) DO NOTHING;

-- ECサイトリンク
INSERT INTO shop_product_links (product_id, store_name, url) VALUES
  (v_product1_id, 'Amazon', 'https://www.amazon.co.jp/dp/example1'),
  (v_product1_id, '楽天市場', 'https://item.rakuten.co.jp/example1'),
  (v_product2_id, 'Amazon', 'https://www.amazon.co.jp/dp/example2'),
  (v_product2_id, 'Yahoo!ショッピング', 'https://store.shopping.yahoo.co.jp/example2'),
  (v_product3_id, 'Amazon', 'https://www.amazon.co.jp/dp/example3'),
  (v_product3_id, '楽天市場', 'https://item.rakuten.co.jp/example3')
ON CONFLICT DO NOTHING;

-- チームおすすめ商品
INSERT INTO team_pinned_products (team_id, product_id, pinned_by) VALUES
  (v_team_id, v_product1_id, v_admin_user_id),
  (v_team_id, v_product2_id, v_admin_user_id)
ON CONFLICT DO NOTHING;

-- ========================================
-- 10. テスト用会費設定（月会費3000円）
-- ========================================
INSERT INTO fee_settings (id, team_id, name, amount, frequency, description, is_active) VALUES
  (v_fee_setting_id, v_team_id, '月会費', 3000, 'monthly', '毎月の活動費（グラウンド使用料、道具メンテナンス費含む）', true)
ON CONFLICT (id) DO NOTHING;

END $$;
