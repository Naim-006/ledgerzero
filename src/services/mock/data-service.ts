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
