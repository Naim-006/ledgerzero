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
  Product,
} from "@/domain/types";

export const DEMO_REFERENCE_DATE = "2026-10-18";

export const INITIAL_BUSINESS: Business = {
  id: "biz_default",
  name: "My Business",
  legalName: "My Business LLC",
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

export const INITIAL_MEMBERS: Member[] = [
  {
    id: "mem-owner",
    businessId: "biz_default",
    name: "Business Owner",
    email: "owner@company.com",
    role: "Owner",
    avatarUrl: "",
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_INVOICES: Invoice[] = [];
export const INITIAL_BUDGETS: Budget[] = [];
export const INITIAL_ACTIONS: ActionTask[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_PRODUCTS: Product[] = [];

