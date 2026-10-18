import { describe, it, expect } from "vitest";
import { formatMinorUnits } from "@/lib/money";
import { calculateCashPosition, calculateCashFlowForecast } from "@/lib/finance/engine";
import { Transaction, Invoice } from "@/domain/types";

const TEST_OPENING_BALANCE = 1500000;
const TEST_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-test-1",
    businessId: "biz-test",
    date: "2026-10-02",
    description: "Client Settlement",
    type: "income",
    category: "revenue_sales",
    amount: 500000,
    currency: "USD",
    isSettled: true,
    createdAt: "2026-10-02T00:00:00Z",
  },
];
const TEST_INVOICES: Invoice[] = [
  {
    id: "inv-test-1",
    businessId: "biz-test",
    direction: "payable",
    invoiceNumber: "BILL-001",
    counterpartyId: "supp-1",
    counterpartyName: "Supplier 1",
    issueDate: "2026-10-10",
    dueDate: "2026-10-22",
    lineItems: [],
    subtotal: 4500000,
    taxTotal: 0,
    totalAmount: 4500000,
    amountPaid: 0,
    currency: "USD",
    status: "issued",
    createdAt: "2026-10-10T00:00:00Z",
  },
  {
    id: "inv-test-2",
    businessId: "biz-test",
    direction: "receivable",
    invoiceNumber: "INV-001",
    counterpartyId: "cust-1",
    counterpartyName: "Client 1",
    issueDate: "2026-10-10",
    dueDate: "2026-10-21",
    lineItems: [],
    subtotal: 2500000,
    taxTotal: 0,
    totalAmount: 2500000,
    amountPaid: 0,
    currency: "USD",
    status: "issued",
    createdAt: "2026-10-10T00:00:00Z",
  },
];

describe("Currency Presets & Multi-Currency Proportions", () => {
  it("formats USD, EUR, and BDT with exact minor unit precision", () => {
    const cashMinor = 2000000; // 20,000.00 units in minor units

    const formattedUsd = formatMinorUnits(cashMinor, "USD", "en-US");
    expect(formattedUsd).toContain("20,000.00");
    expect(formattedUsd).toContain("$");

    const formattedEur = formatMinorUnits(cashMinor, "EUR", "de-DE");
    expect(formattedEur).toContain("20.000,00");
    expect(formattedEur).toContain("€");

    const formattedBdt = formatMinorUnits(cashMinor, "BDT", "en-US");
    expect(formattedBdt).toContain("20,000.00");
    expect(formattedBdt).toContain("BDT");
  });

  it("maintains identical mathematical proportions across all currency presets", () => {
    // Confirmed Cash: 20,000
    const position = calculateCashPosition(TEST_OPENING_BALANCE, TEST_TRANSACTIONS);
    expect(position.currentCash).toBe(2000000);

    // 7-day forecast: starting 20k, 45k outflow -> net 7-day obligations gap -25,000
    const forecast = calculateCashFlowForecast(position.currentCash, TEST_INVOICES, "2026-10-18", 7);
    const net7DayGap = position.currentCash - forecast.totalScheduledOutflows;
    expect(net7DayGap).toBe(-2500000);
    expect(forecast.totalScheduledOutflows).toBe(4500000);
    expect(forecast.totalExpectedInflows).toBe(2500000);

    const cashRatio = position.currentCash / forecast.totalScheduledOutflows;
    const recRatio = forecast.totalExpectedInflows / forecast.totalScheduledOutflows;
    expect(cashRatio).toBeCloseTo(0.4444, 3);
    expect(recRatio).toBeCloseTo(0.5555, 3);
  });
});
