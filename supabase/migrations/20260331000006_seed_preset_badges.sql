-- プリセットバッジの初期データ投入
-- team_id = NULL（システム共通）、is_preset = true、condition_type = 'auto'

INSERT INTO badge_definitions (team_id, name, description, category, condition_type, condition_key, icon_color, is_preset, is_active)
VALUES
  (NULL, '皆勤賞', '月間の練習に全て参加した', 'effort', 'auto', 'perfect_attendance', '#22c55e', true, true),
  (NULL, '初ヒット', '初めてのヒットを打った', 'batting', 'auto', 'first_hit', '#f59e0b', true, true),
  (NULL, '初打点', '初めての打点を記録した', 'batting', 'auto', 'first_rbi', '#ef4444', true, true),
  (NULL, '初ホームラン', '初めてのホームランを打った', 'batting', 'auto', 'first_homerun', '#8b5cf6', true, true),
  (NULL, '初盗塁', '初めての盗塁に成功した', 'running', 'auto', 'first_steal', '#06b6d4', true, true),
  (NULL, '初奪三振', '投手として初めての奪三振を記録した', 'pitching', 'auto', 'first_strikeout_pitched', '#10b981', true, true),
  (NULL, '初完投', '初めて完投した', 'pitching', 'auto', 'first_complete_game', '#3b82f6', true, true),
  (NULL, '初勝利', '投手として初めて勝利を記録した', 'pitching', 'auto', 'first_win', '#f97316', true, true),
  (NULL, '連続出塁', '3試合以上連続で出塁した', 'batting', 'auto', 'consecutive_on_base_3', '#eab308', true, true),
  (NULL, '守備の鉄人', '10試合連続ノーエラーを達成した', 'fielding', 'auto', 'iron_defense_10', '#6366f1', true, true),
  (NULL, '俊足ランナー', 'ベースラン自己ベストを更新した', 'running', 'auto', 'speed_runner', '#14b8a6', true, true),
  (NULL, '遠投キング', '遠投自己ベストを更新した', 'effort', 'auto', 'throw_king', '#dc2626', true, true),
  (NULL, '努力の星', '目標チャレンジを達成した', 'effort', 'auto', 'effort_star', '#fbbf24', true, true)
ON CONFLICT DO NOTHING;
