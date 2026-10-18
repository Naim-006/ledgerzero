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
} from "./seed";

const STORAGE_KEY = "ledger_zero_mock_store_v1";

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
}

function getInitialState(): MockStoreState {
  return {
    business: { ...INITIAL_BUSINESS },
    members: [...INITIAL_MEMBERS],
    currentMemberId: INITIAL_MEMBERS[0].id,
    customers: [...INITIAL_CUSTOMERS],
    suppliers: [...INITIAL_SUPPLIERS],
    transactions: [...INITIAL_TRANSACTIONS],
    invoices: [...INITIAL_INVOICES],
    budgets: [...INITIAL_BUDGETS],
    scenarios: [],
    actionTasks: [...INITIAL_ACTIONS],
    approvals: [],
    reminders: [],
    agentRuns: [],
    auditLogs: [...INITIAL_AUDIT_LOGS],
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
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
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
}

// Global singleton instance
export const mockStore = new MockStore();

// Artificial async latency helper
export async function simulateDelay(ms: number = 80): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
