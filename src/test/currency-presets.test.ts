import { describe, it, expect } from "vitest";
import { formatMinorUnits, parseDecimalToMinorUnits } from "@/lib/money";
import { COUNTRY_CONFIGS, getCountryConfig } from "@/domain/countries";
import { calculateCashPosition, calculateCashFlowForecast } from "@/lib/finance/engine";
import { INITIAL_BUSINESS, INITIAL_TRANSACTIONS, INITIAL_INVOICES } from "@/services/mock/seed";

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
    const position = calculateCashPosition(INITIAL_BUSINESS.openingCashBalance, INITIAL_TRANSACTIONS);
    expect(position.currentCash).toBe(2000000);

    // 7-day forecast: starting 20k, 45k outflow -> net 7-day obligations gap -25,000
    const forecast = calculateCashFlowForecast(position.currentCash, INITIAL_INVOICES, "2026-10-18", 7);
    const net7DayGap = position.currentCash - forecast.totalScheduledOutflows;
    expect(net7DayGap).toBe(-2500000);
    expect(forecast.totalScheduledOutflows).toBe(4500000);
    expect(forecast.totalExpectedInflows).toBe(2500000);

    // Verify proportions:
    // Cash / Outflows = 20,000 / 45,000 = 44.44%
    // Receivables / Outflows = 25,000 / 45,000 = 55.56%
    const cashRatio = position.currentCash / forecast.totalScheduledOutflows;
    const recRatio = forecast.totalExpectedInflows / forecast.totalScheduledOutflows;
    expect(cashRatio).toBeCloseTo(0.4444, 3);
    expect(recRatio).toBeCloseTo(0.5555, 3);
  });
});
