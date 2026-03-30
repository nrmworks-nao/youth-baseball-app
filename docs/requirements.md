# Youth Baseball Team Hub 要件定義書

## 1. プロジェクト概要

### 1.1 プロジェクト名
Youth Baseball Team Hub

### 1.2 目的
少年野球チームの運営を効率化するWEBアプリケーション。スケジュール管理、出欠確認、成績管理、会計、コミュニケーションなどチーム運営に必要な機能を一元管理し、指導者・保護者・選手の負担を軽減する。

### 1.3 対象ユーザー
- チーム管理者（監督・コーチ）
- 保護者
- 選手（キッズ向けUI）

### 1.4 利用環境
- スマートフォン（LINE内ブラウザ）をメインとしたレスポンシブWEBアプリ
- LINE LIFFアプリとして動作

---

## 2. 技術スタック

| カテゴリ | 技術 |
|---|---|
| フロントエンド | Next.js 14+ (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| チャート | Recharts |
| バックエンド/DB | Supabase (PostgreSQL + Auth + Storage) |
| 認証連携 | LINE LIFF SDK |
| 通知 | LINE Messaging API |

---

## 3. 機能一覧（全55機能）

### 3.1 認証・チーム管理（7機能）

| # | 機能名 | 説明 | 権限 |
|---|---|---|---|
| 3.1.1 | LINEログイン | LINE LIFF SDKによるログイン。LINE IDとアプリユーザーを紐づけ | 全員 |
| 3.1.2 | チーム作成 | 誰でもチームを作成可能。作成者は自動的にteam_adminとなる | 全員 |
| 3.1.3 | 招待リンク発行 | URL・QRコードによるチーム招待リンクを生成 | team_admin, vice_president |
| 3.1.4 | 保護者参加フロー | 招待リンクからの参加時、保護者として登録するフロー | 全員 |
| 3.1.5 | 保護者-選手紐づけ | 保護者アカウントと選手プロフィールの紐づけ管理 | team_admin, parent（自分の子のみ） |
| 3.1.6 | ロール管理 | 権限グループ方式によるメンバーの役割・権限管理 | team_admin |
| 3.1.7 | 複数チーム所属 | 1ユーザーが複数チームに所属可能。チーム切替機能 | 全員 |

### 3.2 カレンダー・出欠（4機能）

| # | 機能名 | 説明 | 権限 |
|---|---|---|---|
| 3.2.1 | イベント登録 | 練習・試合・その他イベントの登録。繰り返し設定対応 | team_admin, vice_president, manager |
| 3.2.2 | カレンダー表示 | 月表示・週表示・リスト表示。フィルタ機能付き | 全員 |
| 3.2.3 | 出欠管理（選手） | イベントごとの選手の出欠登録・集計 | team_admin, manager, parent（自分の子のみ） |
| 3.2.4 | 出欠管理（保護者） | 保護者自身の参加・当番の出欠管理 | team_admin, manager, parent（自分のみ） |

### 3.3 連絡・コミュニケーション（3機能）

| # | 機能名 | 説明 | 権限 |
|---|---|---|---|
| 3.3.1 | 投稿 | チーム内連絡投稿。テキスト・画像対応。カテゴリ分類 | team_admin, vice_president, manager, publicity |
| 3.3.2 | リアクション・コメント | 投稿へのリアクション（スタンプ）とコメント | 全員 |
| 3.3.3 | 既読管理 | 投稿の既読状態を管理・表示 | team_admin, vice_president, manager |

### 3.4 スコアブック（3機能）

| # | 機能名 | 説明 | 権限 |
|---|---|---|---|
| 3.4.1 | 画像登録 | スコアブック画像のアップロード・管理 | team_admin, manager |
| 3.4.2 | AI解析（将来） | アップロード画像からのスコアデータ自動解析（将来実装） | - |
| 3.4.3 | 試合結果 | 試合結果の登録・表示。スコア・対戦相手管理 | team_admin, manager |

### 3.5 成績管理（5機能）

| # | 機能名 | 説明 | 権限 |
|---|---|---|---|
| 3.5.1 | 身体測定 | 選手の身長・体重などの記録・推移管理 | team_admin, manager, parent（自分の子のみ） |
| 3.5.2 | 体力測定 | 50m走・遠投などの体力測定記録 | team_admin, manager |
| 3.5.3 | 打撃成績 | 打率・安打数・出塁率などの打撃成績管理 | team_admin, manager |
| 3.5.4 | 守備・投手成績 | 守備率・投球回・防御率などの守備・投手成績管理 | team_admin, manager |
| 3.5.5 | 成長ダッシュボード | 選手個人の各種成績を統合表示するダッシュボード | team_admin, manager, parent（自分の子のみ） |

### 3.6 ランキング（2機能）

| # | 機能名 | 説明 | 権限 |
|---|---|---|---|
| 3.6.1 | チーム内ランキング | 各種成績のチーム内ランキング表示 | 全員 |
| 3.6.2 | 個人ランキング推移 | 個人のランキング推移グラフ | 全員 |

### 3.7 キッズ機能（9機能）

| # | 機能名 | 説明 | 権限 |
|---|---|---|---|
| 3.7.1 | マイ選手カード | 選手のプロフィールカード。ランクアップシステム付き | 全員 |
| 3.7.2 | 成長タイムライン | 選手の成長イベントをタイムライン形式で表示 | 全員 |
| 3.7.3 | 月間ふりかえり | 月ごとの活動・成績のふりかえり機能 | 全員 |
| 3.7.4 | MVP・がんばったで賞 | 月間MVP・がんばったで賞の選出・表示 | team_admin, manager（選出） / 全員（閲覧） |
| 3.7.5 | バッジ | 活動・成績に応じたバッジ付与システム | 自動付与 / 全員（閲覧） |
| 3.7.6 | マイ目標 | 選手が自分の目標を設定・管理 | 全員 |
| 3.7.7 | チームチャレンジ | チーム全体で取り組むチャレンジ機能 | team_admin, manager（作成） / 全員（参加） |
| 3.7.8 | メンバー図鑑 | チームメンバーの一覧・プロフィール閲覧 | 全員 |
| 3.7.9 | ベストプレー集 | ベストプレーの動画・写真集 | team_admin, manager, publicity（登録） / 全員（閲覧） |

### 3.8 アルバム（3機能）

| # | 機能名 | 説明 | 権限 |
|---|---|---|---|
| 3.8.1 | アルバム管理 | アルバムの作成・管理 | team_admin, publicity |
| 3.8.2 | 写真アップロード | イベントごとの写真アップロード | team_admin, publicity, parent |
| 3.8.3 | 写真閲覧・ダウンロード | 写真の閲覧・ダウンロード | 全員 |

### 3.9 会計（4機能）

| # | 機能名 | 説明 | 権限 |
|---|---|---|---|
| 3.9.1 | 会費設定・請求 | 月会費の設定、請求書の発行 | team_admin, treasurer |
| 3.9.2 | 入金・消込 | 入金確認・消込処理 | team_admin, treasurer |
| 3.9.3 | 収支台帳 | チームの収支記録・管理 | team_admin, treasurer |
| 3.9.4 | 支払い状況 | 保護者ごとの支払い状況一覧 | team_admin, treasurer / parent（自分のみ） |

### 3.10 チーム間連携（5機能）

| # | 機能名 | 説明 | 権限 |
|---|---|---|---|
| 3.10.1 | チームプロフィール | 対外公開用のチームプロフィール | team_admin |
| 3.10.2 | チーム検索 | 地域・カテゴリでのチーム検索 | 全員 |
| 3.10.3 | チーム間メッセージ | チーム管理者同士のメッセージ機能 | team_admin, vice_president |
| 3.10.4 | 練習試合申込 | 練習試合のマッチング・申込 | team_admin, vice_president, manager |
| 3.10.5 | 対戦成績 | チーム間の対戦成績記録 | team_admin, manager |

### 3.11 通知（3機能）

| # | 機能名 | 説明 | 権限 |
|---|---|---|---|
| 3.11.1 | LINEグループ通知 | LINE Messaging APIによるグループへの通知配信 | team_admin, vice_president |
| 3.11.2 | 個別通知 | LINE個別メッセージによる通知 | team_admin, vice_president, manager |
| 3.11.3 | アプリ内通知 | アプリ内の通知センター | 全員 |

### 3.12 買い物（6機能）

| # | 機能名 | 説明 | 権限 |
|---|---|---|---|
| 3.12.1 | 商品管理 | 商品の登録・編集・削除（管理者専用） | team_admin |
| 3.12.2 | 商品一覧・詳細 | 商品の一覧表示・詳細表示 | 全員 |
| 3.12.3 | おすすめピン留め+コメント | 管理者によるおすすめ商品のピン留めとコメント | team_admin, manager |
| 3.12.4 | お知らせ | 買い物関連のお知らせ配信 | team_admin |
| 3.12.5 | 備品管理 | チーム備品の在庫・貸出管理 | team_admin, manager |
| 3.12.6 | EC機能（将来） | アプリ内購入機能（将来実装） | - |

---

## 4. 画面一覧（全49画面）

### 4.1 認証・共通
| # | 画面名 | パス |
|---|---|---|
| 1 | ログイン | /login |
| 2 | チーム作成 | /teams/new |
| 3 | 招待受付 | /invite/[code] |
| 4 | チーム切替 | /teams |
| 5 | ホーム（ダッシュボード） | /dashboard |

### 4.2 カレンダー・出欠
| # | 画面名 | パス |
|---|---|---|
| 6 | カレンダー | /calendar |
| 7 | イベント作成・編集 | /calendar/new, /calendar/[id]/edit |
| 8 | イベント詳細 | /calendar/[id] |
| 9 | 出欠一覧 | /calendar/[id]/attendance |

### 4.3 連絡
| # | 画面名 | パス |
|---|---|---|
| 10 | 連絡一覧 | /posts |
| 11 | 投稿作成 | /posts/new |
| 12 | 投稿詳細 | /posts/[id] |
| 13 | 既読状況 | /posts/[id]/read-status |

### 4.4 スコアブック
| # | 画面名 | パス |
|---|---|---|
| 14 | スコアブック一覧 | /scorebook |
| 15 | スコアブック登録 | /scorebook/new |
| 16 | 試合結果詳細 | /scorebook/[id] |

### 4.5 成績
| # | 画面名 | パス |
|---|---|---|
| 17 | 成績トップ | /stats |
| 18 | 身体測定記録 | /stats/physical |
| 19 | 体力測定記録 | /stats/fitness |
| 20 | 打撃成績 | /stats/batting |
| 21 | 守備・投手成績 | /stats/fielding |
| 22 | 成長ダッシュボード | /stats/player/[id] |

### 4.6 ランキング
| # | 画面名 | パス |
|---|---|---|
| 23 | ランキング | /ranking |
| 24 | 個人ランキング推移 | /ranking/player/[id] |

### 4.7 キッズ
| # | 画面名 | パス |
|---|---|---|
| 25 | マイ選手カード | /kids/card |
| 26 | 成長タイムライン | /kids/timeline |
| 27 | 月間ふりかえり | /kids/review |
| 28 | MVP・賞 | /kids/awards |
| 29 | バッジ一覧 | /kids/badges |
| 30 | マイ目標 | /kids/goals |
| 31 | チームチャレンジ | /kids/challenges |
| 32 | メンバー図鑑 | /kids/members |
| 33 | ベストプレー集 | /kids/best-plays |

### 4.8 アルバム
| # | 画面名 | パス |
|---|---|---|
| 34 | アルバム一覧 | /albums |
| 35 | アルバム詳細 | /albums/[id] |
| 36 | 写真アップロード | /albums/[id]/upload |

### 4.9 会計
| # | 画面名 | パス |
|---|---|---|
| 37 | 会計トップ | /accounting |
| 38 | 会費設定 | /accounting/fees |
| 39 | 入金・消込 | /accounting/payments |
| 40 | 収支台帳 | /accounting/ledger |
| 41 | 支払い状況 | /accounting/status |

### 4.10 チーム間連携
| # | 画面名 | パス |
|---|---|---|
| 42 | チーム検索 | /teams/search |
| 43 | チームプロフィール | /teams/[id]/profile |
| 44 | チーム間メッセージ | /teams/messages |
| 45 | 練習試合申込 | /teams/match-request |

### 4.11 通知
| # | 画面名 | パス |
|---|---|---|
| 46 | 通知センター | /notifications |
| 47 | 通知設定 | /notifications/settings |

### 4.12 買い物
| # | 画面名 | パス |
|---|---|---|
| 48 | 買い物トップ | /shop |
| 49 | 商品詳細 | /shop/[id] |

---

## 5. 権限グループ

### 5.1 グループ定義

| 権限グループ | 説明 |
|---|---|
| system_admin | システム全体の管理者 |
| team_admin | チーム管理者（監督） |
| vice_president | 副代表 |
| treasurer | 会計担当 |
| manager | マネージャー・コーチ |
| publicity | 広報担当 |
| parent | 保護者 |

### 5.2 権限設計方針
- 権限チェックは `permission_group` カラムで判定
- UI表示用の肩書きは `display_title` カラムを使用（自由入力可）
- permission_group と display_title を分離することで、柔軟な肩書き表示と厳密な権限制御を両立

---

## 6. データベース設計（約35テーブル）

### 6.1 設計方針
- Supabase (PostgreSQL) を使用
- 全テーブルに `team_id` カラムを持ち、RLS (Row Level Security) で行レベルセキュリティを実現
- マイグレーションは `supabase/migrations/` に管理

### 6.2 テーブル一覧

#### 認証・チーム管理
| テーブル名 | 説明 |
|---|---|
| users | ユーザー基本情報（LINE ID紐づけ） |
| teams | チーム情報 |
| team_members | チーム所属・権限管理（permission_group, display_title） |
| invitations | 招待リンク管理 |
| players | 選手プロフィール |
| parent_player_relations | 保護者-選手紐づけ |

#### カレンダー・出欠
| テーブル名 | 説明 |
|---|---|
| events | イベント（練習・試合等） |
| event_attendances | 出欠情報 |

#### 連絡
| テーブル名 | 説明 |
|---|---|
| posts | 投稿 |
| post_comments | コメント |
| post_reactions | リアクション |
| post_read_status | 既読管理 |

#### スコアブック
| テーブル名 | 説明 |
|---|---|
| games | 試合情報 |
| game_scores | 試合スコア |
| scorebook_images | スコアブック画像 |

#### 成績
| テーブル名 | 説明 |
|---|---|
| physical_measurements | 身体測定 |
| fitness_tests | 体力測定 |
| batting_stats | 打撃成績 |
| fielding_stats | 守備成績 |
| pitching_stats | 投手成績 |

#### ランキング
| テーブル名 | 説明 |
|---|---|
| ranking_snapshots | ランキングスナップショット |

#### キッズ
| テーブル名 | 説明 |
|---|---|
| player_cards | 選手カード |
| player_ranks | ランク管理 |
| badges | バッジ定義 |
| player_badges | バッジ付与記録 |
| awards | MVP・賞 |
| goals | マイ目標 |
| team_challenges | チームチャレンジ |
| best_plays | ベストプレー |

#### アルバム
| テーブル名 | 説明 |
|---|---|
| albums | アルバム |
| photos | 写真 |

#### 会計
| テーブル名 | 説明 |
|---|---|
| fee_settings | 会費設定 |
| invoices | 請求 |
| payments | 入金 |
| ledger_entries | 収支台帳 |

#### チーム間連携
| テーブル名 | 説明 |
|---|---|
| team_profiles | チーム公開プロフィール |
| team_messages | チーム間メッセージ |
| match_requests | 練習試合申込 |

#### 通知
| テーブル名 | 説明 |
|---|---|
| notifications | 通知 |
| notification_settings | 通知設定 |

#### 買い物
| テーブル名 | 説明 |
|---|---|
| products | 商品 |
| product_recommendations | おすすめ |
| equipment | 備品 |

---

## 7. 認証・セキュリティ

### 7.1 認証フロー
1. LINE LIFFアプリとしてアクセス
2. LIFF SDK で LINE認証
3. LINE IDをもとに Supabase Auth でセッション管理
4. JWT トークンによる API 認証

### 7.2 セキュリティ方針
- 全テーブルに RLS ポリシー設定必須
- team_id ベースの行レベルセキュリティ
- API は全て認証必須
- 画像アップロードはファイルサイズ・形式を制限

---

## 8. LINE連携

### 8.1 LIFF
- LIFF SDKを使用したLINEログイン
- LINEプロフィール情報の取得
- LIFF内ブラウザでの動作

### 8.2 Messaging API
- LINEグループへの通知配信
- 個別メッセージ送信
- リッチメニュー対応（将来）

---

## 9. 非機能要件

### 9.1 パフォーマンス
- ページ読み込み: 3秒以内
- API レスポンス: 1秒以内

### 9.2 可用性
- Supabase マネージドサービスのSLAに準拠

### 9.3 スケーラビリティ
- 初期: 100チーム / 5,000ユーザー規模を想定
- Supabase のスケーリング機能を活用

### 9.4 対応環境
- LINE内ブラウザ（iOS / Android）
- モダンブラウザ（Chrome, Safari, Edge 最新版）

---

## 10. 開発方針

### 10.1 ディレクトリ構成
```
src/
├── app/              # ページ（App Router）
├── components/       # UIコンポーネント
│   ├── ui/          # shadcn/ui コンポーネント
│   └── features/    # 機能別コンポーネント
├── lib/
│   ├── supabase/    # Supabaseクエリ集約
│   └── utils/       # ユーティリティ
└── types/           # 型定義
```

### 10.2 コーディング規約
- TypeScript strict mode
- ESLint + Prettier による自動整形
- コンポーネントは関数コンポーネント + hooks
- 日本語コメント可

### 10.3 テスト方針
- ユニットテスト: Vitest
- E2Eテスト: Playwright（主要フロー）

---

## 11. 将来拡張

- AI スコアブック解析
- EC機能（アプリ内購入）
- LINE リッチメニュー対応
- PWA対応
- チーム間リーグ・トーナメント管理

---

## 12. 用語集

| 用語 | 説明 |
|---|---|
| LIFF | LINE Front-end Framework。LINEアプリ内でWEBアプリを動作させる仕組み |
| RLS | Row Level Security。PostgreSQLの行レベルセキュリティ機能 |
| permission_group | 権限チェック用のグループ識別子 |
| display_title | UI表示用の肩書き（自由入力） |
| team_admin | チーム管理者権限グループ |
