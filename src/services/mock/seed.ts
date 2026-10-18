import {
  Business,
  Customer,
  Supplier,
  Invoice,
  Transaction,
  Budget,
  Member,
  ActionTask,
  AuditLog,
} from "@/domain/types";

export const DEMO_REFERENCE_DATE = "2026-10-18";

export const INITIAL_BUSINESS: Business = {
  id: "biz_harbor_pine",
  name: "Harbor & Pine Supply Co.",
  legalName: "Harbor & Pine Supply Company LLC",
  countryCode: "US",
  currency: "USD",
  timeZone: "America/New_York",
  fiscalYearStartMonth: 1,
  taxIdentifier: "US-849201948",
  taxRatePercent: 8.5,
  taxLabel: "Sales Tax",
  openingCashBalance: 1500000, // $15,000.00
  createdAt: "2026-01-01T00:00:00Z",
};

export const INITIAL_MEMBERS: Member[] = [
  {
    id: "mem-1",
    businessId: "biz_harbor_pine",
    name: "Alex Vance",
    email: "alex@harborandpine.com",
    role: "Owner",
    avatarUrl: "",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "mem-2",
    businessId: "biz_harbor_pine",
    name: "Morgan Reed",
    email: "morgan@harborandpine.com",
    role: "Admin",
    avatarUrl: "",
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "mem-3",
    businessId: "biz_harbor_pine",
    name: "Taylor Chen",
    email: "taylor@harborandpine.com",
    role: "Accountant",
    avatarUrl: "",
    createdAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "mem-4",
    businessId: "biz_harbor_pine",
    name: "Jordan Bailey",
    email: "jordan@harborandpine.com",
    role: "Viewer",
    avatarUrl: "",
    createdAt: "2026-03-01T00:00:00Z",
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-01",
    businessId: "biz_harbor_pine",
    name: "Apex Retail Partners",
    email: "ap@apexretailpartners.com",
    phone: "+1 (555) 392-1084",
    address: "742 Market Street, Suite 400, Seattle, WA",
    paymentTermsDays: 30,
    reliabilityScore: 68,
    avgDaysToPay: 38,
    notes: "Frequently pays after friendly reminders. Responsive to early-settlement terms.",
    createdAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "cust-02",
    businessId: "biz_harbor_pine",
    name: "Beacon Maritime Logistics",
    email: "finance@beaconmaritime.com",
    phone: "+1 (555) 781-9921",
    address: "1200 Terminal Way, Pier 9, Tacoma, WA",
    paymentTermsDays: 21,
    reliabilityScore: 94,
    avgDaysToPay: 20,
    notes: "High reliability corporate account. Settles automatically near due date.",
    createdAt: "2026-03-05T00:00:00Z",
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "supp-01",
    businessId: "biz_harbor_pine",
    name: "Cascade Lumber & Millworks",
    email: "accounts@cascadelumber.com",
    phone: "+1 (555) 234-8800",
    category: "operating_cogs",
    paymentTermsDays: 30,
    isCritical: true,
    notes: "Primary raw timber and millwork supplier. Essential vendor for fulfillment.",
    createdAt: "2026-01-10T00:00:00Z",
  },
  {
    id: "supp-02",
    businessId: "biz_harbor_pine",
    name: "Northwest Freight Solutions",
    email: "billing@nwfreight.com",
    phone: "+1 (555) 667-3321",
    category: "operating_logistics",
    paymentTermsDays: 14,
    isCritical: false,
    notes: "Regional trucking and pallet delivery service.",
    createdAt: "2026-02-14T00:00:00Z",
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-seed-1",
    businessId: "biz_harbor_pine",
    date: "2026-10-02",
    description: "Commercial Client Deposit - Contract #441",
    type: "income",
    category: "revenue_sales",
    amount: 800000, // $8,000.00
    currency: "USD",
    counterpartyId: "cust-02",
    counterpartyName: "Beacon Maritime Logistics",
    isSettled: true,
    createdAt: "2026-10-02T14:22:00Z",
  },
  {
    id: "tx-seed-2",
    businessId: "biz_harbor_pine",
    date: "2026-10-08",
    description: "Retail Floor Direct Counter Sales Batch",
    type: "income",
    category: "revenue_sales",
    amount: 200000, // $2,000.00
    currency: "USD",
    isSettled: true,
    createdAt: "2026-10-08T18:00:00Z",
  },
  {
    id: "tx-seed-3",
    businessId: "biz_harbor_pine",
    date: "2026-10-05",
    description: "Warehouse Facility Lease - October 2026",
    type: "expense",
    category: "operating_rent",
    amount: 350000, // $3,500.00
    currency: "USD",
    counterpartyName: "Pacific Coast Properties",
    isSettled: true,
    createdAt: "2026-10-05T09:15:00Z",
  },
  {
    id: "tx-seed-4",
    businessId: "biz_harbor_pine",
    date: "2026-10-10",
    description: "Commercial Electric & Telecom Service",
    type: "expense",
    category: "operating_utilities",
    amount: 150000, // $1,500.00
    currency: "USD",
    counterpartyName: "Puget Sound Energy & Fiber",
    isSettled: true,
    createdAt: "2026-10-10T11:45:00Z",
  },
];

export const INITIAL_INVOICES: Invoice[] = [
  // 1. Receivables ($25,000 total)
  {
    id: "inv-rec-089",
    businessId: "biz_harbor_pine",
    direction: "receivable",
    invoiceNumber: "INV-2026-089",
    counterpartyId: "cust-01",
    counterpartyName: "Apex Retail Partners",
    issueDate: "2026-09-12",
    dueDate: "2026-10-12", // 6 days overdue!
    status: "overdue",
    currency: "USD",
    lineItems: [
      {
        id: "li-1",
        description: "Hardwood Display Fixtures - Custom Oak",
        quantity: 10,
        unitPrice: 150000, // $1,500 each
        taxRatePercent: 0,
        subtotal: 1500000,
        taxAmount: 0,
        total: 1500000,
      },
    ],
    subtotal: 1500000,
    taxTotal: 0,
    totalAmount: 1500000, // $15,000.00
    amountPaid: 0,
    notes: "Net 30 terms. Follow up required immediately.",
    createdAt: "2026-09-12T10:00:00Z",
    updatedAt: "2026-10-13T08:00:00Z",
  },
  {
    id: "inv-rec-094",
    businessId: "biz_harbor_pine",
    direction: "receivable",
    invoiceNumber: "INV-2026-094",
    counterpartyId: "cust-02",
    counterpartyName: "Beacon Maritime Logistics",
    issueDate: "2026-10-01",
    dueDate: "2026-10-22", // Due in 4 days (within 7-day window)
    status: "issued",
    currency: "USD",
    lineItems: [
      {
        id: "li-2",
        description: "Heavy Duty Shipping Crates - Spec 4A",
        quantity: 25,
        unitPrice: 40000, // $400 each
        taxRatePercent: 0,
        subtotal: 1000000,
        taxAmount: 0,
        total: 1000000,
      },
    ],
    subtotal: 1000000,
    taxTotal: 0,
    totalAmount: 1000000, // $10,000.00
    amountPaid: 0,
    notes: "Expected on due date per payment agreement.",
    createdAt: "2026-10-01T11:00:00Z",
    updatedAt: "2026-10-01T11:00:00Z",
  },

  // 2. Payables Due Within 7 Days ($45,000 total)
  {
    id: "inv-pay-7821",
    businessId: "biz_harbor_pine",
    direction: "payable",
    invoiceNumber: "BILL-2026-7821",
    counterpartyId: "supp-01",
    counterpartyName: "Cascade Lumber & Millworks",
    issueDate: "2026-09-21",
    dueDate: "2026-10-21", // Due in 3 days!
    status: "issued",
    currency: "USD",
    lineItems: [
      {
        id: "li-3",
        description: "Kiln-Dried Douglas Fir Lumber Batch 940",
        quantity: 50,
        unitPrice: 50000,
        taxRatePercent: 0,
        subtotal: 2500000,
        taxAmount: 0,
        total: 2500000,
      },
    ],
    subtotal: 2500000,
    taxTotal: 0,
    totalAmount: 2500000, // $25,000.00
    amountPaid: 0,
    notes: "Critical supplier invoice. Timely payment secures discount on November order.",
    createdAt: "2026-09-21T09:00:00Z",
    updatedAt: "2026-09-21T09:00:00Z",
  },
  {
    id: "inv-pay-7834",
    businessId: "biz_harbor_pine",
    direction: "payable",
    invoiceNumber: "BILL-2026-7834",
    counterpartyId: "supp-02",
    counterpartyName: "Northwest Freight Solutions",
    issueDate: "2026-10-09",
    dueDate: "2026-10-23", // Due in 5 days!
    status: "issued",
    currency: "USD",
    lineItems: [
      {
        id: "li-4",
        description: "Dedicated Flatbed Freight Runs (8 trips)",
        quantity: 8,
        unitPrice: 250000,
        taxRatePercent: 0,
        subtotal: 2000000,
        taxAmount: 0,
        total: 2000000,
      },
    ],
    subtotal: 2000000,
    taxTotal: 0,
    totalAmount: 2000000, // $20,000.00
    amountPaid: 0,
    notes: "Bi-weekly freight haulage charges.",
    createdAt: "2026-10-09T14:30:00Z",
    updatedAt: "2026-10-09T14:30:00Z",
  },
];

export const INITIAL_BUDGETS: Budget[] = [
  {
    id: "bg-1",
    businessId: "biz_harbor_pine",
    category: "operating_cogs",
    amountLimit: 3000000, // $30,000
    currency: "USD",
    periodMonth: "2026-10",
    alertThresholdPercent: 80,
    createdAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "bg-2",
    businessId: "biz_harbor_pine",
    category: "operating_rent",
    amountLimit: 400000, // $4,000
    currency: "USD",
    periodMonth: "2026-10",
    alertThresholdPercent: 80,
    createdAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "bg-3",
    businessId: "biz_harbor_pine",
    category: "operating_utilities",
    amountLimit: 200000, // $2,000
    currency: "USD",
    periodMonth: "2026-10",
    alertThresholdPercent: 75,
    createdAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "bg-4",
    businessId: "biz_harbor_pine",
    category: "operating_logistics",
    amountLimit: 2500000, // $25,000
    currency: "USD",
    periodMonth: "2026-10",
    alertThresholdPercent: 85,
    createdAt: "2026-10-01T00:00:00Z",
  },
];

export const INITIAL_ACTIONS: ActionTask[] = [
  {
    id: "task-seed-01",
    businessId: "biz_harbor_pine",
    type: "send_payment_reminder",
    title: "Send Overdue Collection Reminder with 2% Early Settlement Discount",
    description: "Follow up with Apex Retail Partners for overdue invoice INV-2026-089 ($15,000). Offer a 2% prompt-payment incentive ($300 discount) for immediate wire settlement by Oct 20.",
    reason: "Projected $25,000 working capital shortfall on Oct 21 due to upcoming Cascade Lumber supplier payment.",
    expectedOutcome: "Accelerates $14,700 inflow prior to Oct 21, reducing projected cash gap from -$25,000 to -$10,300.",
    riskLevel: "medium",
    requiredRole: "Owner",
    status: "pending_approval",
    supportingRecordIds: ["inv-rec-089", "cust-01"],
    supportingRecordType: "invoice",
    parameters: {
      invoiceId: "inv-rec-089",
      discountPercent: 2,
      targetPaymentDate: "2026-10-20",
      customerEmail: "ap@apexretailpartners.com",
    },
    createdAt: "2026-10-18T08:30:00Z",
    updatedAt: "2026-10-18T08:30:00Z",
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-1",
    businessId: "biz_harbor_pine",
    timestamp: "2026-10-18T08:30:00Z",
    actorType: "agent",
    actorName: "Autonomous Financial Agent",
    action: "PROPOSED_ACTION_TASK",
    targetType: "ActionTask",
    targetId: "task-seed-01",
    details: "Detected upcoming 7-day shortfall of $25,000. Generated expedited collection reminder for Apex Retail Partners.",
  },
  {
    id: "log-2",
    businessId: "biz_harbor_pine",
    timestamp: "2026-10-10T11:45:00Z",
    actorType: "user",
    actorName: "Alex Vance",
    action: "RECORDED_EXPENSE",
    targetType: "Transaction",
    targetId: "tx-seed-4",
    details: "Logged utility payment of $1,500.00 to Puget Sound Energy & Fiber.",
  },
];
