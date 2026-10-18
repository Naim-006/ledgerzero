"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/app-context";
import { dataService } from "@/services";
import {
  CashPosition,
  ReceivablesSummary,
  PayablesSummary,
  AgingBucket,
  CashFlowForecast,
} from "@/lib/finance/engine";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyAmount } from "@/components/finance/currency-amount";
import { BarChart3, Download, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { formatShortDate } from "@/lib/dates";

export default function ReportsPage() {
  const { activeCurrency } = useApp();

  const [cashPos, setCashPos] = useState<CashPosition | null>(null);
  const [recSummary, setRecSummary] = useState<ReceivablesSummary | null>(null);
  const [paySummary, setPaySummary] = useState<PayablesSummary | null>(null);
  const [agingBuckets, setAgingBuckets] = useState<AgingBucket[]>([]);
  const [forecast, setForecast] = useState<CashFlowForecast | null>(null);

  useEffect(() => {
    const load = async () => {
      const [cp, rs, ps, ab, fc] = await Promise.all([
        dataService.getCashPosition(),
        dataService.getReceivablesSummary(),
        dataService.getPayablesSummary(),
        dataService.getReceivablesAging(),
        dataService.getForecast(30),
      ]);
      setCashPos(cp);
      setRecSummary(rs);
      setPaySummary(ps);
      setAgingBuckets(ab);
      setForecast(fc);
    };
    load();
  }, []);

  const handleExportCsv = () => {
    if (!forecast) return;

    const headers = ["Date", "Opening Cash", "Expected Inflows", "Scheduled Outflows", "Closing Cash", "Deficit Flag"];
    const rows = forecast.dailyProjections.map((p) => [
      p.date,
      (p.openingCash / 100).toFixed(2),
      (p.expectedInflows / 100).toFixed(2),
      (p.scheduledOutflows / 100).toFixed(2),
      (p.closingCash / 100).toFixed(2),
      p.isShortfall ? "YES" : "NO",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ledger_zero_forecast_report_${activeCurrency}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slateSurface-200">
        <div>
          <h1 className="text-2xl font-bold text-forest tracking-tight flex items-center gap-2">
            Financial Reports & Intelligence
            <Badge variant="outline" size="sm">
              Deterministic Engine
            </Badge>
          </h1>
          <p className="text-xs text-brand-700/70 mt-1">
            Reconciled statements, working capital summaries, and auditable accounting exports.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleExportCsv}>
          <Download className="w-3.5 h-3.5" />
          Export Forecast CSV
        </Button>
      </div>

      {/* Reconciled Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-700/60 block">
            Confirmed Income vs Expense
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-brand-800">Total Settled Inflow:</span>
              <span className="font-mono font-bold text-success-700">
                +<CurrencyAmount amount={cashPos?.totalIncome || 0} />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-800">Total Settled Outflow:</span>
              <span className="font-mono font-bold text-risk-600">
                -<CurrencyAmount amount={cashPos?.totalExpense || 0} />
              </span>
            </div>
            <div className="pt-2 border-t border-slateSurface-100 flex items-center justify-between font-bold text-brand-900">
              <span>Net Settled Operating Flow:</span>
              <span className="font-mono">
                <CurrencyAmount amount={(cashPos?.totalIncome || 0) - (cashPos?.totalExpense || 0)} colored showSign />
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-700/60 block">
            Working Capital Balances
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-brand-800">Confirmed Cash:</span>
              <span className="font-mono font-bold text-forest">
                <CurrencyAmount amount={cashPos?.currentCash || 0} />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-800">Open Receivables:</span>
              <span className="font-mono font-bold text-brand-900">
                <CurrencyAmount amount={recSummary?.totalReceivables || 0} />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-800">Open Payables:</span>
              <span className="font-mono font-bold text-brand-900">
                <CurrencyAmount amount={paySummary?.totalPayables || 0} />
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-700/60 block">
            30-Day Liquidity Health
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-brand-800">Minimum Projected Cash:</span>
              <span className="font-mono font-bold text-risk-600">
                <CurrencyAmount amount={forecast?.minimumCash || 0} colored />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-800">First Shortfall Date:</span>
              <span className="font-semibold text-brand-900">
                {forecast?.firstShortfallDate || "None (Sufficient)"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-800">Overdue Collections:</span>
              <span className="font-mono font-bold text-warning-700">
                <CurrencyAmount amount={recSummary?.overdueAmount || 0} />
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Aging Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Accounts Receivable Aging Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            {agingBuckets.map((b) => (
              <div key={b.label} className="p-3 bg-slateSurface-50 rounded-xl space-y-1">
                <span className="text-brand-700/60 text-[11px] block">{b.label}</span>
                <span className="font-mono font-bold text-sm text-brand-900 block">
                  <CurrencyAmount amount={b.amount} />
                </span>
                <span className="text-[10px] text-brand-700/50 block">
                  {b.count} invoice{b.count === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
