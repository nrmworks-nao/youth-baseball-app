import { supabase } from "@/lib/supabase/client";
import type {
  FeeSetting,
  Invoice,
  InvoiceStatus,
  Payment,
  LedgerEntry,
  LedgerEntryType,
} from "@/types";

// === 会費設定 ===

/** 会費設定一覧取得 */
export async function getFeeSettings(teamId: string) {
  const { data, error } = await supabase
    .from("fee_settings")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as FeeSetting[];
}

/** 会費設定作成 */
export async function createFeeSetting(data: {
  team_id: string;
  name: string;
  amount: number;
  frequency: string;
  description?: string;
  created_by: string;
}) {
  const { data: setting, error } = await supabase
    .from("fee_settings")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return setting as FeeSetting;
}

/** 会費設定更新 */
export async function updateFeeSetting(
  id: string,
  data: { name?: string; amount?: number; is_active?: boolean; description?: string }
) {
  const { data: setting, error } = await supabase
    .from("fee_settings")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return setting as FeeSetting;
}

// === 請求 ===

/** 請求一覧取得 */
export async function getInvoices(teamId: string, status?: InvoiceStatus) {
  let query = supabase
    .from("invoices")
    .select("*, users!invoices_target_user_id_fkey(display_name)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  if (status) {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Invoice[];
}

/** 自分宛ての請求一覧 */
export async function getMyInvoices(userId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("target_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Invoice[];
}

/** 請求詳細取得 */
export async function getInvoice(invoiceId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*), users!invoices_target_user_id_fkey(display_name)")
    .eq("id", invoiceId)
    .single();
  if (error) throw error;
  return data as Invoice;
}

/** 請求作成 */
export async function createInvoice(data: {
  team_id: string;
  target_user_id: string;
  title: string;
  total_amount: number;
  due_date?: string;
  notes?: string;
  created_by: string;
  items: { description: string; amount: number; quantity: number }[];
}) {
  const { items, ...invoiceData } = data;
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert(invoiceData)
    .select()
    .single();
  if (error) throw error;

  if (items.length > 0) {
    const itemsData = items.map((item) => ({
      ...item,
      invoice_id: invoice.id,
      team_id: data.team_id,
    }));
    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemsData);
    if (itemsError) throw itemsError;
  }

  return invoice as Invoice;
}

/** 請求更新 */
export async function updateInvoice(
  invoiceId: string,
  data: {
    title?: string;
    total_amount?: number;
    due_date?: string | null;
    notes?: string | null;
    items?: { description: string; amount: number; quantity: number }[];
  }
) {
  const { items, ...invoiceData } = data;
  const { data: invoice, error } = await supabase
    .from("invoices")
    .update(invoiceData)
    .eq("id", invoiceId)
    .select()
    .single();
  if (error) throw error;

  if (items) {
    // 既存明細を削除して再作成
    const { error: deleteError } = await supabase
      .from("invoice_items")
      .delete()
      .eq("invoice_id", invoiceId);
    if (deleteError) throw deleteError;

    if (items.length > 0) {
      const itemsData = items.map((item) => ({
        ...item,
        invoice_id: invoiceId,
        team_id: invoice.team_id,
      }));
      const { error: insertError } = await supabase
        .from("invoice_items")
        .insert(itemsData);
      if (insertError) throw insertError;
    }
  }

  return invoice as Invoice;
}

/** 請求キャンセル */
export async function cancelInvoice(invoiceId: string) {
  const { data, error } = await supabase
    .from("invoices")
    .update({ status: "cancelled" })
    .eq("id", invoiceId)
    .select()
    .single();
  if (error) throw error;
  return data as Invoice;
}

/** 請求に紐づく入金履歴取得 */
export async function getInvoicePayments(invoiceId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*, users!payments_payer_user_id_fkey(display_name)")
    .eq("invoice_id", invoiceId)
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return data as Payment[];
}

/** 請求ステータス更新 */
export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
  const updateData: Record<string, unknown> = { status };
  if (status === "paid") {
    updateData.paid_at = new Date().toISOString();
  }
  const { data, error } = await supabase
    .from("invoices")
    .update(updateData)
    .eq("id", invoiceId)
    .select()
    .single();
  if (error) throw error;
  return data as Invoice;
}

/** 未納件数取得 */
export async function getOverdueCount(teamId: string) {
  const { count, error } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId)
    .in("status", ["pending", "overdue"]);
  if (error) throw error;
  return count ?? 0;
}

// === 入金 ===

/** 入金一覧取得 */
export async function getPayments(teamId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*, users!payments_payer_user_id_fkey(display_name)")
    .eq("team_id", teamId)
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return data as Payment[];
}

/** 自分の入金履歴 */
export async function getMyPayments(userId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*, invoices(title, total_amount)")
    .eq("payer_user_id", userId)
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return data as Payment[];
}

/** 入金記録作成 */
export async function createPayment(data: {
  team_id: string;
  invoice_id?: string;
  payer_user_id: string;
  amount: number;
  payment_method?: string;
  paid_at?: string;
  confirmed_by?: string;
  notes?: string;
}) {
  const { data: payment, error } = await supabase
    .from("payments")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return payment as Payment;
}

// === 収支台帳 ===

/** 収支台帳一覧取得 */
export async function getLedgerEntries(
  teamId: string,
  options?: { entryType?: LedgerEntryType; category?: string; year?: number; month?: number }
) {
  let query = supabase
    .from("ledger_entries")
    .select("*")
    .eq("team_id", teamId)
    .order("entry_date", { ascending: false });

  if (options?.entryType) {
    query = query.eq("entry_type", options.entryType);
  }
  if (options?.category) {
    query = query.eq("category", options.category);
  }
  if (options?.year && options?.month) {
    const startDate = `${options.year}-${String(options.month).padStart(2, "0")}-01`;
    const endMonth = options.month === 12 ? 1 : options.month + 1;
    const endYear = options.month === 12 ? options.year + 1 : options.year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
    query = query.gte("entry_date", startDate).lt("entry_date", endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as LedgerEntry[];
}

/** 収支台帳エントリ作成 */
export async function createLedgerEntry(data: {
  team_id: string;
  entry_type: LedgerEntryType;
  category: string;
  description: string;
  amount: number;
  entry_date: string;
  payment_id?: string;
  receipt_url?: string;
  recorded_by: string;
}) {
  const { data: entry, error } = await supabase
    .from("ledger_entries")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return entry as LedgerEntry;
}

/** 月別サマリー取得 */
export async function getMonthlySummary(teamId: string, year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("ledger_entries")
    .select("entry_type, amount")
    .eq("team_id", teamId)
    .gte("entry_date", startDate)
    .lt("entry_date", endDate);

  if (error) throw error;

  let income = 0;
  let expense = 0;
  (data ?? []).forEach((entry: { entry_type: string; amount: number }) => {
    if (entry.entry_type === "income") income += entry.amount;
    else expense += entry.amount;
  });

  return { income, expense, balance: income - expense };
}
