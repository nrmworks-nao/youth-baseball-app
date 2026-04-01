# Youth Baseball Team Hub

## プロジェクト概要
少年野球チーム管理WEBアプリ。

## 技術スタック
- Next.js 14+ (App Router) + TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- shadcn/ui + Tailwind CSS
- Recharts
- LINE LIFF SDK + Messaging API

## コーディング規約
- コンポーネントは src/components/ 以下
- ページは src/app/ 以下（App Router）
- Supabaseクエリは src/lib/supabase/ に集約
- 型定義は src/types/
- 日本語コメント可

## 権限グループ方式
director / president / vice_president / captain / coach / treasurer / publicity / parent
権限チェックは permission_group で判定、UI表示は getRoleLabel(permission_group) を使用
サイト管理者は is_admin フラグで判定（role とは独立）

## DB
- マイグレーションは supabase/migrations/
- RLSポリシーは全テーブルに必須
- team_id による行レベルセキュリティ
