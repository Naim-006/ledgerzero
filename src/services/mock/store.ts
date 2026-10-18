import {
  Business,
  Customer,
  Supplier,
  Invoice,
  Transaction,
  Budget,
  Scenario,
  ActionTask,
  Approval,
  Reminder,
  AgentRun,
  AuditLog,
  Member,
  Role,
  Product,
} from "@/domain/types";
import {
  INITIAL_BUSINESS,
  INITIAL_MEMBERS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_TRANSACTIONS,
  INITIAL_INVOICES,
  INITIAL_BUDGETS,
  INITIAL_ACTIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PRODUCTS,
} from "./seed";

const STORAGE_KEY = "ledger_zero_production_store_v3";

export interface MockStoreState {
  business: Business;
  members: Member[];
  currentMemberId: string;
  customers: Customer[];
  suppliers: Supplier[];
  transactions: Transaction[];
  invoices: Invoice[];
  budgets: Budget[];
  scenarios: Scenario[];
  actionTasks: ActionTask[];
  approvals: Approval[];
  reminders: Reminder[];
  agentRuns: AgentRun[];
  auditLogs: AuditLog[];
  products: Product[];
}

function getInitialState(): MockStoreState {
  return {
    business: {
      id: "biz_default",
      name: "My Business",
      legalName: "My Business Co., Ltd.",
      countryCode: "CN",
      currency: "CNY",
      timeZone: "Asia/Shanghai",
      fiscalYearStartMonth: 1,
      taxIdentifier: "91310000XXXXXXXXXX",
      taxRatePercent: 13,
      taxLabel: "增值税 (VAT)",
      openingCashBalance: 0,
      createdAt: new Date().toISOString(),
    },
    members: [
      {
        id: "mem-owner",
        businessId: "biz_default",
        name: "Business Owner",
        email: "owner@company.com",
        role: "Owner",
        createdAt: new Date().toISOString(),
      },
    ],
    currentMemberId: "mem-owner",
    customers: [],
    suppliers: [],
    transactions: [],
    invoices: [],
    budgets: [],
    scenarios: [],
    actionTasks: [],
    approvals: [],
    reminders: [],
    agentRuns: [],
    auditLogs: [],
    products: [],
  };
}

class MockStore {
  private state: MockStoreState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): MockStoreState {
    if (typeof window === "undefined") {
      return getInitialState();
    }
    try {
      // Purge any legacy demo stores
      localStorage.removeItem("ledger_zero_mock_store_v1");
      localStorage.removeItem("ledger_zero_live_store_v2");
      localStorage.removeItem("ledger_zero_mock_store");
      localStorage.removeItem("ledger_zero_demo");

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed?.business?.name?.includes("Harbor & Pine") ||
          parsed?.business?.openingCashBalance === 1500000 ||
          (parsed?.transactions && parsed.transactions.some((t: any) => t.id === "tx-seed-1"))
        ) {
          localStorage.removeItem(STORAGE_KEY);
          return getInitialState();
        }
        return parsed;
      }
    } catch {
      // Fallback on parse failure
    }
    return getInitialState();
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // Handle storage quota issues gracefully
      }
    }
    this.notifyListeners();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  public getState(): MockStoreState {
    return this.state;
  }

  public reset() {
    this.state = getInitialState();
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.saveToStorage();
  }

  public initializeFreshUserWorkspace(user: {
    id: string;
    email: string;
    name: string;
    businessName?: string;
    vatId?: string;
  }) {
    const bizId = `biz-${user.id}`;
    const displayName = user.businessName?.trim() || `${user.name}'s Business`;
    const legalName = user.businessName?.trim() ? `${user.businessName.trim()} LLC` : `${user.name} LLC`;
    const cleanState: MockStoreState = {
      business: {
        id: bizId,
        name: displayName,
        legalName,
        countryCode: "US",
        currency: "USD",
        timeZone: "America/New_York",
        fiscalYearStartMonth: 1,
        taxIdentifier: user.vatId?.trim() || "",
        taxRatePercent: 0,
        taxLabel: "VAT / Tax",
        openingCashBalance: 0,
        createdAt: new Date().toISOString(),
      },
      members: [
        {
          id: user.id,
          businessId: bizId,
          name: user.name,
          email: user.email,
          role: "Owner",
          createdAt: new Date().toISOString(),
        },
      ],
      currentMemberId: user.id,
      customers: [],
      suppliers: [],
      transactions: [],
      invoices: [],
      budgets: [],
      scenarios: [],
      actionTasks: [],
      approvals: [],
      reminders: [],
      agentRuns: [],
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          businessId: bizId,
          actorName: user.name,
          actorType: "user",
          action: "WORKSPACE_INITIALIZED",
          targetType: "Workspace",
          targetId: bizId,
          details: "New workspace ready. Blank ledger initialized.",
          timestamp: new Date().toISOString(),
        },
      ],
      products: [],
    };

    this.state = cleanState;
    this.saveToStorage();
  }

  // --- Helpers for updating parts of state ---

  public updateBusiness(updates: Partial<Business>) {
    this.state.business = { ...this.state.business, ...updates };
    this.saveToStorage();
  }

  public setTransactions(txs: Transaction[]) {
    this.state.transactions = txs;
    this.saveToStorage();
  }

  public addTransaction(tx: Transaction) {
    this.state.transactions.unshift(tx);
    this.saveToStorage();
  }

  public updateTransaction(id: string, updates: Partial<Transaction>) {
    this.state.transactions = this.state.transactions.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    this.saveToStorage();
  }

  public deleteTransaction(id: string) {
    this.state.transactions = this.state.transactions.filter((t) => t.id !== id);
    this.saveToStorage();
  }

  public addInvoice(inv: Invoice) {
    this.state.invoices.unshift(inv);
    this.saveToStorage();
  }

  public updateInvoice(id: string, updates: Partial<Invoice>) {
    this.state.invoices = this.state.invoices.map((i) =>
      i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
    );
    this.saveToStorage();
  }

  public addCustomer(c: Customer) {
    this.state.customers.push(c);
    this.saveToStorage();
  }

  public addSupplier(s: Supplier) {
    this.state.suppliers.push(s);
    this.saveToStorage();
  }

  public addActionTask(t: ActionTask) {
    this.state.actionTasks.unshift(t);
    this.saveToStorage();
  }

  public updateActionTask(id: string, updates: Partial<ActionTask>) {
    this.state.actionTasks = this.state.actionTasks.map((t) =>
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    );
    this.saveToStorage();
  }

  public addApproval(a: Approval) {
    this.state.approvals.push(a);
    this.saveToStorage();
  }

  public addReminder(r: Reminder) {
    this.state.reminders.unshift(r);
    this.saveToStorage();
  }

  public updateReminder(id: string, updates: Partial<Reminder>) {
    this.state.reminders = this.state.reminders.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    this.saveToStorage();
  }

  public addAgentRun(run: AgentRun) {
    this.state.agentRuns.unshift(run);
    this.saveToStorage();
  }

  public updateAgentRun(id: string, updates: Partial<AgentRun>) {
    this.state.agentRuns = this.state.agentRuns.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    this.saveToStorage();
  }

  public addAuditLog(log: AuditLog) {
    this.state.auditLogs.unshift(log);
    this.saveToStorage();
  }

  public addScenario(s: Scenario) {
    this.state.scenarios.unshift(s);
    this.saveToStorage();
  }

  public addBudget(b: Budget) {
    this.state.budgets.push(b);
    this.saveToStorage();
  }

  public setCurrentMemberRole(role: Role) {
    const member = this.state.members.find((m) => m.id === this.state.currentMemberId);
    if (member) {
      member.role = role;
      this.saveToStorage();
    }
  }

  public addMember(m: Member) {
    this.state.members.push(m);
    this.saveToStorage();
  }

  public addProduct(p: Product) {
    if (!this.state.products) this.state.products = [];
    this.state.products.unshift(p);
    this.saveToStorage();
  }

  public updateProduct(id: string, updates: Partial<Product>) {
    if (!this.state.products) this.state.products = [];
    this.state.products = this.state.products.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    this.saveToStorage();
  }

  public deleteProduct(id: string) {
    if (!this.state.products) this.state.products = [];
    this.state.products = this.state.products.filter((p) => p.id !== id);
    this.saveToStorage();
  }
}

// Global singleton instance
export const mockStore = new MockStore();

// Artificial async latency helper
export async function simulateDelay(ms: number = 80): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
