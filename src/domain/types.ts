import { z } from "zod";

// ==========================================
// 1. Roles & Permissions
// ==========================================
export const RoleSchema = z.enum(["Owner", "Admin", "Accountant", "Viewer"]);
export type Role = z.infer<typeof RoleSchema>;

export interface PermissionMatrix {
  canApproveActions: boolean;
  canExecuteActions: boolean;
  canMutateFinancialRecords: boolean;
  canManageTeam: boolean;
  canExportReports: boolean;
  canTriggerAgentRuns: boolean;
}

export const ROLE_PERMISSIONS: Record<Role, PermissionMatrix> = {
  Owner: {
    canApproveActions: true,
    canExecuteActions: true,
    canMutateFinancialRecords: true,
    canManageTeam: true,
    canExportReports: true,
    canTriggerAgentRuns: true,
  },
  Admin: {
    canApproveActions: true,
    canExecuteActions: true,
    canMutateFinancialRecords: true,
    canManageTeam: false,
    canExportReports: true,
    canTriggerAgentRuns: true,
  },
  Accountant: {
    canApproveActions: false, // Cannot approve high-risk external actions without owner/admin
    canExecuteActions: false,
    canMutateFinancialRecords: true,
    canManageTeam: false,
    canExportReports: true,
    canTriggerAgentRuns: true,
  },
  Viewer: {
    canApproveActions: false,
    canExecuteActions: false,
    canMutateFinancialRecords: false,
    canManageTeam: false,
    canExportReports: true,
    canTriggerAgentRuns: false,
  },
};

export const MemberSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: RoleSchema,
  avatarUrl: z.string().optional(),
  createdAt: z.string(),
});
export type Member = z.infer<typeof MemberSchema>;

// ==========================================
// 2. Business Entity
// ==========================================
export const BusinessSchema = z.object({
  id: z.string(),
  name: z.string(),
  legalName: z.string(),
  countryCode: z.string().length(2), // ISO 3166-1 alpha-2
  currency: z.string().length(3), // ISO 4217
  timeZone: z.string(),
  fiscalYearStartMonth: z.number().min(1).max(12),
  taxIdentifier: z.string().optional(),
  taxRatePercent: z.number().min(0).max(100), // Configurable label/rate
  taxLabel: z.string(), // e.g., "Sales Tax", "VAT", "GST"
  openingCashBalance: z.number().int(), // minor units
  createdAt: z.string(),
});
export type Business = z.infer<typeof BusinessSchema>;

// ==========================================
// 3. Transactions
// ==========================================
export const TransactionTypeSchema = z.enum(["income", "expense", "transfer"]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionCategorySchema = z.enum([
  "revenue_sales",
  "revenue_services",
  "operating_cogs",
  "operating_rent",
  "operating_utilities",
  "operating_payroll",
  "operating_marketing",
  "operating_logistics",
  "operating_software",
  "tax_payment",
  "loan_financing",
  "other",
]);
export type TransactionCategory = z.infer<typeof TransactionCategorySchema>;

export const TransactionSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  date: z.string(), // YYYY-MM-DD
  description: z.string(),
  type: TransactionTypeSchema,
  category: TransactionCategorySchema,
  amount: z.number().int().positive(), // integer minor units
  currency: z.string().length(3),
  counterpartyId: z.string().optional(),
  counterpartyName: z.string().optional(),
  invoiceId: z.string().optional(), // Reference to prevent double counting
  notes: z.string().optional(),
  isSettled: z.boolean().default(true),
  createdAt: z.string(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

// ==========================================
// 4. Counterparties (Customers & Suppliers)
// ==========================================
export const CounterpartyTypeSchema = z.enum(["customer", "supplier"]);
export type CounterpartyType = z.infer<typeof CounterpartyTypeSchema>;

export const CustomerSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentTermsDays: z.number().int().nonnegative(),
  reliabilityScore: z.number().min(0).max(100), // AI analyzed scoring (0-100)
  avgDaysToPay: z.number().nonnegative(),
  notes: z.string().optional(),
  createdAt: z.string(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export const SupplierSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  category: TransactionCategorySchema,
  paymentTermsDays: z.number().int().nonnegative(),
  isCritical: z.boolean().default(false), // e.g. key vendor
  notes: z.string().optional(),
  createdAt: z.string(),
});
export type Supplier = z.infer<typeof SupplierSchema>;

// ==========================================
// 5. Invoices & Payments
// ==========================================
export const InvoiceDirectionSchema = z.enum(["receivable", "payable"]);
export type InvoiceDirection = z.infer<typeof InvoiceDirectionSchema>;

export const InvoiceStatusSchema = z.enum([
  "draft",
  "issued",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const InvoiceLineItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().int().nonnegative(), // minor units
  taxRatePercent: z.number().min(0).max(100).default(0),
  subtotal: z.number().int().nonnegative(), // minor units
  taxAmount: z.number().int().nonnegative(), // minor units
  total: z.number().int().nonnegative(), // minor units
});
export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;

export const InvoicePaymentSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  date: z.string(), // YYYY-MM-DD
  amount: z.number().int().positive(), // minor units
  currency: z.string().length(3),
  transactionId: z.string().optional(), // link to cash transaction
  notes: z.string().optional(),
  createdAt: z.string(),
});
export type InvoicePayment = z.infer<typeof InvoicePaymentSchema>;

export const InvoiceSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  direction: InvoiceDirectionSchema, // receivable (customer) or payable (supplier)
  invoiceNumber: z.string(),
  counterpartyId: z.string(),
  counterpartyName: z.string(),
  issueDate: z.string(), // YYYY-MM-DD
  dueDate: z.string(), // YYYY-MM-DD
  status: InvoiceStatusSchema,
  currency: z.string().length(3),
  lineItems: z.array(InvoiceLineItemSchema),
  subtotal: z.number().int().nonnegative(),
  taxTotal: z.number().int().nonnegative(),
  totalAmount: z.number().int().positive(),
  amountPaid: z.number().int().nonnegative().default(0),
  notes: z.string().optional(),
  // For simulated document upload extraction
  extractionConfidence: z.number().min(0).max(100).optional(),
  extractionFields: z
    .record(
      z.object({
        value: z.any(),
        confidence: z.number().min(0).max(100),
      })
    )
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

// ==========================================
// 6. Budgets
// ==========================================
export const BudgetSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  category: TransactionCategorySchema,
  amountLimit: z.number().int().positive(), // minor units
  currency: z.string().length(3),
  periodMonth: z.string(), // YYYY-MM
  alertThresholdPercent: z.number().min(50).max(100).default(80),
  createdAt: z.string(),
});
export type Budget = z.infer<typeof BudgetSchema>;

// ==========================================
// 7. Scenarios & Assumptions
// ==========================================
export const ScenarioAssumptionTypeSchema = z.enum([
  "delay_customer_payment", // customer invoice paid N days late
  "accelerate_customer_payment", // customer invoice paid earlier (e.g. discount)
  "defer_supplier_payment", // supplier bill deferred by N days
  "reduce_operating_expense", // recurring expense reduction %
  "custom_inflow", // expected one-time inflow
  "custom_outflow", // expected one-time outflow
]);
export type ScenarioAssumptionType = z.infer<typeof ScenarioAssumptionTypeSchema>;

export const ScenarioAssumptionSchema = z.object({
  id: z.string(),
  type: ScenarioAssumptionTypeSchema,
  label: z.string(),
  targetInvoiceId: z.string().optional(),
  targetCategory: TransactionCategorySchema.optional(),
  shiftDays: z.number().int().optional(),
  amountDelta: z.number().int().optional(), // minor units (can be positive or negative)
  percentageDelta: z.number().optional(), // e.g. -10 for 10% reduction
  notes: z.string().optional(),
});
export type ScenarioAssumption = z.infer<typeof ScenarioAssumptionSchema>;

export const ScenarioSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  name: z.string(),
  description: z.string(),
  assumptions: z.array(ScenarioAssumptionSchema),
  minProjectedCash: z.number().int(), // minor units
  firstShortfallDate: z.string().nullable(), // YYYY-MM-DD or null if no shortfall
  createdAt: z.string(),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

// ==========================================
// 8. Action Center, Tasks & Approvals
// ==========================================
export const ActionStatusSchema = z.enum([
  "draft",
  "pending_approval",
  "approved",
  "executing",
  "completed",
  "rejected",
  "cancelled",
  "failed",
  "expired",
]);
export type ActionStatus = z.infer<typeof ActionStatusSchema>;

export const ActionRiskLevelSchema = z.enum(["low", "medium", "high"]);
export type ActionRiskLevel = z.infer<typeof ActionRiskLevelSchema>;

export const ActionTaskTypeSchema = z.enum([
  "send_payment_reminder",
  "reschedule_supplier_payment",
  "apply_early_payment_discount",
  "cancel_recurring_subscription",
  "flag_anomalous_expense",
  "create_cash_scenario",
]);
export type ActionTaskType = z.infer<typeof ActionTaskTypeSchema>;

export const ActionTaskSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  agentRunId: z.string().optional(),
  type: ActionTaskTypeSchema,
  title: z.string(),
  description: z.string(),
  reason: z.string(),
  expectedOutcome: z.string(),
  riskLevel: ActionRiskLevelSchema,
  requiredRole: RoleSchema,
  status: ActionStatusSchema,
  supportingRecordIds: z.array(z.string()), // IDs of invoices, customers, transactions
  supportingRecordType: z.enum(["invoice", "customer", "supplier", "transaction", "scenario"]),
  parameters: z.record(z.any()), // e.g. { invoiceId, discountPercent, newDueDate, messageBody }
  approvalId: z.string().optional(),
  verificationResult: z
    .object({
      verifiedAt: z.string(),
      status: z.enum(["success", "warning", "failure"]),
      message: z.string(),
      evidence: z.record(z.any()).optional(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ActionTask = z.infer<typeof ActionTaskSchema>;

export const ApprovalSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  decidedByMemberId: z.string(),
  decidedByMemberName: z.string(),
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().optional(),
  decidedAt: z.string(),
});
export type Approval = z.infer<typeof ApprovalSchema>;

// ==========================================
// 9. Reminders
// ==========================================
export const ReminderDeliveryMethodSchema = z.enum([
  "in_app_simulated", // Always shown as simulated delivery in demo
  "email",
  "sms",
  "whatsapp",
]);
export type ReminderDeliveryMethod = z.infer<typeof ReminderDeliveryMethodSchema>;

export const ReminderSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  invoiceId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  invoiceNumber: z.string(),
  amountDue: z.number().int().positive(), // minor units
  currency: z.string().length(3),
  dueDate: z.string(),
  daysOverdue: z.number().int(),
  subject: z.string(),
  body: z.string(),
  discountOfferPercent: z.number().optional(),
  deliveryMethod: ReminderDeliveryMethodSchema.default("in_app_simulated"),
  deliveryStatus: z.enum(["draft", "sent_simulated", "failed"]),
  deliveryNotes: z.string().default("Logged in-app (simulated delivery)"),
  sentAt: z.string().optional(),
  createdAt: z.string(),
});
export type Reminder = z.infer<typeof ReminderSchema>;

// ==========================================
// 10. Agent Simulator Models
// ==========================================
export const AgentEventTypeSchema = z.enum([
  "goal_received",
  "plan_created",
  "tool_call_start",
  "tool_call_result",
  "tool_call_error",
  "evidence_found",
  "draft_produced",
  "approval_requested",
  "action_executed",
  "action_verified",
  "run_completed",
]);
export type AgentEventType = z.infer<typeof AgentEventTypeSchema>;

export const AgentToolNameSchema = z.enum([
  "get_business_summary",
  "list_transactions",
  "list_overdue_receivables",
  "list_upcoming_payables",
  "calculate_cash_flow_forecast",
  "simulate_cash_flow_scenario",
  "create_reminder_draft",
  "request_action_approval",
  "schedule_follow_up",
  "execute_approved_reminder",
  "verify_action_result",
]);
export type AgentToolName = z.infer<typeof AgentToolNameSchema>;

export const AgentEventSchema = z.object({
  id: z.string(),
  runId: z.string(),
  timestamp: z.string(),
  type: AgentEventTypeSchema,
  message: z.string(),
  toolName: AgentToolNameSchema.optional(),
  toolArgs: z.record(z.any()).optional(),
  toolResult: z.any().optional(),
  evidence: z.record(z.any()).optional(),
  actionTaskId: z.string().optional(),
  isSimulated: z.literal(true).default(true),
});
export type AgentEvent = z.infer<typeof AgentEventSchema>;

export const AgentRunSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  userPrompt: z.string(),
  detectedIntent: z.enum([
    "cash_shortage",
    "overdue_collections",
    "expense_review",
    "scenario_simulation",
    "general_query",
  ]),
  status: z.enum(["running", "waiting_approval", "executing", "completed", "failed"]),
  summary: z.string(),
  verifiedFacts: z.array(z.string()),
  assumptions: z.array(z.string()),
  events: z.array(AgentEventSchema),
  proposedTaskIds: z.array(z.string()),
  createdAt: z.string(),
  completedAt: z.string().optional(),
});
export type AgentRun = z.infer<typeof AgentRunSchema>;

// ==========================================
// 11. Audit Logs
// ==========================================
export const AuditLogSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  timestamp: z.string(),
  actorType: z.enum(["user", "agent", "system"]),
  actorName: z.string(),
  action: z.string(), // e.g. "APPROVED_ACTION_TASK", "CREATED_INVOICE"
  targetType: z.string(), // "ActionTask", "Invoice", "Transaction"
  targetId: z.string(),
  details: z.string(),
  metadata: z.record(z.any()).optional(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;
