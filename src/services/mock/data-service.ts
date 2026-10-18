import { DataService } from "../contracts";
import { mockStore, simulateDelay } from "./store";
import { DEMO_REFERENCE_DATE } from "./seed";
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
  AuditLog,
  Product,
  PosSaleRequest,
  PosSaleResult,
  FinancingEligibility,
} from "@/domain/types";

export class MockDataService implements DataService {
  async getBusiness(): Promise<Business> {
    await simulateDelay();
    return mockStore.getState().business;
  }

  async updateBusiness(updates: Partial<Business>): Promise<Business> {
    await simulateDelay();
    mockStore.updateBusiness(updates);
    return mockStore.getState().business;
  }

  async getMembers(): Promise<Member[]> {
    await simulateDelay();
    return mockStore.getState().members;
  }

  async inviteMember(memberData: Omit<Member, "id" | "createdAt">): Promise<Member> {
    await simulateDelay();
    const newMember: Member = {
      ...memberData,
      id: `mem-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockStore.addMember(newMember);
    await this.logEvent({
      businessId: newMember.businessId,
      actorType: "user",
      actorName: "Active User",
      action: "INVITED_TEAM_MEMBER",
      targetType: "Member",
      targetId: newMember.id,
      details: `Invited ${newMember.name} (${newMember.email}) as ${newMember.role}.`,
    });
    return newMember;
  }

  async updateMemberRole(memberId: string, role: Role): Promise<Member> {
    await simulateDelay();
    const state = mockStore.getState();
    const member = state.members.find((m) => m.id === memberId);
    if (!member) throw new Error("Member not found");
    member.role = role;
    mockStore.setCurrentMemberRole(role);
    return member;
  }

  async getCashPosition(): Promise<CashPosition> {
    await simulateDelay();
    const state = mockStore.getState();
    return calculateCashPosition(state.business.openingCashBalance, state.transactions);
  }

  async getReceivablesSummary(): Promise<ReceivablesSummary> {
    await simulateDelay();
    const state = mockStore.getState();
    return calculateReceivablesSummary(state.invoices, DEMO_REFERENCE_DATE);
  }

  async getPayablesSummary(): Promise<PayablesSummary> {
    await simulateDelay();
    const state = mockStore.getState();
    return calculatePayablesSummary(state.invoices, DEMO_REFERENCE_DATE);
  }

  async getReceivablesAging(): Promise<AgingBucket[]> {
    await simulateDelay();
    const state = mockStore.getState();
    return calculateAgingBuckets(state.invoices, "receivable", DEMO_REFERENCE_DATE);
  }

  async getPayablesAging(): Promise<AgingBucket[]> {
    await simulateDelay();
    const state = mockStore.getState();
    return calculateAgingBuckets(state.invoices, "payable", DEMO_REFERENCE_DATE);
  }

  async getForecast(days: 7 | 30): Promise<CashFlowForecast> {
    await simulateDelay();
    const state = mockStore.getState();
    const cashPos = calculateCashPosition(state.business.openingCashBalance, state.transactions);
    return calculateCashFlowForecast(cashPos.currentCash, state.invoices, DEMO_REFERENCE_DATE, days);
  }

  async getAnomalies(): Promise<AnomalyFlag[]> {
    await simulateDelay();
    const state = mockStore.getState();
    const forecast = await this.getForecast(7);
    return detectFinancialAnomalies(state.transactions, forecast);
  }

  async getTransactions(params?: {
    search?: string;
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: Transaction[]; total: number }> {
    await simulateDelay();
    let txs = [...mockStore.getState().transactions];

    if (params?.search) {
      const q = params.search.toLowerCase();
      txs = txs.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.counterpartyName?.toLowerCase().includes(q)
      );
    }

    if (params?.type && params.type !== "all") {
      txs = txs.filter((t) => t.type === params.type);
    }

    if (params?.category && params.category !== "all") {
      txs = txs.filter((t) => t.category === params.category);
    }

    if (params?.startDate) {
      txs = txs.filter((t) => t.date >= params.startDate!);
    }
    if (params?.endDate) {
      txs = txs.filter((t) => t.date <= params.endDate!);
    }

    const total = txs.length;
    const page = params?.page || 1;
    const limit = params?.limit || 25;
    const startIndex = (page - 1) * limit;
    const paginated = txs.slice(startIndex, startIndex + limit);

    return { transactions: paginated, total };
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    await simulateDelay();
    return mockStore.getState().transactions.find((t) => t.id === id) || null;
  }

  async createTransaction(txData: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
    await simulateDelay();
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockStore.addTransaction(newTx);
    await this.logEvent({
      businessId: newTx.businessId,
      actorType: "user",
      actorName: "Active User",
      action: "CREATED_TRANSACTION",
      targetType: "Transaction",
      targetId: newTx.id,
      details: `Created transaction: ${newTx.description} (${newTx.amount}).`,
    });
    return newTx;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    await simulateDelay();
    mockStore.updateTransaction(id, updates);
    const updated = await this.getTransactionById(id);
    if (!updated) throw new Error("Transaction not found");
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    await simulateDelay();
    mockStore.deleteTransaction(id);
    return true;
  }

  async importTransactionsCsv(
    txs: Omit<Transaction, "id" | "createdAt">[]
  ): Promise<{ importedCount: number; duplicateCount: number }> {
    await simulateDelay();
    const existing = mockStore.getState().transactions;
    let importedCount = 0;
    let duplicateCount = 0;

    for (const txData of txs) {
      // Duplicate detection based on date, description, and amount
      const isDuplicate = existing.some(
        (e) =>
          e.date === txData.date &&
          e.description.toLowerCase() === txData.description.toLowerCase() &&
          e.amount === txData.amount
      );

      if (isDuplicate) {
        duplicateCount++;
      } else {
        const newTx: Transaction = {
          ...txData,
          id: `tx-import-${Date.now()}-${importedCount}`,
          createdAt: new Date().toISOString(),
        };
        mockStore.addTransaction(newTx);
        importedCount++;
      }
    }

    await this.logEvent({
      businessId: mockStore.getState().business.id,
      actorType: "user",
      actorName: "Active User",
      action: "CSV_IMPORT_TRANSACTIONS",
      targetType: "Transaction",
      targetId: "batch",
      details: `Imported ${importedCount} transactions via CSV (${duplicateCount} duplicates ignored).`,
    });

    return { importedCount, duplicateCount };
  }

  async getInvoices(params?: {
    direction?: "receivable" | "payable";
    status?: string;
    counterpartyId?: string;
  }): Promise<Invoice[]> {
    await simulateDelay();
    let invoices = [...mockStore.getState().invoices];

    if (params?.direction) {
      invoices = invoices.filter((i) => i.direction === params.direction);
    }
    if (params?.status && params.status !== "all") {
      invoices = invoices.filter((i) => i.status === params.status);
    }
    if (params?.counterpartyId) {
      invoices = invoices.filter((i) => i.counterpartyId === params.counterpartyId);
    }

    return invoices;
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    await simulateDelay();
    return mockStore.getState().invoices.find((i) => i.id === id) || null;
  }

  async createInvoice(invData: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Promise<Invoice> {
    await simulateDelay();
    const newInv: Invoice = {
      ...invData,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStore.addInvoice(newInv);
    await this.logEvent({
      businessId: newInv.businessId,
      actorType: "user",
      actorName: "Active User",
      action: "CREATED_INVOICE",
      targetType: "Invoice",
      targetId: newInv.id,
      details: `Created invoice ${newInv.invoiceNumber} for ${newInv.counterpartyName} (${newInv.totalAmount}).`,
    });
    return newInv;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    await simulateDelay();
    mockStore.updateInvoice(id, updates);
    const updated = await this.getInvoiceById(id);
    if (!updated) throw new Error("Invoice not found");
    return updated;
  }

  async recordInvoicePayment(
    invoiceId: string,
    amount: number,
    date: string,
    notes?: string
  ): Promise<Invoice> {
    await simulateDelay();
    const inv = await this.getInvoiceById(invoiceId);
    if (!inv) throw new Error("Invoice not found");

    const newAmountPaid = (inv.amountPaid || 0) + amount;
    const isFullyPaid = newAmountPaid >= inv.totalAmount;
    const newStatus = isFullyPaid ? "paid" : "partially_paid";

    // Create corresponding confirmed transaction so cash balance reconciles
    const newTx: Transaction = {
      id: `tx-pay-${Date.now()}`,
      businessId: inv.businessId,
      date,
      description: `Payment for ${inv.invoiceNumber} (${inv.counterpartyName})`,
      type: inv.direction === "receivable" ? "income" : "expense",
      category: inv.direction === "receivable" ? "revenue_sales" : "operating_cogs",
      amount,
      currency: inv.currency,
      counterpartyId: inv.counterpartyId,
      counterpartyName: inv.counterpartyName,
      invoiceId: inv.id,
      isSettled: true,
      notes: notes || "Recorded via invoice payment settlement",
      createdAt: new Date().toISOString(),
    };
    mockStore.addTransaction(newTx);

    mockStore.updateInvoice(invoiceId, {
      amountPaid: newAmountPaid,
      status: newStatus,
    });

    await this.logEvent({
      businessId: inv.businessId,
      actorType: "user",
      actorName: "Active User",
      action: "RECORDED_INVOICE_PAYMENT",
      targetType: "Invoice",
      targetId: inv.id,
      details: `Recorded payment of ${amount} for ${inv.invoiceNumber}. New status: ${newStatus}.`,
    });

    return (await this.getInvoiceById(invoiceId))!;
  }

  async getCustomers(): Promise<Customer[]> {
    await simulateDelay();
    return mockStore.getState().customers;
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    await simulateDelay();
    return mockStore.getState().customers.find((c) => c.id === id) || null;
  }

  async createCustomer(cData: Omit<Customer, "id" | "createdAt">): Promise<Customer> {
    await simulateDelay();
    const newCustomer: Customer = {
      ...cData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockStore.addCustomer(newCustomer);
    return newCustomer;
  }

  async getSuppliers(): Promise<Supplier[]> {
    await simulateDelay();
    return mockStore.getState().suppliers;
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    await simulateDelay();
    return mockStore.getState().suppliers.find((s) => s.id === id) || null;
  }

  async createSupplier(sData: Omit<Supplier, "id" | "createdAt">): Promise<Supplier> {
    await simulateDelay();
    const newSupplier: Supplier = {
      ...sData,
      id: `supp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockStore.addSupplier(newSupplier);
    return newSupplier;
  }

  async getBudgets(periodMonth: string): Promise<Budget[]> {
    await simulateDelay();
    return mockStore.getState().budgets.filter((b) => b.periodMonth === periodMonth);
  }

  async getBudgetUtilization(periodMonth: string): Promise<BudgetUtilization[]> {
    await simulateDelay();
    const state = mockStore.getState();
    return calculateBudgetUtilization(state.budgets, state.transactions, periodMonth);
  }

  async createBudget(bData: Omit<Budget, "id" | "createdAt">): Promise<Budget> {
    await simulateDelay();
    const newBudget: Budget = {
      ...bData,
      id: `bg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockStore.addBudget(newBudget);
    return newBudget;
  }

  async getScenarios(): Promise<Scenario[]> {
    await simulateDelay();
    return mockStore.getState().scenarios;
  }

  async createScenario(sData: Omit<Scenario, "id" | "createdAt">): Promise<Scenario> {
    await simulateDelay();
    const newScenario: Scenario = {
      ...sData,
      id: `scen-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockStore.addScenario(newScenario);
    return newScenario;
  }

  async simulateScenario(assumptions: any[], days: number = 30): Promise<ScenarioSimulationResult> {
    await simulateDelay();
    const state = mockStore.getState();
    const cashPos = calculateCashPosition(state.business.openingCashBalance, state.transactions);
    return simulateScenario(cashPos.currentCash, state.invoices, assumptions, DEMO_REFERENCE_DATE, days);
  }

  // Products & Inventory
  async getProducts(): Promise<Product[]> {
    await simulateDelay();
    return mockStore.getState().products || [];
  }

  async getProductById(id: string): Promise<Product | null> {
    await simulateDelay();
    const product = (mockStore.getState().products || []).find((p) => p.id === id);
    return product || null;
  }

  async createProduct(productData: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    await simulateDelay();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStore.addProduct(newProduct);
    await this.logEvent({
      businessId: newProduct.businessId,
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
    await simulateDelay();
    mockStore.updateProduct(id, updates);
    const updated = (mockStore.getState().products || []).find((p) => p.id === id);
    if (!updated) throw new Error("Product not found");
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    await simulateDelay();
    mockStore.deleteProduct(id);
    return true;
  }

  async recordPosSale(sale: PosSaleRequest): Promise<PosSaleResult> {
    await simulateDelay();
    const state = mockStore.getState();
    const biz = state.business;

    // 1. Calculate totals
    const subtotal = sale.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const taxRate = sale.taxRatePercent !== undefined ? sale.taxRatePercent : biz.taxRatePercent;
    const taxAmount = Math.round(subtotal * (taxRate / 100));
    const discount = sale.discountAmount || 0;
    const totalPaid = Math.max(0, subtotal + taxAmount - discount);

    // 2. Generate Receipt ID & Timestamp
    const receiptNumber = `POS-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);

    // 3. Deduct Inventory Stock
    for (const item of sale.items) {
      const prod = (state.products || []).find((p) => p.id === item.productId);
      if (prod) {
        const newQty = Math.max(0, prod.stockQuantity - item.quantity);
        mockStore.updateProduct(prod.id, { stockQuantity: newQty });
      }
    }

    // 4. Create Settled Invoice
    const invoiceId = `inv-pos-${Date.now()}`;
    const invoice: Invoice = {
      id: invoiceId,
      businessId: biz.id,
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
      notes: `POS Direct Sale [${sale.paymentMethod.toUpperCase()}] - ${sale.notes || "Over the counter sale"}`,
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
    mockStore.addInvoice(invoice);

    // 5. Create Settled Transaction
    const txId = `tx-pos-${Date.now()}`;
    const transaction: Transaction = {
      id: txId,
      businessId: biz.id,
      date: today,
      description: `POS Sale #${receiptNumber} - ${sale.items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}`,
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
    mockStore.addTransaction(transaction);

    // 6. Log Audit Trail
    await this.logEvent({
      businessId: biz.id,
      actorType: "user",
      actorName: "POS Cashier",
      action: "POS_SALE_SETTLED",
      targetType: "Transaction",
      targetId: txId,
      details: `Settled POS sale ${receiptNumber} for ${biz.currency} ${(totalPaid / 100).toFixed(2)} via ${sale.paymentMethod}`,
    });

    return {
      invoice,
      transaction,
      receiptNumber,
      receiptDate: nowIso,
      subtotal,
      taxAmount,
      discountAmount: discount,
      totalPaid,
      paymentMethod: sale.paymentMethod,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      items: sale.items,
    };
  }

  async getFinancingMatches(): Promise<FinancingEligibility> {
    await simulateDelay();
    const state = mockStore.getState();
    const cashPos = calculateCashPosition(state.business.openingCashBalance, state.transactions);
    const recSum = calculateReceivablesSummary(state.invoices, DEMO_REFERENCE_DATE);
    const prods = state.products || [];
    const inventoryValuation = prods.reduce((sum, p) => sum + (p.costPrice || p.unitPrice) * p.stockQuantity, 0);

    // Calculate last 30 days revenue
    const monthlyRev = state.transactions
      .filter((t) => t.type === "income" && t.isSettled)
      .reduce((sum, t) => sum + t.amount, 0);

    const healthScore = Math.min(95, Math.max(50, Math.round(
      (cashPos.currentCash > 0 ? 30 : 10) +
      (recSum.totalReceivables > 0 ? 25 : 15) +
      (monthlyRev > 100000 ? 30 : 15) +
      (inventoryValuation > 50000 ? 15 : 10)
    )));

    return {
      overallHealthScore: healthScore,
      monthlyRevenueCents: monthlyRev || 3500000,
      availableReceivablesCents: recSum.totalReceivables || 1200000,
      inventoryValuationCents: inventoryValuation || 2500000,
      recommendedFundingCents: Math.round((monthlyRev || 3500000) * 0.75),
      options: [
        {
          id: "fin-factoring-1",
          name: "Invoice Factoring & Receivables Advance",
          type: "invoice_factoring",
          providerName: "WeBank FinTech Partner Network",
          maxAmountCents: Math.round(recSum.totalReceivables * 0.85) || 1000000,
          interestRateAnnualPercent: 7.2,
          feePercent: 1.2,
          termMonths: 3,
          repaymentSchedule: "on_invoice_settlement",
          matchScore: 94,
          qualificationStatus: "pre_qualified",
          keyBenefits: [
            "Instant 85% cash advance on issued invoices",
            "Zero monthly debt service—settles directly when customer pays",
            "No personal collateral or fixed asset pledge required",
          ],
          disbursementTimeframe: "24 Hours",
        },
        {
          id: "fin-rev-line-2",
          name: "Merchant Working Capital & Revenue Line",
          type: "working_capital",
          providerName: "PBCSF SME Growth Fund",
          maxAmountCents: Math.round((monthlyRev || 2000000) * 1.5),
          interestRateAnnualPercent: 8.5,
          termMonths: 12,
          repaymentSchedule: "weekly",
          matchScore: 89,
          qualificationStatus: "eligible",
          keyBenefits: [
            "Flexible revolving credit based on POS sales volume",
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
          maxAmountCents: Math.round((inventoryValuation || 1500000) * 0.9),
          interestRateAnnualPercent: 6.9,
          termMonths: 6,
          repaymentSchedule: "monthly",
          matchScore: 86,
          qualificationStatus: "eligible",
          keyBenefits: [
            "Direct payment to verified suppliers for bulk wholesale purchase",
            "Lower APR secured by inventory stock valuation",
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
          matchScore: 78,
          qualificationStatus: "conditionally_eligible",
          keyBenefits: [
            "Fixed monthly installment for business expansion & equipment",
            "100% digital paperless verification via accounting hisab",
            "Early repayment with zero prepayment penalty",
          ],
          disbursementTimeframe: "Same Day",
        },
      ],
    };
  }

  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    await simulateDelay();
    return mockStore.getState().auditLogs.slice(0, limit);
  }

  async logEvent(logData: Omit<AuditLog, "id" | "timestamp">): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...logData,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    mockStore.addAuditLog(newLog);
    return newLog;
  }

  async resetDemoData(): Promise<void> {
    await simulateDelay(150);
    mockStore.reset();
  }
}

export const mockDataService = new MockDataService();
