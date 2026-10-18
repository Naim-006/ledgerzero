import { DataService } from "../contracts";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  calculateCashPosition,
  calculateReceivablesSummary,
  calculatePayablesSummary,
  calculateAgingBuckets,
  calculateCashFlowForecast,
  simulateScenario,
  calculateBudgetUtilization,
  detectFinancialAnomalies,
  CashPosition,
  ReceivablesSummary,
  PayablesSummary,
  AgingBucket,
  CashFlowForecast,
  ScenarioSimulationResult,
  BudgetUtilization,
  AnomalyFlag,
} from "@/lib/finance/engine";
import {
  Business,
  Member,
  Role,
  Transaction,
  Invoice,
  Customer,
  Supplier,
  Budget,
  Scenario,
  ScenarioAssumption,
  AuditLog,
  Product,
  PosSaleRequest,
  PosSaleResult,
  FinancingEligibility,
} from "@/domain/types";

export class SupabaseDataService implements DataService {
  private activeBusinessId: string | null = null;

  private async getClient() {
    return getSupabaseClient();
  }

  private async getActiveBusinessId(): Promise<string> {
    if (this.activeBusinessId) return this.activeBusinessId;

    const sb = await this.getClient();
    const { data: { user } } = await sb.auth.getUser();
    
    if (!user) {
      // Return a stable fallback identifier if not authenticated
      return "00000000-0000-0000-0000-000000000000";
    }

    // Try finding a business where user is owner or member
    const { data: bizList } = await sb
      .from("businesses")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1);

    if (bizList && bizList.length > 0) {
      this.activeBusinessId = bizList[0].id;
      return bizList[0].id;
    }

    // Auto-create a default workspace for this authenticated user if none exists
    const userEmail = user.email || "shop@ledgerzero.internal";
    const userName = user.user_metadata?.full_name || userEmail.split("@")[0];
    const shopName = user.user_metadata?.business_name || `${userName}'s Shop`;

    const { data: newBiz, error } = await sb
      .from("businesses")
      .insert({
        owner_id: user.id,
        name: shopName,
        legal_name: `${shopName} LLC`,
        currency: "USD",
        country_code: "US",
        tax_identifier: user.user_metadata?.vat_id || null,
        tax_rate_percent: 0,
        tax_label: "Sales Tax",
      })
      .select("id")
      .single();

    if (newBiz) {
      this.activeBusinessId = newBiz.id;
      return newBiz.id;
    }

    return "00000000-0000-0000-0000-000000000000";
  }

  // ==========================================
  // Business & Team
  // ==========================================

  async getBusiness(): Promise<Business> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const { data, error } = await sb
      .from("businesses")
      .select("*")
      .eq("id", bizId)
      .maybeSingle();

    if (!data) {
      return {
        id: bizId,
        name: "My Enterprise",
        legalName: "My Enterprise LLC",
        countryCode: "US",
        currency: "USD",
        timeZone: "America/New_York",
        fiscalYearStartMonth: 1,
        taxIdentifier: "",
        taxRatePercent: 0,
        taxLabel: "Sales Tax",
        openingCashBalance: 0,
        createdAt: new Date().toISOString(),
      };
    }

    return {
      id: data.id,
      name: data.name,
      legalName: data.legal_name || `${data.name} LLC`,
      countryCode: data.country_code || "US",
      currency: data.currency || "USD",
      timeZone: "America/New_York",
      fiscalYearStartMonth: 1,
      taxIdentifier: data.tax_identifier || "",
      taxRatePercent: Number(data.tax_rate_percent) || 0,
      taxLabel: data.tax_label || "Sales Tax",
      openingCashBalance: 0,
      createdAt: data.created_at,
    };
  }

  async updateBusiness(updates: Partial<Business>): Promise<Business> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.legalName !== undefined) payload.legal_name = updates.legalName;
    if (updates.countryCode !== undefined) payload.country_code = updates.countryCode;
    if (updates.currency !== undefined) payload.currency = updates.currency;
    if (updates.taxIdentifier !== undefined) payload.tax_identifier = updates.taxIdentifier;
    if (updates.taxRatePercent !== undefined) payload.tax_rate_percent = updates.taxRatePercent;
    if (updates.taxLabel !== undefined) payload.tax_label = updates.taxLabel;

    await sb.from("businesses").update(payload).eq("id", bizId);
    return this.getBusiness();
  }

  async getMembers(): Promise<Member[]> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const { data } = await sb
      .from("business_members")
      .select("id, role, joined_at, profiles(id, email, full_name, role)")
      .eq("business_id", bizId);

    if (!data || data.length === 0) {
      const { data: { user } } = await sb.auth.getUser();
      return [
        {
          id: user?.id || "mem_owner",
          businessId: bizId,
          name: user?.user_metadata?.full_name || "Owner",
          email: user?.email || "owner@business.com",
          role: "Owner",
          createdAt: new Date().toISOString(),
        },
      ];
    }

    return data.map((m: any) => ({
      id: m.id,
      businessId: bizId,
      name: m.profiles?.full_name || m.profiles?.email || "Member",
      email: m.profiles?.email || "member@business.com",
      role: (m.role?.charAt(0).toUpperCase() + m.role?.slice(1)) as Role,
      createdAt: m.joined_at,
    }));
  }

  async inviteMember(memberData: Omit<Member, "id" | "createdAt">): Promise<Member> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const newMember: Member = {
      ...memberData,
      id: `mem-${Date.now()}`,
      businessId: bizId,
      createdAt: new Date().toISOString(),
    };

    await this.logEvent({
      businessId: bizId,
      actorType: "user",
      actorName: "Business Admin",
      action: "INVITED_TEAM_MEMBER",
      targetType: "Member",
      targetId: newMember.id,
      details: `Invited ${newMember.name} (${newMember.email}) as ${newMember.role}.`,
    });

    return newMember;
  }

  async updateMemberRole(memberId: string, role: Role): Promise<Member> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    await sb
      .from("business_members")
      .update({ role: role.toLowerCase() })
      .eq("id", memberId);

    return {
      id: memberId,
      businessId: bizId,
      name: "Team Member",
      email: "member@business.com",
      role,
      createdAt: new Date().toISOString(),
    };
  }

  // ==========================================
  // Deterministic Financial Intelligence
  // ==========================================

  async getCashPosition(): Promise<CashPosition> {
    const biz = await this.getBusiness();
    const { transactions } = await this.getTransactions();
    return calculateCashPosition(biz.openingCashBalance, transactions);
  }

  async getReceivablesSummary(): Promise<ReceivablesSummary> {
    const invoices = await this.getInvoices({ direction: "receivable" });
    const today = new Date().toISOString().split("T")[0];
    return calculateReceivablesSummary(invoices, today);
  }

  async getPayablesSummary(): Promise<PayablesSummary> {
    const invoices = await this.getInvoices({ direction: "payable" });
    const today = new Date().toISOString().split("T")[0];
    return calculatePayablesSummary(invoices, today);
  }

  async getReceivablesAging(): Promise<AgingBucket[]> {
    const invoices = await this.getInvoices({ direction: "receivable" });
    const today = new Date().toISOString().split("T")[0];
    return calculateAgingBuckets(invoices, "receivable", today);
  }

  async getPayablesAging(): Promise<AgingBucket[]> {
    const invoices = await this.getInvoices({ direction: "payable" });
    const today = new Date().toISOString().split("T")[0];
    return calculateAgingBuckets(invoices, "payable", today);
  }

  async getForecast(days: 7 | 30): Promise<CashFlowForecast> {
    const cashPos = await this.getCashPosition();
    const invoices = await this.getInvoices();
    const today = new Date().toISOString().split("T")[0];
    return calculateCashFlowForecast(cashPos.currentCash, invoices, today, days);
  }

  async getAnomalies(): Promise<AnomalyFlag[]> {
    const { transactions } = await this.getTransactions();
    const forecast = await this.getForecast(7);
    return detectFinancialAnomalies(transactions, forecast);
  }

  // ==========================================
  // Transactions (CRUD on Supabase)
  // ==========================================

  async getTransactions(params?: {
    search?: string;
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: Transaction[]; total: number }> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    let query = sb
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("business_id", bizId)
      .order("date", { ascending: false });

    if (params?.type && params.type !== "all") {
      const dbType = params.type === "income" ? "credit" : "debit";
      query = query.eq("type", dbType);
    }
    if (params?.category && params.category !== "all") {
      query = query.eq("category", params.category);
    }
    if (params?.startDate) {
      query = query.gte("date", params.startDate);
    }
    if (params?.endDate) {
      query = query.lte("date", params.endDate);
    }
    if (params?.search) {
      query = query.ilike("description", `%${params.search}%`);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error || !data) {
      return { transactions: [], total: 0 };
    }

    const txs: Transaction[] = data.map((t: any) => ({
      id: t.id,
      businessId: t.business_id,
      date: t.date,
      description: t.description,
      type: t.type === "credit" ? "income" : "expense",
      category: t.category,
      amount: Number(t.amount_cents),
      currency: "USD",
      invoiceId: t.related_invoice_id || undefined,
      notes: t.reference || undefined,
      isSettled: t.status === "settled",
      createdAt: t.created_at,
    }));

    return { transactions: txs, total: count || txs.length };
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const sb = await this.getClient();
    const { data } = await sb.from("transactions").select("*").eq("id", id).maybeSingle();
    if (!data) return null;

    return {
      id: data.id,
      businessId: data.business_id,
      date: data.date,
      description: data.description,
      type: data.type === "credit" ? "income" : "expense",
      category: data.category,
      amount: Number(data.amount_cents),
      currency: "USD",
      invoiceId: data.related_invoice_id || undefined,
      notes: data.reference || undefined,
      isSettled: data.status === "settled",
      createdAt: data.created_at,
    };
  }

  async createTransaction(tx: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const dbPayload = {
      business_id: bizId,
      date: tx.date,
      amount_cents: tx.amount,
      type: tx.type === "income" ? "credit" : "debit",
      category: tx.category,
      description: tx.description,
      reference: tx.notes || null,
      status: tx.isSettled ? "settled" : "pending",
      related_invoice_id: tx.invoiceId || null,
    };

    const { data, error } = await sb.from("transactions").insert(dbPayload).select().single();
    if (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    await this.logEvent({
      businessId: bizId,
      actorType: "user",
      actorName: "Shop Owner",
      action: "CREATED_TRANSACTION",
      targetType: "Transaction",
      targetId: data.id,
      details: `Recorded ${tx.type} of $${(tx.amount / 100).toFixed(2)}: "${tx.description}".`,
    });

    return {
      id: data.id,
      businessId: data.business_id,
      date: data.date,
      description: data.description,
      type: data.type === "credit" ? "income" : "expense",
      category: data.category,
      amount: Number(data.amount_cents),
      currency: "USD",
      invoiceId: data.related_invoice_id || undefined,
      isSettled: data.status === "settled",
      createdAt: data.created_at,
    };
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const sb = await this.getClient();
    const payload: any = {};
    if (updates.date) payload.date = updates.date;
    if (updates.description) payload.description = updates.description;
    if (updates.amount !== undefined) payload.amount_cents = updates.amount;
    if (updates.category) payload.category = updates.category;
    if (updates.type) payload.type = updates.type === "income" ? "credit" : "debit";
    if (updates.isSettled !== undefined) payload.status = updates.isSettled ? "settled" : "pending";

    const { data, error } = await sb.from("transactions").update(payload).eq("id", id).select().single();
    if (error) throw new Error(error.message);

    return {
      id: data.id,
      businessId: data.business_id,
      date: data.date,
      description: data.description,
      type: data.type === "credit" ? "income" : "expense",
      category: data.category,
      amount: Number(data.amount_cents),
      currency: "USD",
      createdAt: data.created_at,
      isSettled: data.status === "settled",
    };
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const sb = await this.getClient();
    const { error } = await sb.from("transactions").delete().eq("id", id);
    return !error;
  }

  async importTransactionsCsv(
    txs: Omit<Transaction, "id" | "createdAt">[]
  ): Promise<{ importedCount: number; duplicateCount: number }> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const payloads = txs.map((tx) => ({
      business_id: bizId,
      date: tx.date,
      amount_cents: tx.amount,
      type: tx.type === "income" ? "credit" : "debit",
      category: tx.category,
      description: tx.description,
      status: "settled",
    }));

    const { data, error } = await sb.from("transactions").insert(payloads).select();
    if (error) throw new Error(error.message);

    await this.logEvent({
      businessId: bizId,
      actorType: "user",
      actorName: "Shop Owner",
      action: "IMPORTED_CSV_TRANSACTIONS",
      targetType: "TransactionBatch",
      targetId: `batch-${Date.now()}`,
      details: `Batch imported ${data?.length || 0} transactions from spreadsheet.`,
    });

    return { importedCount: data?.length || 0, duplicateCount: 0 };
  }

  // ==========================================
  // Invoices (Receivables & Payables)
  // ==========================================

  async getInvoices(params?: {
    direction?: "receivable" | "payable";
    status?: string;
    counterpartyId?: string;
  }): Promise<Invoice[]> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    let query = sb
      .from("invoices")
      .select("*, customer:customers(*), items:invoice_items(*)")
      .eq("business_id", bizId)
      .order("due_date", { ascending: true });

    if (params?.status && params.status !== "all") {
      query = query.eq("status", params.status);
    }
    if (params?.counterpartyId) {
      query = query.eq("customer_id", params.counterpartyId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((inv: any) => ({
      id: inv.id,
      businessId: inv.business_id,
      direction: "receivable" as const,
      invoiceNumber: inv.invoice_number,
      counterpartyId: inv.customer_id || "cust_unassigned",
      counterpartyName: inv.customer?.name || "Customer",
      issueDate: inv.issue_date,
      dueDate: inv.due_date,
      status: inv.status as any,
      currency: inv.currency || "USD",
      lineItems: (inv.items || []).map((it: any) => ({
        id: it.id,
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unit_price_cents),
        subtotal: Number(it.total_cents),
        taxAmount: 0,
        total: Number(it.total_cents),
      })),
      subtotal: Number(inv.subtotal_cents),
      taxTotal: Number(inv.tax_cents),
      totalAmount: Number(inv.total_cents),
      amountPaid: inv.status === "paid" ? Number(inv.total_cents) : 0,
      notes: inv.notes || undefined,
      createdAt: inv.created_at,
      updatedAt: inv.created_at,
    }));
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const sb = await this.getClient();
    const { data } = await sb
      .from("invoices")
      .select("*, customer:customers(*), items:invoice_items(*)")
      .eq("id", id)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      businessId: data.business_id,
      direction: "receivable",
      invoiceNumber: data.invoice_number,
      counterpartyId: data.customer_id || "cust_unassigned",
      counterpartyName: data.customer?.name || "Customer",
      issueDate: data.issue_date,
      dueDate: data.due_date,
      status: data.status,
      currency: data.currency || "USD",
      lineItems: (data.items || []).map((it: any) => ({
        id: it.id,
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unit_price_cents),
        subtotal: Number(it.total_cents),
        taxAmount: 0,
        total: Number(it.total_cents),
      })),
      subtotal: Number(data.subtotal_cents),
      taxTotal: Number(data.tax_cents),
      totalAmount: Number(data.total_cents),
      amountPaid: data.status === "paid" ? Number(data.total_cents) : 0,
      notes: data.notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.created_at,
    };
  }

  async createInvoice(inv: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Promise<Invoice> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const invoicePayload = {
      business_id: bizId,
      customer_id: inv.counterpartyId.startsWith("cust") && inv.counterpartyId.length > 20 ? inv.counterpartyId : null,
      invoice_number: inv.invoiceNumber,
      issue_date: inv.issueDate,
      due_date: inv.dueDate,
      subtotal_cents: inv.subtotal,
      tax_cents: inv.taxTotal,
      total_cents: inv.totalAmount,
      status: inv.status,
      currency: inv.currency || "USD",
      notes: inv.notes || null,
    };

    const { data, error } = await sb.from("invoices").insert(invoicePayload).select().single();
    if (error) throw new Error(error.message);

    // Insert line items if present
    if (inv.lineItems && inv.lineItems.length > 0) {
      const itemsPayload = inv.lineItems.map((li) => ({
        invoice_id: data.id,
        description: li.description,
        quantity: li.quantity,
        unit_price_cents: li.unitPrice,
        total_cents: li.total,
      }));
      await sb.from("invoice_items").insert(itemsPayload);
    }

    await this.logEvent({
      businessId: bizId,
      actorType: "user",
      actorName: "Shop Owner",
      action: "CREATED_INVOICE",
      targetType: "Invoice",
      targetId: data.id,
      details: `Generated Invoice #${inv.invoiceNumber} for $${(inv.totalAmount / 100).toFixed(2)} due on ${inv.dueDate}.`,
    });

    return (await this.getInvoiceById(data.id))!;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const sb = await this.getClient();
    const payload: any = {};
    if (updates.status) payload.status = updates.status;
    if (updates.dueDate) payload.due_date = updates.dueDate;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    await sb.from("invoices").update(payload).eq("id", id);
    return (await this.getInvoiceById(id))!;
  }

  async recordInvoicePayment(
    invoiceId: string,
    amount: number,
    date: string,
    notes?: string
  ): Promise<Invoice> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const inv = await this.getInvoiceById(invoiceId);
    if (!inv) throw new Error("Invoice not found");

    // Update invoice status to paid
    await sb
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", invoiceId);

    // Record settled cash transaction into transactions table
    await sb.from("transactions").insert({
      business_id: bizId,
      date,
      amount_cents: amount,
      type: "credit",
      category: "revenue_sales",
      description: `Payment received for Invoice #${inv.invoiceNumber}`,
      reference: notes || `Settled Invoice ${inv.invoiceNumber}`,
      status: "settled",
      related_invoice_id: invoiceId,
    });

    await this.logEvent({
      businessId: bizId,
      actorType: "user",
      actorName: "Shop Owner",
      action: "SETTLED_INVOICE_PAYMENT",
      targetType: "Invoice",
      targetId: invoiceId,
      details: `Received payment of $${(amount / 100).toFixed(2)} for Invoice #${inv.invoiceNumber}. Recorded into cash ledger.`,
    });

    return (await this.getInvoiceById(invoiceId))!;
  }

  // ==========================================
  // Counterparties (Customers & Suppliers)
  // ==========================================

  async getCustomers(): Promise<Customer[]> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const { data } = await sb
      .from("customers")
      .select("*")
      .eq("business_id", bizId)
      .order("name", { ascending: true });

    if (!data) return [];

    return data.map((c: any) => ({
      id: c.id,
      businessId: c.business_id,
      name: c.name,
      email: c.email || "",
      phone: c.phone || undefined,
      address: c.address || undefined,
      paymentTermsDays: c.payment_terms_days || 30,
      reliabilityScore: 95,
      avgDaysToPay: c.payment_terms_days || 30,
      createdAt: c.created_at,
    }));
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const sb = await this.getClient();
    const { data } = await sb.from("customers").select("*").eq("id", id).maybeSingle();
    if (!data) return null;

    return {
      id: data.id,
      businessId: data.business_id,
      name: data.name,
      email: data.email || "",
      phone: data.phone || undefined,
      address: data.address || undefined,
      paymentTermsDays: data.payment_terms_days || 30,
      reliabilityScore: 95,
      avgDaysToPay: data.payment_terms_days || 30,
      createdAt: data.created_at,
    };
  }

  async createCustomer(c: Omit<Customer, "id" | "createdAt">): Promise<Customer> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const { data, error } = await sb
      .from("customers")
      .insert({
        business_id: bizId,
        name: c.name,
        email: c.email,
        phone: c.phone || null,
        address: c.address || null,
        payment_terms_days: c.paymentTermsDays || 30,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      businessId: data.business_id,
      name: data.name,
      email: data.email || "",
      paymentTermsDays: data.payment_terms_days || 30,
      reliabilityScore: 95,
      avgDaysToPay: data.payment_terms_days || 30,
      createdAt: data.created_at,
    };
  }

  async getSuppliers(): Promise<Supplier[]> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const { data } = await sb
      .from("suppliers")
      .select("*")
      .eq("business_id", bizId)
      .order("name", { ascending: true });

    if (!data) return [];

    return data.map((s: any) => ({
      id: s.id,
      businessId: s.business_id,
      name: s.name,
      email: s.email || "",
      phone: s.phone || undefined,
      category: "operating_cogs",
      paymentTermsDays: s.payment_terms_days || 30,
      isCritical: false,
      createdAt: s.created_at,
    }));
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    const sb = await this.getClient();
    const { data } = await sb.from("suppliers").select("*").eq("id", id).maybeSingle();
    if (!data) return null;

    return {
      id: data.id,
      businessId: data.business_id,
      name: data.name,
      email: data.email || "",
      phone: data.phone || undefined,
      category: "operating_cogs",
      paymentTermsDays: data.payment_terms_days || 30,
      isCritical: false,
      createdAt: data.created_at,
    };
  }

  async createSupplier(s: Omit<Supplier, "id" | "createdAt">): Promise<Supplier> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const { data, error } = await sb
      .from("suppliers")
      .insert({
        business_id: bizId,
        name: s.name,
        email: s.email,
        phone: s.phone || null,
        payment_terms_days: s.paymentTermsDays || 30,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      businessId: data.business_id,
      name: data.name,
      email: data.email || "",
      category: "operating_cogs",
      paymentTermsDays: data.payment_terms_days || 30,
      isCritical: false,
      createdAt: data.created_at,
    };
  }

  // ==========================================
  // Budgets
  // ==========================================

  async getBudgets(periodMonth: string): Promise<Budget[]> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const { data } = await sb.from("budgets").select("*").eq("business_id", bizId);
    if (!data) return [];

    return data.map((b: any) => ({
      id: b.id,
      businessId: b.business_id,
      category: b.category,
      amountLimit: Number(b.monthly_limit_cents),
      currency: "USD",
      periodMonth: b.period_start?.substring(0, 7) || periodMonth,
      alertThresholdPercent: 80,
      createdAt: b.created_at,
    }));
  }

  async getBudgetUtilization(periodMonth: string): Promise<BudgetUtilization[]> {
    const budgets = await this.getBudgets(periodMonth);
    const { transactions } = await this.getTransactions();
    return calculateBudgetUtilization(budgets, transactions, periodMonth);
  }

  async createBudget(b: Omit<Budget, "id" | "createdAt">): Promise<Budget> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const { data, error } = await sb
      .from("budgets")
      .insert({
        business_id: bizId,
        category: b.category,
        monthly_limit_cents: b.amountLimit,
        period_start: `${b.periodMonth}-01`,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      businessId: data.business_id,
      category: data.category,
      amountLimit: Number(data.monthly_limit_cents),
      currency: "USD",
      periodMonth: b.periodMonth,
      alertThresholdPercent: 80,
      createdAt: data.created_at,
    };
  }

  // ==========================================
  // Scenarios & What-If Simulations
  // ==========================================

  async getScenarios(): Promise<Scenario[]> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const { data } = await sb
      .from("system_settings")
      .select("value")
      .eq("key", `scenarios_${bizId}`)
      .maybeSingle();

    if (!data || !data.value) return [];
    try {
      return JSON.parse(data.value);
    } catch {
      return [];
    }
  }

  async createScenario(s: Omit<Scenario, "id" | "createdAt">): Promise<Scenario> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();
    const existing = await this.getScenarios();

    const newScenario: Scenario = {
      ...s,
      id: `scen-${Date.now()}`,
      businessId: bizId,
      createdAt: new Date().toISOString(),
    };

    const updated = [newScenario, ...existing];

    await sb.from("system_settings").upsert(
      {
        key: `scenarios_${bizId}`,
        value: JSON.stringify(updated),
        description: "Saved What-If working capital scenarios",
      },
      { onConflict: "key" }
    );

    return newScenario;
  }

  async simulateScenario(
    assumptions: ScenarioAssumption[],
    days: number = 30
  ): Promise<ScenarioSimulationResult> {
    const cashPos = await this.getCashPosition();
    const invoices = await this.getInvoices();
    const { transactions } = await this.getTransactions();
    const today = new Date().toISOString().split("T")[0];

    return simulateScenario(
      cashPos.currentCash,
      invoices,
      assumptions,
      today,
      days
    );
  }

  // ==========================================
  // Audit Logs (Verifiable Database Trail)
  // ==========================================

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const { data } = await sb
      .from("audit_logs")
      .select("*")
      .eq("business_id", bizId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((a: any) => ({
      id: a.id,
      businessId: a.business_id,
      actorName: a.actor_name,
      actorType: a.actor_type as any,
      action: a.action,
      targetType: a.entity_type,
      targetId: a.entity_id || "general",
      details: a.details,
      timestamp: a.created_at,
    }));
  }

  async logEvent(log: Omit<AuditLog, "id" | "timestamp">): Promise<AuditLog> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();
    const { data: { user } } = await sb.auth.getUser();

    const payload = {
      business_id: log.businessId || bizId,
      user_id: user?.id || null,
      actor_name: log.actorName,
      actor_type: log.actorType,
      action: log.action,
      entity_type: log.targetType,
      entity_id: log.targetId || null,
      details: log.details,
    };

    const { data, error } = await sb.from("audit_logs").insert(payload).select().single();
    if (error) {
      console.warn("Failed to write audit log:", error);
      return {
        id: `aud-${Date.now()}`,
        ...log,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      id: data.id,
      businessId: data.business_id,
      actorName: data.actor_name,
      actorType: data.actor_type,
      action: data.action,
      targetType: data.entity_type,
      targetId: data.entity_id || "general",
      details: data.details,
      timestamp: data.created_at,
    };
  }

  // ==========================================
  // Products & Inventory / POS
  // ==========================================

  async getProducts(): Promise<Product[]> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    try {
      // 1. Try querying dedicated products table
      const { data, error } = await sb
        .from("products")
        .select("*")
        .eq("business_id", bizId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return (data as any[]).map((p: any) => ({
          id: p.id,
          businessId: p.business_id,
          name: p.name,
          sku: p.sku || `SKU-${p.id.slice(0, 6)}`,
          category: p.category || "General",
          unitPrice: Number(p.unit_price_cents) || 0,
          costPrice: Number(p.cost_price_cents) || 0,
          stockQuantity: Number(p.stock_quantity) || 0,
          minStockAlert: Number(p.min_stock_alert) || 5,
          barcode: p.barcode || undefined,
          unit: p.unit || "pcs",
          notes: p.notes || undefined,
          createdAt: p.created_at,
          updatedAt: p.updated_at || p.created_at,
        }));
      }
    } catch {
      // Table might not exist yet, fallback below
    }

    // 2. Resilient fallback: Query system_settings for inventory_products_${bizId}
    try {
      const { data: setting } = await sb
        .from("system_settings")
        .select("value")
        .eq("key", `inventory_products_${bizId}`)
        .maybeSingle();

      if (setting && setting.value) {
        return JSON.parse(setting.value);
      }
    } catch {
      // Fallback empty
    }

    return [];
  }

  async getProductById(id: string): Promise<Product | null> {
    const prods = await this.getProducts();
    return prods.find((p) => p.id === id) || null;
  }

  async createProduct(productData: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();
    const nowIso = new Date().toISOString();

    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      businessId: bizId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Try inserting into products table
    let savedToTable = false;
    try {
      const { error } = await sb.from("products").insert({
        id: newProduct.id.startsWith("prod-") ? undefined : newProduct.id,
        business_id: bizId,
        name: newProduct.name,
        sku: newProduct.sku,
        category: newProduct.category,
        unit_price_cents: newProduct.unitPrice,
        cost_price_cents: newProduct.costPrice,
        stock_quantity: newProduct.stockQuantity,
        min_stock_alert: newProduct.minStockAlert,
        barcode: newProduct.barcode || null,
        unit: newProduct.unit,
        notes: newProduct.notes || null,
      });
      if (!error) savedToTable = true;
    } catch {
      savedToTable = false;
    }

    // Also persist to system_settings for 100% resilience
    try {
      const current = await this.getProducts();
      const updated = [newProduct, ...current.filter((p) => p.id !== newProduct.id)];
      await sb.from("system_settings").upsert({
        key: `inventory_products_${bizId}`,
        value: JSON.stringify(updated),
        description: "POS & Stock Inventory Catalog",
        updated_at: nowIso,
      });
    } catch (e) {
      console.warn("Failed to persist product backup to system_settings:", e);
    }

    await this.logEvent({
      businessId: bizId,
      actorType: "user",
      actorName: "Business Staff",
      action: "CREATED_PRODUCT",
      targetType: "Product",
      targetId: newProduct.id,
      details: `Added new product ${newProduct.name} (SKU: ${newProduct.sku}) with stock ${newProduct.stockQuantity}`,
    });

    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();
    const nowIso = new Date().toISOString();

    // 1. Try updating table
    try {
      const dbUpdates: any = { updated_at: nowIso };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.unitPrice !== undefined) dbUpdates.unit_price_cents = updates.unitPrice;
      if (updates.costPrice !== undefined) dbUpdates.cost_price_cents = updates.costPrice;
      if (updates.stockQuantity !== undefined) dbUpdates.stock_quantity = updates.stockQuantity;
      if (updates.minStockAlert !== undefined) dbUpdates.min_stock_alert = updates.minStockAlert;
      if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      await sb.from("products").update(dbUpdates).eq("id", id).eq("business_id", bizId);
    } catch {
      // Ignore
    }

    // 2. Update in system_settings
    const current = await this.getProducts();
    const existing = current.find((p) => p.id === id);
    if (!existing) throw new Error("Product not found");

    const updatedProduct: Product = {
      ...existing,
      ...updates,
      updatedAt: nowIso,
    };

    const newCatalog = current.map((p) => (p.id === id ? updatedProduct : p));
    try {
      await sb.from("system_settings").upsert({
        key: `inventory_products_${bizId}`,
        value: JSON.stringify(newCatalog),
        description: "POS & Stock Inventory Catalog",
        updated_at: nowIso,
      });
    } catch (e) {
      console.warn("Error updating inventory catalog in system_settings:", e);
    }

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    try {
      await sb.from("products").delete().eq("id", id).eq("business_id", bizId);
    } catch {
      // Ignore
    }

    const current = await this.getProducts();
    const newCatalog = current.filter((p) => p.id !== id);
    try {
      await sb.from("system_settings").upsert({
        key: `inventory_products_${bizId}`,
        value: JSON.stringify(newCatalog),
        description: "POS & Stock Inventory Catalog",
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Ignore
    }

    return true;
  }

  // ==========================================
  // Point of Sale & Selling Hisab Settlement
  // ==========================================

  async recordPosSale(sale: PosSaleRequest): Promise<PosSaleResult> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();
    const biz = await this.getBusiness();

    // 1. Calculations
    const subtotal = sale.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const taxRate = sale.taxRatePercent !== undefined ? sale.taxRatePercent : biz.taxRatePercent;
    const taxAmount = Math.round(subtotal * (taxRate / 100));
    const discountAmount = sale.discountAmount || 0;
    const totalPaid = Math.max(0, subtotal + taxAmount - discountAmount);

    const receiptNumber = `POS-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);

    // 2. Decrement inventory stock
    for (const item of sale.items) {
      try {
        const prod = await this.getProductById(item.productId);
        if (prod) {
          const newQty = Math.max(0, prod.stockQuantity - item.quantity);
          await this.updateProduct(prod.id, { stockQuantity: newQty });
        }
      } catch (e) {
        console.warn(`Failed to deduct stock for product ${item.productId}:`, e);
      }
    }

    // 3. Create Settled Invoice in Supabase
    const { data: invRow, error: invError } = await sb
      .from("invoices")
      .insert({
        business_id: bizId,
        invoice_number: receiptNumber,
        issue_date: today,
        due_date: today,
        subtotal_cents: subtotal,
        tax_cents: taxAmount,
        total_cents: totalPaid,
        status: "paid",
        currency: biz.currency,
        notes: `POS Direct Sale [${sale.paymentMethod.toUpperCase()}] - Customer: ${sale.customerName || "Walk-in Customer"}${sale.notes ? ` - ${sale.notes}` : ""}`,
        paid_at: nowIso,
      })
      .select()
      .maybeSingle();

    const invoiceId = invRow?.id || `inv-pos-${Date.now()}`;

    // 4. Insert Invoice Line Items
    if (invRow) {
      const itemsPayload = sale.items.map((i) => ({
        invoice_id: invoiceId,
        description: i.name,
        quantity: i.quantity,
        unit_price_cents: i.unitPrice,
        total_cents: i.subtotal,
      }));
      await sb.from("invoice_items").insert(itemsPayload);
    }

    // 5. Create Settled Credit Cash Transaction in Supabase
    const { data: txRow } = await sb
      .from("transactions")
      .insert({
        business_id: bizId,
        date: today,
        amount_cents: totalPaid,
        type: "credit",
        category: "revenue_sales",
        description: `POS Sale #${receiptNumber} - ${sale.items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}`,
        status: "settled",
        related_invoice_id: invRow ? invoiceId : null,
        reference: receiptNumber,
      })
      .select()
      .maybeSingle();

    // 6. Log in Audit Trail
    await this.logEvent({
      businessId: bizId,
      actorType: "user",
      actorName: "POS Cashier",
      action: "POS_SALE_SETTLED",
      targetType: "Transaction",
      targetId: txRow?.id || receiptNumber,
      details: `Settled POS sale ${receiptNumber} for ${biz.currency} ${(totalPaid / 100).toFixed(2)} via ${sale.paymentMethod}`,
    });

    const invoice: Invoice = {
      id: invoiceId,
      businessId: bizId,
      direction: "receivable",
      invoiceNumber: receiptNumber,
      counterpartyId: "walk-in-customer",
      counterpartyName: sale.customerName || "Walk-in Retail Customer",
      issueDate: today,
      dueDate: today,
      status: "paid",
      currency: biz.currency,
      subtotal,
      taxTotal: taxAmount,
      totalAmount: totalPaid,
      amountPaid: totalPaid,
      notes: `POS Direct Sale [${sale.paymentMethod.toUpperCase()}]`,
      lineItems: sale.items.map((i, idx) => ({
        id: `pos-item-${idx + 1}`,
        description: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRatePercent: taxRate,
        subtotal: i.subtotal,
        taxAmount: Math.round(i.subtotal * (taxRate / 100)),
        total: Math.round(i.subtotal * (1 + taxRate / 100)),
      })),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const transaction: Transaction = {
      id: txRow?.id || `tx-pos-${Date.now()}`,
      businessId: bizId,
      date: today,
      description: `POS Direct Sale #${receiptNumber}`,
      type: "income",
      category: "revenue_sales",
      amount: totalPaid,
      currency: biz.currency,
      counterpartyName: sale.customerName || "Walk-in Retail Customer",
      invoiceId: invoice.id,
      notes: `Payment received via ${sale.paymentMethod.toUpperCase()}`,
      isSettled: true,
      createdAt: nowIso,
    };

    return {
      invoice,
      transaction,
      receiptNumber,
      receiptDate: nowIso,
      subtotal,
      taxAmount,
      discountAmount,
      totalPaid,
      paymentMethod: sale.paymentMethod,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      items: sale.items,
    };
  }

  // ==========================================
  // SME Financing Matching (Topic E)
  // ==========================================

  async getFinancingMatches(): Promise<FinancingEligibility> {
    const cashPos = await this.getCashPosition();
    const recSum = await this.getReceivablesSummary();
    const prods = await this.getProducts();
    const inventoryValuation = prods.reduce((sum, p) => sum + (p.costPrice || p.unitPrice) * p.stockQuantity, 0);

    const { transactions } = await this.getTransactions({ limit: 100 });
    const monthlyRev = transactions
      .filter((t) => t.type === "income" && t.isSettled)
      .reduce((sum, t) => sum + t.amount, 0);

    const healthScore = Math.min(96, Math.max(52, Math.round(
      (cashPos.currentCash > 0 ? 30 : 15) +
      (recSum.totalReceivables > 0 ? 25 : 15) +
      (monthlyRev > 100000 ? 30 : 15) +
      (inventoryValuation > 50000 ? 15 : 10)
    )));

    const baseRev = monthlyRev || 4200000;
    const baseRec = recSum.totalReceivables || 1500000;
    const baseInv = inventoryValuation || 2800000;

    return {
      overallHealthScore: healthScore,
      monthlyRevenueCents: baseRev,
      availableReceivablesCents: baseRec,
      inventoryValuationCents: baseInv,
      recommendedFundingCents: Math.round(baseRev * 0.75),
      options: [
        {
          id: "fin-factoring-1",
          name: "Invoice Factoring & Receivables Advance",
          type: "invoice_factoring",
          providerName: "WeBank FinTech Partner Network",
          maxAmountCents: Math.round(baseRec * 0.85),
          interestRateAnnualPercent: 7.2,
          feePercent: 1.2,
          termMonths: 3,
          repaymentSchedule: "on_invoice_settlement",
          matchScore: 95,
          qualificationStatus: "pre_qualified",
          keyBenefits: [
            "Instant 85% cash advance on issued invoices within 24 hours",
            "Zero monthly debt service—settles directly when your customer pays",
            "No personal collateral or fixed asset pledge required",
          ],
          disbursementTimeframe: "24 Hours",
        },
        {
          id: "fin-rev-line-2",
          name: "Merchant Working Capital & Revenue Line",
          type: "working_capital",
          providerName: "PBCSF SME Growth Fund",
          maxAmountCents: Math.round(baseRev * 1.5),
          interestRateAnnualPercent: 8.5,
          termMonths: 12,
          repaymentSchedule: "weekly",
          matchScore: 90,
          qualificationStatus: "eligible",
          keyBenefits: [
            "Flexible revolving credit based on POS sales volume & hisab",
            "Draw down funds only when needed for supplier payments",
            "Automatic repayment deduction from daily sales",
          ],
          disbursementTimeframe: "48 Hours",
        },
        {
          id: "fin-inv-credit-3",
          name: "Smart Inventory & Stock Replenishment Credit",
          type: "inventory_credit",
          providerName: "Global Trade Credit Consortium",
          maxAmountCents: Math.round(baseInv * 0.9),
          interestRateAnnualPercent: 6.9,
          termMonths: 6,
          repaymentSchedule: "monthly",
          matchScore: 88,
          qualificationStatus: "eligible",
          keyBenefits: [
            "Direct payment to verified suppliers for bulk wholesale purchase",
            "Lower APR secured by verified real inventory stock valuation",
            "Grace period up to 45 days before first interest payment",
          ],
          disbursementTimeframe: "2 - 3 Days",
        },
        {
          id: "fin-micro-loan-4",
          name: "Fast-Track Digital Micro-SME Loan",
          type: "sme_micro_loan",
          providerName: "WeBank Digital Commercial Bank",
          maxAmountCents: 5000000,
          interestRateAnnualPercent: 9.0,
          termMonths: 24,
          repaymentSchedule: "monthly",
          matchScore: 82,
          qualificationStatus: "conditionally_eligible",
          keyBenefits: [
            "Fixed monthly installment for shop expansion, renovation & equipment",
            "100% digital paperless verification via automated accounting hisab",
            "Early repayment allowed with zero penalty",
          ],
          disbursementTimeframe: "Same Day",
        },
      ],
    };
  }

  async resetDemoData(): Promise<void> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();
    await sb.from("transactions").delete().eq("business_id", bizId);
    await sb.from("invoices").delete().eq("business_id", bizId);
    await sb.from("action_tasks").delete().eq("business_id", bizId);
  }
}

