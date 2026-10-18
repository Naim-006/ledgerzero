import {
  Transaction,
  Invoice,
  Budget,
  ScenarioAssumption,
} from "@/domain/types";
import { addDaysToDate, getDaysDifference } from "../dates";

export interface CashPosition {
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentCash: number;
}

export interface ReceivablesSummary {
  totalReceivables: number;
  overdueAmount: number;
  dueWithin7Days: number;
  dueWithin30Days: number;
  count: number;
  overdueCount: number;
}

export interface PayablesSummary {
  totalPayables: number;
  overdueAmount: number;
  dueWithin7Days: number;
  dueWithin30Days: number;
  count: number;
  overdueCount: number;
}

export interface AgingBucket {
  label: string;
  minDays: number;
  maxDays: number | null;
  amount: number;
  count: number;
  invoiceIds: string[];
}

export interface DailyCashProjection {
  date: string;
  dayIndex: number;
  openingCash: number;
  expectedInflows: number;
  scheduledOutflows: number;
  netCashFlow: number;
  closingCash: number;
  isShortfall: boolean;
  notes: string[];
}

export interface CashFlowForecast {
  days: number;
  startDate: string;
  endDate: string;
  dailyProjections: DailyCashProjection[];
  minimumCash: number;
  minimumCashDate: string;
  firstShortfallDate: string | null;
  totalExpectedInflows: number;
  totalScheduledOutflows: number;
  netProjectedChange: number;
}

export interface ScenarioSimulationResult {
  baselineForecast: CashFlowForecast;
  modifiedForecast: CashFlowForecast;
  minimumCashDifference: number; // modified - baseline
  shortfallResolved: boolean;
  baselineShortfallDate: string | null;
  modifiedShortfallDate: string | null;
  appliedAssumptionsCount: number;
  impactedRecordIds: string[];
}

export interface BudgetUtilization {
  budgetId: string;
  category: string;
  amountLimit: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationPercent: number;
  isExceeded: boolean;
  isWarning: boolean;
}

export interface AnomalyFlag {
  id: string;
  type: "expense_spike" | "shortfall_risk" | "overdue_cluster";
  severity: "low" | "medium" | "high";
  message: string;
  relatedRecordId?: string;
  amount?: number;
}

/**
 * 1. Calculate confirmed cash position from settled transactions & opening balance
 */
export function calculateCashPosition(
  openingCashBalance: number,
  transactions: Transaction[]
): CashPosition {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    if (!tx.isSettled) continue;
    if (tx.type === "income") {
      totalIncome += tx.amount;
    } else if (tx.type === "expense") {
      totalExpense += tx.amount;
    }
  }

  const currentCash = openingCashBalance + totalIncome - totalExpense;

  return {
    openingBalance: openingCashBalance,
    totalIncome,
    totalExpense,
    currentCash,
  };
}

/**
 * 2. Calculate receivables summary (Customer invoices owed to us)
 */
export function calculateReceivablesSummary(
  invoices: Invoice[],
  referenceDate: string
): ReceivablesSummary {
  let totalReceivables = 0;
  let overdueAmount = 0;
  let dueWithin7Days = 0;
  let dueWithin30Days = 0;
  let count = 0;
  let overdueCount = 0;

  for (const inv of invoices) {
    if (inv.direction !== "receivable") continue;
    if (inv.status === "paid" || inv.status === "cancelled") continue;

    const outstanding = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));
    if (outstanding <= 0) continue;

    totalReceivables += outstanding;
    count++;

    const daysUntilDue = getDaysDifference(inv.dueDate, referenceDate);

    if (daysUntilDue < 0) {
      overdueAmount += outstanding;
      overdueCount++;
    } else {
      if (daysUntilDue <= 7) {
        dueWithin7Days += outstanding;
      }
      if (daysUntilDue <= 30) {
        dueWithin30Days += outstanding;
      }
    }
  }

  return {
    totalReceivables,
    overdueAmount,
    dueWithin7Days,
    dueWithin30Days,
    count,
    overdueCount,
  };
}

/**
 * 3. Calculate payables summary (Supplier bills we owe)
 */
export function calculatePayablesSummary(
  invoices: Invoice[],
  referenceDate: string
): PayablesSummary {
  let totalPayables = 0;
  let overdueAmount = 0;
  let dueWithin7Days = 0;
  let dueWithin30Days = 0;
  let count = 0;
  let overdueCount = 0;

  for (const inv of invoices) {
    if (inv.direction !== "payable") continue;
    if (inv.status === "paid" || inv.status === "cancelled") continue;

    const outstanding = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));
    if (outstanding <= 0) continue;

    totalPayables += outstanding;
    count++;

    const daysUntilDue = getDaysDifference(inv.dueDate, referenceDate);

    if (daysUntilDue < 0) {
      overdueAmount += outstanding;
      overdueCount++;
    } else {
      if (daysUntilDue <= 7) {
        dueWithin7Days += outstanding;
      }
      if (daysUntilDue <= 30) {
        dueWithin30Days += outstanding;
      }
    }
  }

  return {
    totalPayables,
    overdueAmount,
    dueWithin7Days,
    dueWithin30Days,
    count,
    overdueCount,
  };
}

/**
 * 4. Calculate Aging Buckets for receivables or payables
 */
export function calculateAgingBuckets(
  invoices: Invoice[],
  direction: "receivable" | "payable",
  referenceDate: string
): AgingBucket[] {
  const buckets: AgingBucket[] = [
    { label: "Current", minDays: 0, maxDays: 0, amount: 0, count: 0, invoiceIds: [] },
    { label: "1-30 Days", minDays: 1, maxDays: 30, amount: 0, count: 0, invoiceIds: [] },
    { label: "31-60 Days", minDays: 31, maxDays: 60, amount: 0, count: 0, invoiceIds: [] },
    { label: "61-90 Days", minDays: 61, maxDays: 90, amount: 0, count: 0, invoiceIds: [] },
    { label: "90+ Days", minDays: 91, maxDays: null, amount: 0, count: 0, invoiceIds: [] },
  ];

  for (const inv of invoices) {
    if (inv.direction !== direction) continue;
    if (inv.status === "paid" || inv.status === "cancelled") continue;

    const outstanding = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));
    if (outstanding <= 0) continue;

    // Overdue days = referenceDate - dueDate (positive means overdue)
    const daysOverdue = getDaysDifference(referenceDate, inv.dueDate);

    if (daysOverdue <= 0) {
      // Not overdue
      buckets[0].amount += outstanding;
      buckets[0].count++;
      buckets[0].invoiceIds.push(inv.id);
    } else if (daysOverdue <= 30) {
      buckets[1].amount += outstanding;
      buckets[1].count++;
      buckets[1].invoiceIds.push(inv.id);
    } else if (daysOverdue <= 60) {
      buckets[2].amount += outstanding;
      buckets[2].count++;
      buckets[2].invoiceIds.push(inv.id);
    } else if (daysOverdue <= 90) {
      buckets[3].amount += outstanding;
      buckets[3].count++;
      buckets[3].invoiceIds.push(inv.id);
    } else {
      buckets[4].amount += outstanding;
      buckets[4].count++;
      buckets[4].invoiceIds.push(inv.id);
    }
  }

  return buckets;
}

/**
 * 5. Calculate Daily Cash Flow Forecast
 * Double-counting rule:
 * - Starting cash is the current confirmed cash.
 * - Inflows & Outflows come strictly from unsettled invoices on their due dates.
 * - Invoices already overdue at referenceDate are conservatively grouped on Day 0 or given an assumption.
 */
export function calculateCashFlowForecast(
  startingCash: number,
  invoices: Invoice[],
  startDate: string,
  forecastDays: number = 30
): CashFlowForecast {
  const dailyProjections: DailyCashProjection[] = [];

  // Index unsettled invoices by due date
  const inflowsByDate: Record<string, { amount: number; notes: string[] }> = {};
  const outflowsByDate: Record<string, { amount: number; notes: string[] }> = {};

  for (const inv of invoices) {
    if (inv.status === "paid" || inv.status === "cancelled") continue;
    const outstanding = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));
    if (outstanding <= 0) continue;

    // If invoice is already overdue relative to startDate, map it to day 0
    let effectiveDate = inv.dueDate;
    if (getDaysDifference(inv.dueDate, startDate) < 0) {
      effectiveDate = startDate;
    }

    if (inv.direction === "receivable") {
      if (!inflowsByDate[effectiveDate]) inflowsByDate[effectiveDate] = { amount: 0, notes: [] };
      inflowsByDate[effectiveDate].amount += outstanding;
      inflowsByDate[effectiveDate].notes.push(`Receivable: ${inv.counterpartyName} (${inv.invoiceNumber})`);
    } else {
      if (!outflowsByDate[effectiveDate]) outflowsByDate[effectiveDate] = { amount: 0, notes: [] };
      outflowsByDate[effectiveDate].amount += outstanding;
      outflowsByDate[effectiveDate].notes.push(`Payable: ${inv.counterpartyName} (${inv.invoiceNumber})`);
    }
  }

  let runningCash = startingCash;
  let minCash = startingCash;
  let minCashDate = startDate;
  let firstShortfallDate: string | null = startingCash < 0 ? startDate : null;
  let totalInflows = 0;
  let totalOutflows = 0;

  for (let i = 0; i < forecastDays; i++) {
    const currentDate = addDaysToDate(startDate, i);
    const dayInflows = inflowsByDate[currentDate]?.amount || 0;
    const dayOutflows = outflowsByDate[currentDate]?.amount || 0;

    const openingCash = runningCash;
    const netCashFlow = dayInflows - dayOutflows;
    runningCash += netCashFlow;

    totalInflows += dayInflows;
    totalOutflows += dayOutflows;

    if (runningCash < minCash) {
      minCash = runningCash;
      minCashDate = currentDate;
    }

    const isShortfall = runningCash < 0;
    if (isShortfall && !firstShortfallDate) {
      firstShortfallDate = currentDate;
    }

    const notes = [
      ...(inflowsByDate[currentDate]?.notes || []),
      ...(outflowsByDate[currentDate]?.notes || []),
    ];

    dailyProjections.push({
      date: currentDate,
      dayIndex: i,
      openingCash,
      expectedInflows: dayInflows,
      scheduledOutflows: dayOutflows,
      netCashFlow,
      closingCash: runningCash,
      isShortfall,
      notes,
    });
  }

  const endDate = addDaysToDate(startDate, forecastDays - 1);

  return {
    days: forecastDays,
    startDate,
    endDate,
    dailyProjections,
    minimumCash: minCash,
    minimumCashDate: minCashDate,
    firstShortfallDate,
    totalExpectedInflows: totalInflows,
    totalScheduledOutflows: totalOutflows,
    netProjectedChange: runningCash - startingCash,
  };
}

/**
 * 6. Simulate Scenario
 * Applies hypothetical changes (delays, discounts, expense cuts) WITHOUT mutating base records.
 */
export function simulateScenario(
  startingCash: number,
  baseInvoices: Invoice[],
  assumptions: ScenarioAssumption[],
  startDate: string,
  forecastDays: number = 30
): ScenarioSimulationResult {
  const baselineForecast = calculateCashFlowForecast(startingCash, baseInvoices, startDate, forecastDays);

  // Deep clone invoices for scenario overlay
  const modifiedInvoices: Invoice[] = baseInvoices.map((inv) => ({ ...inv }));
  const impactedRecordIds: string[] = [];

  for (const assumption of assumptions) {
    if (assumption.targetInvoiceId) {
      const target = modifiedInvoices.find((inv) => inv.id === assumption.targetInvoiceId);
      if (target) {
        impactedRecordIds.push(target.id);
        if (assumption.type === "delay_customer_payment" && assumption.shiftDays) {
          target.dueDate = addDaysToDate(target.dueDate, assumption.shiftDays);
        } else if (assumption.type === "accelerate_customer_payment" && assumption.shiftDays) {
          target.dueDate = addDaysToDate(target.dueDate, assumption.shiftDays);
          if (assumption.percentageDelta) {
            // Apply early payment discount
            const discountFactor = (100 + assumption.percentageDelta) / 100;
            target.totalAmount = Math.round(target.totalAmount * discountFactor);
          }
        } else if (assumption.type === "defer_supplier_payment" && assumption.shiftDays) {
          target.dueDate = addDaysToDate(target.dueDate, assumption.shiftDays);
        }
      }
    }
  }

  const modifiedForecast = calculateCashFlowForecast(startingCash, modifiedInvoices, startDate, forecastDays);

  const baselineShortfallDate = baselineForecast.firstShortfallDate;
  const modifiedShortfallDate = modifiedForecast.firstShortfallDate;
  const shortfallResolved = baselineShortfallDate !== null && modifiedShortfallDate === null;

  return {
    baselineForecast,
    modifiedForecast,
    minimumCashDifference: modifiedForecast.minimumCash - baselineForecast.minimumCash,
    shortfallResolved,
    baselineShortfallDate,
    modifiedShortfallDate,
    appliedAssumptionsCount: assumptions.length,
    impactedRecordIds,
  };
}

/**
 * 7. Calculate Budget Utilization
 */
export function calculateBudgetUtilization(
  budgets: Budget[],
  transactions: Transaction[],
  periodMonth: string // YYYY-MM
): BudgetUtilization[] {
  // Aggregate expenses for the given month by category
  const expensesByCategory: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.type !== "expense" || !tx.isSettled) continue;
    if (tx.date.startsWith(periodMonth)) {
      expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + tx.amount;
    }
  }

  return budgets
    .filter((b) => b.periodMonth === periodMonth)
    .map((b) => {
      const spent = expensesByCategory[b.category] || 0;
      const remaining = b.amountLimit - spent;
      const utilization = b.amountLimit > 0 ? (spent / b.amountLimit) * 100 : 0;
      const isExceeded = spent > b.amountLimit;
      const isWarning = utilization >= b.alertThresholdPercent && !isExceeded;

      return {
        budgetId: b.id,
        category: b.category,
        amountLimit: b.amountLimit,
        spentAmount: spent,
        remainingAmount: remaining,
        utilizationPercent: Math.round(utilization * 10) / 10,
        isExceeded,
        isWarning,
      };
    });
}

/**
 * 8. Anomaly Flags & Risk Detection
 */
export function detectFinancialAnomalies(
  transactions: Transaction[],
  forecast: CashFlowForecast
): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];

  // Flag 1: Cash shortfall projected within forecast window
  if (forecast.firstShortfallDate) {
    flags.push({
      id: "anomaly-shortfall",
      type: "shortfall_risk",
      severity: "high",
      message: `Projected cash shortfall of ${Math.abs(forecast.minimumCash)} on ${forecast.minimumCashDate}. Immediate working capital action required.`,
      amount: forecast.minimumCash,
    });
  }

  // Flag 2: Single expense transaction significantly exceeding normal threshold
  const expenses = transactions.filter((t) => t.type === "expense");
  if (expenses.length > 0) {
    const totalExp = expenses.reduce((acc, t) => acc + t.amount, 0);
    const avgExp = totalExp / expenses.length;
    for (const tx of expenses) {
      if (tx.amount > avgExp * 3 && tx.amount > 100000) {
        flags.push({
          id: `anomaly-spike-${tx.id}`,
          type: "expense_spike",
          severity: "medium",
          message: `Unusual expense spike: "${tx.description}" (${tx.amount}) is over 3x the average transaction amount.`,
          relatedRecordId: tx.id,
          amount: tx.amount,
        });
      }
    }
  }

  return flags;
}
