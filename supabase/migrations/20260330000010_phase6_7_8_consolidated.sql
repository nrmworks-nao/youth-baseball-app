CREATE TABLE fee_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fee_settings_team_id ON fee_settings(team_id);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
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

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payer_user_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  payment_method TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_team_id ON payments(team_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);

CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  entry_date DATE NOT NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  receipt_url TEXT,
  recorded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ledger_entries_team_id ON ledger_entries(team_id);
CREATE INDEX idx_ledger_entries_date ON ledger_entries(team_id, entry_date DESC);

CREATE TABLE shop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES shop_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES shop_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  price_min INTEGER,
  price_max INTEGER,
  age_group TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shop_products_category_id ON shop_products(category_id);

CREATE TABLE shop_product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shop_product_images_product_id ON shop_product_images(product_id);

CREATE TABLE shop_product_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  url TEXT NOT NULL,
  price INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shop_product_links_product_id ON shop_product_links(product_id);

CREATE TABLE team_pinned_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  comment TEXT,
  pinned_by UUID NOT NULL REFERENCES users(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, product_id)
);

CREATE INDEX idx_team_pinned_products_team_id ON team_pinned_products(team_id);

CREATE TABLE team_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  introduction TEXT,
  home_ground TEXT,
  practice_schedule TEXT,
  member_count INTEGER,
  founded_year INTEGER,
  contact_email TEXT,
  website_url TEXT,
  photo_urls TEXT[],
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE team_line_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  line_channel_id TEXT,
  line_channel_secret TEXT,
  line_channel_access_token TEXT,
  line_group_id TEXT,
  liff_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inter_team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  to_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  parent_message_id UUID REFERENCES inter_team_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inter_team_messages_from ON inter_team_messages(from_team_id);
CREATE INDEX idx_inter_team_messages_to ON inter_team_messages(to_team_id);

CREATE TABLE match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  to_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id),
  message TEXT,
  preferred_venue TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  responded_by UUID REFERENCES users(id),
  responded_at TIMESTAMPTZ,
  confirmed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_requests_from ON match_requests(from_team_id);
CREATE INDEX idx_match_requests_to ON match_requests(to_team_id);

CREATE TABLE match_request_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_request_id UUID NOT NULL REFERENCES match_requests(id) ON DELETE CASCADE,
  proposed_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_request_dates_request ON match_request_dates(match_request_id);

CREATE TABLE head_to_head_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  opponent_name TEXT NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  game_date DATE NOT NULL,
  result TEXT NOT NULL,
  score_team INTEGER,
  score_opponent INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_head_to_head_records_team_id ON head_to_head_records(team_id);
CREATE INDEX idx_head_to_head_records_opponent ON head_to_head_records(opponent_team_id);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  notification_type TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  is_sent_line BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_team_id ON notifications(team_id);

ALTER TABLE fee_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_product_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_pinned_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_line_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE inter_team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_request_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE head_to_head_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fee_settings_select_team" ON fee_settings
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

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

CREATE POLICY "invoices_select_admin_treasurer" ON invoices
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'treasurer')
    )
  );

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

CREATE POLICY "shop_categories_select_all" ON shop_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "shop_categories_insert_admin" ON shop_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "shop_categories_update_admin" ON shop_categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "shop_categories_delete_admin" ON shop_categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "shop_products_select_all" ON shop_products
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "shop_products_insert_admin" ON shop_products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "shop_products_update_admin" ON shop_products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "shop_products_delete_admin" ON shop_products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "shop_product_images_select_all" ON shop_product_images
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "shop_product_images_insert_admin" ON shop_product_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "shop_product_images_delete_admin" ON shop_product_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "shop_product_links_select_all" ON shop_product_links
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "shop_product_links_insert_admin" ON shop_product_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "shop_product_links_update_admin" ON shop_product_links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid() AND permission_group = 'system_admin'
    )
  );

CREATE POLICY "team_pinned_products_select_team" ON team_pinned_products
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "team_pinned_products_insert" ON team_pinned_products
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "team_pinned_products_delete" ON team_pinned_products
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'manager')
    )
  );

CREATE POLICY "team_profiles_select_public" ON team_profiles
  FOR SELECT USING (is_public = true AND auth.uid() IS NOT NULL);

CREATE POLICY "team_profiles_select_own_team" ON team_profiles
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

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

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    team_id IS NULL
    OR team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid()
        AND permission_group IN ('system_admin', 'team_admin', 'vice_president', 'manager')
    )
  );

CREATE TRIGGER set_updated_at_fee_settings BEFORE UPDATE ON fee_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_invoices BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_payments BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_ledger_entries BEFORE UPDATE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_shop_products BEFORE UPDATE ON shop_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_shop_product_links BEFORE UPDATE ON shop_product_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_team_profiles BEFORE UPDATE ON team_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_team_line_config BEFORE UPDATE ON team_line_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_match_requests BEFORE UPDATE ON match_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
