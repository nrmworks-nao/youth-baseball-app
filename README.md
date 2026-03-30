# Youth Baseball Team Hub

少年野球チーム管理WEBアプリ。LINE連携でチーム運営を効率化します。

## 主な機能

- **チーム管理**: メンバー登録・招待・権限管理
- **カレンダー**: 練習・試合スケジュール・出欠管理
- **連絡**: チーム内連絡掲示板（既読管理・リアクション）
- **試合記録**: スコアブック・打撃/投手成績・ランキング
- **キッズ機能**: バッジ・マイルストーン・成長記録・目標設定
- **アルバム**: チーム写真共有
- **会計**: 月会費管理・請求書・支払い追跡
- **ショップ**: おすすめ用品紹介（ECサイトリンク）
- **チーム間交流**: 練習試合申込み・メッセージ
- **LINE連携**: LIFFログイン・プッシュ通知

## 技術スタック

- **フロントエンド**: Next.js 16 (App Router) + TypeScript
- **バックエンド/DB**: Supabase (PostgreSQL + Auth + Storage)
- **UI**: shadcn/ui + Tailwind CSS 4
- **グラフ**: Recharts
- **LINE連携**: LINE LIFF SDK + Messaging API
- **デプロイ**: Vercel

## セットアップ

### 前提条件

- Node.js 20+
- npm 10+
- Supabase CLI（ローカル開発の場合）

### 1. リポジトリのクローンと依存関係のインストール

```bash
git clone https://github.com/nrmworks-nao/youth-baseball-app.git
cd youth-baseball-app
npm install
```

### 2. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集し、各環境変数を設定します。

### 3. Supabase のセットアップ

#### Supabase プロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard) でプロジェクトを作成
2. Settings > API から以下を取得:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

#### データベースマイグレーション

```bash
# Supabase CLI でローカル開発
supabase start
supabase db reset  # マイグレーション + seed.sql を実行

# リモートDB への適用
supabase db push
```

マイグレーションファイルは `supabase/migrations/` にフェーズ別に格納されています:

| ファイル | 内容 |
|---------|------|
| `phase1_auth_team_base` | ユーザー・チーム・メンバー |
| `phase2_calendar_posts` | カレンダー・連絡 |
| `phase3_games_stats` | 試合・成績 |
| `phase4_kids_features` | キッズ機能（バッジ等） |
| `phase5_albums` | アルバム |
| `phase6_accounting` | 会計 |
| `phase7_shop` | ショップ |
| `phase8_inter_team_notifications` | チーム間・通知 |

#### Storage バケット

Supabase Dashboard の Storage で以下のバケットを作成:

- `avatars` - ユーザーアバター画像
- `albums` - チームアルバム写真
- `scorebooks` - スコアブック画像

各バケットに team_id ベースの RLS ポリシーを設定してください。

### 4. LINE Developers のセットアップ

1. [LINE Developers Console](https://developers.line.biz/) でプロバイダ・チャネルを作成
2. **LINE Login チャネル**:
   - LIFF アプリを作成（Endpoint URL にデプロイ先URLを設定）
   - LIFF ID → `NEXT_PUBLIC_LIFF_ID`
3. **Messaging API チャネル**:
   - Channel Access Token → `LINE_CHANNEL_ACCESS_TOKEN`
   - Channel Secret → `LINE_CHANNEL_SECRET`
   - Webhook URL: `https://your-app.vercel.app/api/webhooks/line`

### 5. ローカル開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。

## 環境変数一覧

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase プロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase 匿名キー（ブラウザ公開） |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase 管理者キー（サーバーのみ） |
| `NEXT_PUBLIC_LIFF_ID` | Yes | LINE LIFF アプリID |
| `LINE_CHANNEL_ACCESS_TOKEN` | Yes | LINE Messaging API トークン（サーバーのみ） |
| `LINE_CHANNEL_SECRET` | Yes | LINE チャネルシークレット（サーバーのみ） |
| `NEXT_PUBLIC_APP_URL` | No | 本番アプリURL |

> **注意**: `NEXT_PUBLIC_` 接頭辞のない変数はサーバーサイドでのみ使用され、ブラウザには公開されません。

## npm スクリプト

```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run start        # 本番サーバー起動
npm run lint         # ESLint 実行
npm run format       # Prettier でフォーマット
npm run format:check # フォーマットチェック
```

## Vercel へのデプロイ

1. [Vercel](https://vercel.com) でリポジトリをインポート
2. Environment Variables に上記の環境変数をすべて設定
3. Framework Preset は **Next.js** を選択（自動検出）
4. デプロイ後、以下を更新:
   - LINE LIFF の Endpoint URL をデプロイ先URLに変更
   - LINE Messaging API の Webhook URL を設定
   - Supabase の Site URL をデプロイ先URLに変更

## ディレクトリ構成

```
src/
├── app/              # Next.js App Router ページ
│   ├── (auth)/       # 認証系（ログイン・招待・オンボーディング）
│   ├── (main)/       # 認証後メインエリア
│   └── api/          # API ルート（Webhook・Cron）
├── components/
│   ├── ui/           # 汎用UIコンポーネント
│   └── features/     # 機能別コンポーネント
├── hooks/            # カスタムフック
├── lib/
│   ├── supabase/     # Supabase クライアント・クエリ
│   ├── line/         # LINE LIFF・通知
│   ├── utils/        # ユーティリティ
│   └── validations/  # バリデーションメッセージ
└── types/            # 型定義
```

## 権限グループ

| グループ | 説明 |
|---------|------|
| `system_admin` | システム管理者 |
| `team_admin` | チーム管理者（監督） |
| `vice_president` | 副会長 |
| `treasurer` | 会計 |
| `manager` | マネージャー（コーチ） |
| `publicity` | 広報 |
| `parent` | 保護者 |

## ライセンス

Private
