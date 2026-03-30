-- Phase 6: 会計
-- fee_settings, invoices, invoice_items, payments, ledger_entries

-- ============================================================
-- fee_settings テーブル（会費設定）
-- ============================================================
CREATE TABLE fee_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 月会費、入会金、イベント費等
  amount INTEGER NOT NULL, -- 金額（円）
  frequency TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly, one_time
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fee_settings_team_id ON fee_settings(team_id);

ALTER TABLE fee_settings ENABLE ROW LEVEL SECURITY;

-- チームメンバーは会費設定を閲覧可
CREATE POLICY "fee_settings_select_team" ON fee_settings
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- team_admin, treasurerのみ管理可
CREATE POLICY "fee_settings_insert" ON fee_settings
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'treasurer')
    )
  );

CREATE POLICY "fee_settings_update" ON fee_settings
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'treasurer')
    )
  );

-- ============================================================
-- invoices テーブル（請求書）
-- ============================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id), -- 請求先保護者
  title TEXT NOT NULL,
  total_amount INTEGER NOT NULL, -- 合計金額
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, partial, overdue, cancelled
  due_date DATE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_team_id ON invoices(team_id);
CREATE INDEX idx_invoices_target_user ON invoices(target_user_id);
CREATE INDEX idx_invoices_status ON invoices(team_id, status);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- team_admin, treasurerは全請求を閲覧可
CREATE POLICY "invoices_select_admin_treasurer" ON invoices
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'treasurer')
    )
  );

-- 保護者は自分宛ての請求のみ閲覧可
CREATE POLICY "invoices_select_own" ON invoices
  FOR SELECT USING (target_user_id = auth.uid());

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'treasurer')
    )
  );

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'treasurer')
    )
  );

-- ============================================================
-- invoice_items テーブル（請求明細）
-- ============================================================
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  fee_setting_id UUID REFERENCES fee_settings(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- 請求書と同じ権限ロジック
CREATE POLICY "invoice_items_select_admin_treasurer" ON invoice_items
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'treasurer')
    )
  );

CREATE POLICY "invoice_items_select_own" ON invoice_items
  FOR SELECT USING (
    invoice_id IN (SELECT id FROM invoices WHERE target_user_id = auth.uid())
  );

CREATE POLICY "invoice_items_insert" ON invoice_items
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'treasurer')
    )
  );

-- ============================================================
-- payments テーブル（入金記録）
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payer_user_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  payment_method TEXT, -- cash, bank_transfer 等
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_by UUID REFERENCES users(id), -- 確認者
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_team_id ON payments(team_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_admin_treasurer" ON payments
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'treasurer')
    )
  );

CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (payer_user_id = auth.uid());

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'treasurer')
    )
  );

CREATE POLICY "payments_update" ON payments
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'treasurer')
    )
  );

-- ============================================================
-- ledger_entries テーブル（収支台帳）
-- ============================================================
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL, -- income, expense
  category TEXT NOT NULL, -- 会費, 備品購入, 遠征費 等
  description TEXT NOT NULL,
  amount INTEGER NOT NULL, -- 正の値で統一、entry_typeで収支を判定
  entry_date DATE NOT NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL, -- 入金と紐づく場合
  receipt_url TEXT, -- 領収書画像URL
  recorded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ledger_entries_team_id ON ledger_entries(team_id);
CREATE INDEX idx_ledger_entries_date ON ledger_entries(team_id, entry_date DESC);

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ledger_entries_select_admin_treasurer" ON ledger_entries
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'treasurer')
    )
  );

CREATE POLICY "ledger_entries_insert" ON ledger_entries
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'treasurer')
    )
  );

CREATE POLICY "ledger_entries_update" ON ledger_entries
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'treasurer')
    )
  );

-- updated_at トリガー
CREATE TRIGGER set_updated_at_fee_settings BEFORE UPDATE ON fee_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_invoices BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_payments BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_ledger_entries BEFORE UPDATE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
