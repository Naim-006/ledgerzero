import {
  Business,
  Transaction,
  Invoice,
  Customer,
  Supplier,
  Budget,
  Scenario,
  ActionTask,
  Approval,
  Reminder,
  AgentRun,
  AgentEvent,
  AuditLog,
  Member,
  Role,
} from "@/domain/types";
import {
  CashPosition,
  ReceivablesSummary,
  PayablesSummary,
  AgingBucket,
  CashFlowForecast,
  ScenarioSimulationResult,
  BudgetUtilization,
  AnomalyFlag,
} from "@/lib/finance/engine";

export interface DataService {
  // Business & Settings
  getBusiness(): Promise<Business>;
  updateBusiness(updates: Partial<Business>): Promise<Business>;
  getMembers(): Promise<Member[]>;
  inviteMember(member: Omit<Member, "id" | "createdAt">): Promise<Member>;
  updateMemberRole(memberId: string, role: Role): Promise<Member>;

  // Financial Dashboard Summaries
  getCashPosition(): Promise<CashPosition>;
  getReceivablesSummary(): Promise<ReceivablesSummary>;
  getPayablesSummary(): Promise<PayablesSummary>;
  getReceivablesAging(): Promise<AgingBucket[]>;
  getPayablesAging(): Promise<AgingBucket[]>;
  getForecast(days: 7 | 30): Promise<CashFlowForecast>;
  getAnomalies(): Promise<AnomalyFlag[]>;

  // Transactions
  getTransactions(params?: {
    search?: string;
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: Transaction[]; total: number }>;
  getTransactionById(id: string): Promise<Transaction | null>;
  createTransaction(tx: Omit<Transaction, "id" | "createdAt">): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;
  importTransactionsCsv(txs: Omit<Transaction, "id" | "createdAt">[]): Promise<{ importedCount: number; duplicateCount: number }>;

  // Invoices
  getInvoices(params?: {
    direction?: "receivable" | "payable";
    status?: string;
    counterpartyId?: string;
  }): Promise<Invoice[]>;
  getInvoiceById(id: string): Promise<Invoice | null>;
  createInvoice(inv: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice>;
  recordInvoicePayment(invoiceId: string, amount: number, date: string, notes?: string): Promise<Invoice>;

  // Counterparties
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | null>;
  createCustomer(c: Omit<Customer, "id" | "createdAt">): Promise<Customer>;
  getSuppliers(): Promise<Supplier[]>;
  getSupplierById(id: string): Promise<Supplier | null>;
  createSupplier(s: Omit<Supplier, "id" | "createdAt">): Promise<Supplier>;

  // Budgets
  getBudgets(periodMonth: string): Promise<Budget[]>;
  getBudgetUtilization(periodMonth: string): Promise<BudgetUtilization[]>;
  createBudget(b: Omit<Budget, "id" | "createdAt">): Promise<Budget>;

  // Scenarios
  getScenarios(): Promise<Scenario[]>;
  createScenario(s: Omit<Scenario, "id" | "createdAt">): Promise<Scenario>;
  simulateScenario(assumptions: any[], days?: number): Promise<ScenarioSimulationResult>;

  // Audit Logs
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  logEvent(log: Omit<AuditLog, "id" | "timestamp">): Promise<AuditLog>;

  // Demo Controls
  resetDemoData(): Promise<void>;
}

export interface ActionService {
  getActionTasks(params?: { status?: string }): Promise<ActionTask[]>;
  getActionTaskById(id: string): Promise<ActionTask | null>;
  createActionTask(task: Omit<ActionTask, "id" | "createdAt" | "updatedAt">): Promise<ActionTask>;
  approveActionTask(taskId: string, memberId: string, memberName: string, reason?: string): Promise<ActionTask>;
  rejectActionTask(taskId: string, memberId: string, memberName: string, reason?: string): Promise<ActionTask>;
  executeActionTask(taskId: string): Promise<ActionTask>;
  cancelActionTask(taskId: string, reason: string): Promise<ActionTask>;
}

export interface ReminderService {
  getReminders(): Promise<Reminder[]>;
  createReminderDraft(invoiceId: string, discountOfferPercent?: number): Promise<Reminder>;
  updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder>;
  sendReminderSimulated(id: string): Promise<Reminder>;
}

export interface AgentService {
  runAgentGoal(
    userPrompt: string,
    onEvent: (event: AgentEvent) => void
  ): Promise<AgentRun>;
  getAgentRun(runId: string): Promise<AgentRun | null>;
  getRecentRuns(): Promise<AgentRun[]>;
}

export interface AuthService {
  getCurrentMember(): Promise<Member>;
  switchRole(role: Role): Promise<Member>;
  switchBusiness(businessId: string): Promise<Business>;
}
