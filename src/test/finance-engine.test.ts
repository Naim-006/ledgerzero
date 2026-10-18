import { describe, it, expect } from "vitest";
import {
  calculateCashPosition,
  calculateReceivablesSummary,
  calculatePayablesSummary,
  calculateAgingBuckets,
  calculateCashFlowForecast,
  simulateScenario,
  calculateBudgetUtilization,
} from "@/lib/finance/engine";
import { formatMinorUnits, parseDecimalToMinorUnits } from "@/lib/money";
import { Invoice, Transaction, Budget, ScenarioAssumption } from "@/domain/types";

describe("Financial Engine - Cash Position & Double Counting", () => {
  it("calculates cash position accurately from settled transactions", () => {
    const transactions: Transaction[] = [
      {
        id: "tx-1",
        businessId: "biz-1",
        date: "2026-10-01",
        description: "Customer Deposit",
        type: "income",
        category: "revenue_sales",
        amount: 500000, // $5,000.00
        currency: "USD",
        isSettled: true,
        createdAt: "2026-10-01T10:00:00Z",
      },
      {
        id: "tx-2",
        businessId: "biz-1",
        date: "2026-10-02",
        description: "Office Supplies",
        type: "expense",
        category: "operating_utilities",
        amount: 150000, // $1,500.00
        currency: "USD",
        isSettled: true,
        createdAt: "2026-10-02T10:00:00Z",
      },
      {
        id: "tx-3",
        businessId: "biz-1",
        date: "2026-10-03",
        description: "Unsettled Check",
        type: "expense",
        category: "other",
        amount: 200000,
        currency: "USD",
        isSettled: false, // Unsettled should NOT count towards confirmed cash
        createdAt: "2026-10-03T10:00:00Z",
      },
    ];

    const openingCash = 1000000; // $10,000.00
    const position = calculateCashPosition(openingCash, transactions);

    expect(position.openingBalance).toBe(1000000);
    expect(position.totalIncome).toBe(500000);
    expect(position.totalExpense).toBe(150000);
    expect(position.currentCash).toBe(1350000); // 10,000 + 5,000 - 1,500 = 13,500
  });
});

describe("Financial Engine - Receivables, Payables & Partial Payments", () => {
  const referenceDate = "2026-10-18";

  const sampleInvoices: Invoice[] = [
    {
      id: "inv-1",
      businessId: "biz-1",
      direction: "receivable",
      invoiceNumber: "INV-001",
      counterpartyId: "c-1",
      counterpartyName: "Apex Retail",
      issueDate: "2026-09-15",
      dueDate: "2026-10-15", // 3 days overdue
      status: "partially_paid",
      currency: "USD",
      lineItems: [],
      subtotal: 1500000,
      taxTotal: 0,
      totalAmount: 1500000, // $15,000.00
      amountPaid: 500000, // $5,000.00 paid -> $10,000.00 outstanding
      createdAt: "2026-09-15T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
    },
    {
      id: "inv-2",
      businessId: "biz-1",
      direction: "receivable",
      invoiceNumber: "INV-002",
      counterpartyId: "c-2",
      counterpartyName: "Beacon Logistics",
      issueDate: "2026-10-01",
      dueDate: "2026-10-22", // 4 days in future (due within 7 days)
      status: "issued",
      currency: "USD",
      lineItems: [],
      subtotal: 1000000,
      taxTotal: 0,
      totalAmount: 1000000, // $10,000.00
      amountPaid: 0,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
    },
    {
      id: "inv-3",
      businessId: "biz-1",
      direction: "payable",
      invoiceNumber: "BILL-101",
      counterpartyId: "s-1",
      counterpartyName: "Pine Lumber Co",
      issueDate: "2026-10-05",
      dueDate: "2026-10-20", // 2 days in future (due within 7 days)
      status: "issued",
      currency: "USD",
      lineItems: [],
      subtotal: 4500000,
      taxTotal: 0,
      totalAmount: 4500000, // $45,000.00
      amountPaid: 0,
      createdAt: "2026-10-05T00:00:00Z",
      updatedAt: "2026-10-05T00:00:00Z",
    },
  ];

  it("calculates receivables summary correctly taking partial payments into account", () => {
    const recSummary = calculateReceivablesSummary(sampleInvoices, referenceDate);
    expect(recSummary.totalReceivables).toBe(2000000); // 10,000 (after 5k paid) + 10,000
    expect(recSummary.overdueAmount).toBe(1000000);
    expect(recSummary.dueWithin7Days).toBe(1000000);
  });

  it("calculates payables summary correctly", () => {
    const paySummary = calculatePayablesSummary(sampleInvoices, referenceDate);
    expect(paySummary.totalPayables).toBe(4500000);
    expect(paySummary.dueWithin7Days).toBe(4500000);
  });

  it("computes aging buckets accurately", () => {
    const buckets = calculateAgingBuckets(sampleInvoices, "receivable", referenceDate);
    expect(buckets[0].label).toBe("Current");
    expect(buckets[0].amount).toBe(1000000); // Beacon Logistics
    expect(buckets[1].label).toBe("1-30 Days");
    expect(buckets[1].amount).toBe(1000000); // Apex Retail (3 days overdue)
  });
});

describe("Financial Engine - Cash Flow Forecasting & Shortfall Detection", () => {
  const referenceDate = "2026-10-18";

  it("detects cash shortfall when 7-day obligations exceed cash + receivables", () => {
    const startingCash = 2000000; // $20,000.00

    const testInvoices: Invoice[] = [
      {
        id: "bill-1",
        businessId: "biz-1",
        direction: "payable",
        invoiceNumber: "BILL-001",
        counterpartyId: "s-1",
        counterpartyName: "Wholesale Supplier",
        issueDate: "2026-10-01",
        dueDate: "2026-10-21", // 3 days in future
        status: "issued",
        currency: "USD",
        lineItems: [],
        subtotal: 4500000,
        taxTotal: 0,
        totalAmount: 4500000, // $45,000.00
        amountPaid: 0,
        createdAt: "2026-10-01T00:00:00Z",
        updatedAt: "2026-10-01T00:00:00Z",
      },
    ];

    const forecast = calculateCashFlowForecast(startingCash, testInvoices, referenceDate, 7);

    // Initial cash 20k, day 3 outflow 45k -> -25k shortfall
    expect(forecast.minimumCash).toBe(-2500000);
    expect(forecast.firstShortfallDate).toBe("2026-10-21");
  });

  it("simulates scenario to resolve shortfall by shifting payments and accelerating collections", () => {
    const startingCash = 2000000; // $20,000.00

    const testInvoices: Invoice[] = [
      {
        id: "rec-1",
        businessId: "biz-1",
        direction: "receivable",
        invoiceNumber: "INV-001",
        counterpartyId: "c-1",
        counterpartyName: "Client A",
        issueDate: "2026-10-01",
        dueDate: "2026-10-28", // originally 10 days out
        status: "issued",
        currency: "USD",
        lineItems: [],
        subtotal: 2500000,
        taxTotal: 0,
        totalAmount: 2500000, // $25,000.00
        amountPaid: 0,
        createdAt: "2026-10-01T00:00:00Z",
        updatedAt: "2026-10-01T00:00:00Z",
      },
      {
        id: "bill-1",
        businessId: "biz-1",
        direction: "payable",
        invoiceNumber: "BILL-001",
        counterpartyId: "s-1",
        counterpartyName: "Supplier X",
        issueDate: "2026-10-01",
        dueDate: "2026-10-21", // 3 days out
        status: "issued",
        currency: "USD",
        lineItems: [],
        subtotal: 4000000,
        taxTotal: 0,
        totalAmount: 4000000, // $40,000.00
        amountPaid: 0,
        createdAt: "2026-10-01T00:00:00Z",
        updatedAt: "2026-10-01T00:00:00Z",
      },
    ];

    // Baseline shows shortfall on 2026-10-21 (20k - 40k = -20k)
    const baseline = calculateCashFlowForecast(startingCash, testInvoices, referenceDate, 14);
    expect(baseline.firstShortfallDate).toBe("2026-10-21");

    // Scenario assumption: Defer Supplier X by 10 days (to 2026-10-31)
    const assumptions: ScenarioAssumption[] = [
      {
        id: "asm-1",
        type: "defer_supplier_payment",
        label: "Defer Supplier X payment by 10 days",
        targetInvoiceId: "bill-1",
        shiftDays: 10,
      },
    ];

    const scenarioResult = simulateScenario(startingCash, testInvoices, assumptions, referenceDate, 14);
    expect(scenarioResult.shortfallResolved).toBe(true);
    expect(scenarioResult.modifiedForecast.firstShortfallDate).toBe(null);
    expect(scenarioResult.modifiedForecast.minimumCash).toBeGreaterThanOrEqual(0);
  });
});

describe("Multi-Currency & Minor Units Formatting", () => {
  it("formats standard two-decimal currencies (USD, EUR, BDT)", () => {
    expect(formatMinorUnits(2000000, "USD", "en-US")).toContain("20,000.00");
    expect(formatMinorUnits(150000, "BDT", "en-US")).toContain("1,500.00");
  });

  it("formats zero-decimal currencies (JPY) without cents", () => {
    expect(formatMinorUnits(50000, "JPY", "ja-JP")).toContain("50,000");
    expect(formatMinorUnits(50000, "JPY", "ja-JP")).not.toContain(".00");
  });

  it("formats three-decimal currencies (KWD)", () => {
    const formatted = formatMinorUnits(1250125, "KWD", "en-US");
    expect(formatted).toContain("1,250.125");
  });

  it("parses user decimal strings into integer minor units without float error", () => {
    expect(parseDecimalToMinorUnits("120.50", "USD")).toBe(12050);
    expect(parseDecimalToMinorUnits("20000", "USD")).toBe(2000000);
    expect(parseDecimalToMinorUnits("500", "JPY")).toBe(500);
    expect(parseDecimalToMinorUnits("1.250", "KWD")).toBe(1250);
  });
});
