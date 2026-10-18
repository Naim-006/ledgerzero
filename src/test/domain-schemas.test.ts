import { describe, it, expect } from "vitest";
import {
  TransactionSchema,
  InvoiceSchema,
  ActionTaskSchema,
  ReminderSchema,
  MemberSchema,
  ROLE_PERMISSIONS,
} from "@/domain/types";

describe("Domain Zod Schemas Validation", () => {
  it("validates a standard transaction model", () => {
    const validTx = {
      id: "tx-test-1",
      businessId: "biz-1",
      date: "2026-10-18",
      description: "Client Service Retainer",
      type: "income",
      category: "revenue_services",
      amount: 450000,
      currency: "USD",
      isSettled: true,
      createdAt: "2026-10-18T10:00:00Z",
    };

    const result = TransactionSchema.safeParse(validTx);
    expect(result.success).toBe(true);
  });

  it("fails on negative transaction amounts", () => {
    const invalidTx = {
      id: "tx-test-2",
      businessId: "biz-1",
      date: "2026-10-18",
      description: "Invalid Negative",
      type: "income",
      category: "revenue_services",
      amount: -500, // Invalid: must be positive
      currency: "USD",
      createdAt: "2026-10-18T10:00:00Z",
    };

    const result = TransactionSchema.safeParse(invalidTx);
    expect(result.success).toBe(false);
  });

  it("validates an invoice with line items", () => {
    const validInvoice = {
      id: "inv-test-1",
      businessId: "biz-1",
      direction: "receivable",
      invoiceNumber: "INV-999",
      counterpartyId: "c-1",
      counterpartyName: "Test Client",
      issueDate: "2026-10-01",
      dueDate: "2026-10-25",
      status: "issued",
      currency: "USD",
      lineItems: [
        {
          id: "li-1",
          description: "Consulting",
          quantity: 2,
          unitPrice: 50000,
          taxRatePercent: 0,
          subtotal: 100000,
          taxAmount: 0,
          total: 100000,
        },
      ],
      subtotal: 100000,
      taxTotal: 0,
      totalAmount: 100000,
      amountPaid: 0,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
    };

    const result = InvoiceSchema.safeParse(validInvoice);
    expect(result.success).toBe(true);
  });

  it("validates action tasks and role permissions", () => {
    const validTask = {
      id: "task-test-1",
      businessId: "biz-1",
      type: "send_payment_reminder",
      title: "Send Reminder",
      description: "Test description",
      reason: "Cash shortage risk",
      expectedOutcome: "Accelerate cash flow",
      riskLevel: "medium",
      requiredRole: "Owner",
      status: "pending_approval",
      supportingRecordIds: ["inv-1"],
      supportingRecordType: "invoice",
      parameters: { invoiceId: "inv-1" },
      createdAt: "2026-10-18T00:00:00Z",
      updatedAt: "2026-10-18T00:00:00Z",
    };

    const result = ActionTaskSchema.safeParse(validTask);
    expect(result.success).toBe(true);
  });

  it("enforces role permission boundaries", () => {
    expect(ROLE_PERMISSIONS.Owner.canApproveActions).toBe(true);
    expect(ROLE_PERMISSIONS.Admin.canApproveActions).toBe(true);
    expect(ROLE_PERMISSIONS.Accountant.canApproveActions).toBe(false);
    expect(ROLE_PERMISSIONS.Viewer.canApproveActions).toBe(false);
    expect(ROLE_PERMISSIONS.Viewer.canMutateFinancialRecords).toBe(false);
  });
});
