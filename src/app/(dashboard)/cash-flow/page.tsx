"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/app-context";
import { dataService } from "@/services";
import {
  CashFlowForecast,
  ScenarioSimulationResult,
} from "@/lib/finance/engine";
import { ScenarioAssumption } from "@/domain/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyAmount } from "@/components/finance/currency-amount";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import { formatShortDate } from "@/lib/dates";
import { formatMinorUnits } from "@/lib/money";

export default function CashFlowSimulatorPage() {
  const { countryConfig, activeCurrency, permissions, resolvedTheme } = useApp();
  const isDark = resolvedTheme === "dark";

  const [forecastDays, setForecastDays] = useState<number>(30);
  const [simulationResult, setSimulationResult] = useState<ScenarioSimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scenarioName, setScenarioName] = useState("Intervention: Accelerated Collections & Deferral");
  const [isSaved, setIsSaved] = useState(false);

  // Default scenario assumptions that resolve the Harbor & Pine Supply Co. cash shortage
  const [assumptions, setAssumptions] = useState<ScenarioAssumption[]>([
    {
      id: "asm-1",
      type: "accelerate_customer_payment",
      label: "Apex Retail Partners ($15,000) early wire with 2% discount",
      targetInvoiceId: "inv-rec-089",
      shiftDays: 0, // collected immediately on Oct 20
      percentageDelta: -2,
      notes: "Early prompt-settlement terms",
    },
    {
      id: "asm-2",
      type: "defer_supplier_payment",
      label: "Defer Northwest Freight bill ($20,000) by 7 days",
      targetInvoiceId: "inv-pay-7834",
      shiftDays: 7,
      notes: "Agreed terms adjustment with carrier",
    },
  ]);

  const runSimulation = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await dataService.simulateScenario(assumptions, forecastDays);
      setSimulationResult(res);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [assumptions, forecastDays]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  const handleToggleAssumption = (id: string) => {
    setAssumptions((prev) => prev.filter((a) => a.id !== id));
  };

  const handleResetAssumptions = () => {
    setAssumptions([
      {
        id: "asm-1",
        type: "accelerate_customer_payment",
        label: "Apex Retail Partners ($15,000) early wire with 2% discount",
        targetInvoiceId: "inv-rec-089",
        shiftDays: 0,
        percentageDelta: -2,
      },
      {
        id: "asm-2",
        type: "defer_supplier_payment",
        label: "Defer Northwest Freight bill ($20,000) by 7 days",
        targetInvoiceId: "inv-pay-7834",
        shiftDays: 7,
      },
    ]);
  };

  const handleSaveScenario = async () => {
    if (!simulationResult) return;
    try {
      await dataService.createScenario({
        businessId: "biz_harbor_pine",
        name: scenarioName,
        description: `Simulated scenario with ${assumptions.length} assumptions.`,
        assumptions,
        minProjectedCash: simulationResult.modifiedForecast.minimumCash,
        firstShortfallDate: simulationResult.modifiedForecast.firstShortfallDate,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save scenario:", err);
    }
  };

  // Prepare chart comparison data
  const chartData = simulationResult
    ? simulationResult.baselineForecast.dailyProjections.map((b, idx) => {
        const m = simulationResult.modifiedForecast.dailyProjections[idx];
        const factor = Math.pow(10, countryConfig.minorUnitDecimals);
        return {
          date: b.date,
          formattedDate: formatShortDate(b.date),
          baselineCash: b.closingCash / factor,
          modifiedCash: m ? m.closingCash / factor : b.closingCash / factor,
          baselineMinor: b.closingCash,
          modifiedMinor: m ? m.closingCash : b.closingCash,
        };
      })
    : [];

  const shortfallResolved = simulationResult?.shortfallResolved;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slateSurface-200">
        <div>
          <h1 className="text-2xl font-bold text-forest tracking-tight flex items-center gap-2">
            Cash Flow & Scenario Simulator
            <Badge variant="simulated" size="sm">
              Non-Mutating
            </Badge>
          </h1>
          <p className="text-xs text-brand-700/70 mt-1">
            Model hypothetical collections, payment shifts, and early settlement incentives without modifying live ledger records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAssumptions}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Levers
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveScenario}
            disabled={!permissions.canMutateFinancialRecords}
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4 text-lime-accent" /> : <Save className="w-4 h-4" />}
            {isSaved ? "Scenario Saved" : "Save Scenario"}
          </Button>
        </div>
      </div>

      {/* Shortfall Resolution Callout */}
      {shortfallResolved ? (
        <div className="p-4 bg-success-50 border border-success-200 rounded-xl flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-100 rounded-lg text-success-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-success-800">
                Shortfall Successfully Resolved in Modified Scenario!
              </h4>
              <p className="text-xs text-success-900/80 mt-0.5">
                The baseline deficit of <strong>-$25,000.00</strong> on Oct 21 is completely averted. Minimum projected liquidity remains positive throughout the window.
              </p>
            </div>
          </div>
          <Badge variant="success" size="md">
            +${((simulationResult.minimumCashDifference || 0) / 100).toLocaleString()} Liquidity Improvement
          </Badge>
        </div>
      ) : (
        <div className="p-4 bg-warning-50 border border-warning-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-warning-600 shrink-0" />
          <p className="text-xs text-warning-900">
            Current scenario still projects a deficit. Apply collection accelerators or payment deferrals below to close the working capital gap.
          </p>
        </div>
      )}

      {/* Comparative Projection Curve (Recharts) */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-forest-action" />
              Scenario Comparison: Baseline vs. Modified Projection
            </CardTitle>
            <p className="text-xs text-brand-700/70 mt-0.5">
              Green line represents modified scenario; dashed gray line indicates unmitigated baseline.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-700/70">Window:</span>
            <div className="flex items-center gap-1 bg-slateSurface-100 p-1 rounded-lg border border-slateSurface-200">
              <button
                onClick={() => setForecastDays(14)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  forecastDays === 14 ? "bg-surface text-forest font-bold shadow-xs border border-slateSurface-200" : "text-brand-700 hover:text-brand-900"
                }`}
              >
                14 Days
              </button>
              <button
                onClick={() => setForecastDays(30)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  forecastDays === 30 ? "bg-surface text-forest font-bold shadow-xs border border-slateSurface-200" : "text-brand-700 hover:text-brand-900"
                }`}
              >
                30 Days
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="modGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? "#4ADE80" : "#14532D"} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={isDark ? "#4ADE80" : "#14532D"} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#22382B" : "#E2E8E4"} />
                <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} tick={{ fill: isDark ? "#8CA898" : "#5d7365", fontSize: 11 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: isDark ? "#8CA898" : "#5d7365", fontSize: 11 }}
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 dark:bg-slate-950 text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1.5">
                          <p className="font-semibold text-slate-300">{data.date}</p>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-emerald-400 font-semibold">Modified Scenario:</span>
                            <span className="font-mono font-bold text-white">
                              {formatMinorUnits(data.modifiedMinor, activeCurrency, countryConfig.locale)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-slate-400">
                            <span>Baseline (Unchanged):</span>
                            <span className="font-mono text-slate-200">
                              {formatMinorUnits(data.baselineMinor, activeCurrency, countryConfig.locale)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="baselineCash"
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  fill="none"
                  name="Baseline Forecast"
                />
                <Area
                  type="monotone"
                  dataKey="modifiedCash"
                  stroke="#14532D"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#modGradient)"
                  name="Modified Scenario"
                />
                <Legend verticalAlign="top" height={36} iconType="plainline" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Key Simulation KPI Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slateSurface-100 text-xs">
            <div className="p-3 bg-slateSurface-100 rounded-lg">
              <span className="text-brand-700 block font-medium">Baseline Min Cash</span>
              <span className="font-mono font-bold text-sm text-risk-600">
                <CurrencyAmount amount={simulationResult?.baselineForecast.minimumCash || 0} colored />
              </span>
              <span className="text-[10px] text-brand-700 block mt-0.5">
                On {simulationResult?.baselineForecast.minimumCashDate}
              </span>
            </div>

            <div className="p-3 bg-brand-50 rounded-lg">
              <span className="text-forest block font-semibold">Modified Min Cash</span>
              <span className="font-mono font-bold text-sm text-forest-action">
                <CurrencyAmount amount={simulationResult?.modifiedForecast.minimumCash || 0} colored />
              </span>
              <span className="text-[10px] text-brand-700 block mt-0.5 font-medium">
                Deficit averted: {simulationResult?.modifiedForecast.firstShortfallDate || "None"}
              </span>
            </div>

            <div className="p-3 bg-slateSurface-100 rounded-lg">
              <span className="text-brand-700 block font-medium">Net Liquidity Delta</span>
              <span className="font-mono font-bold text-sm text-success-700">
                +<CurrencyAmount amount={simulationResult?.minimumCashDifference || 0} />
              </span>
              <span className="text-[10px] text-brand-700 block mt-0.5">
                Buffer generated
              </span>
            </div>

            <div className="p-3 bg-slateSurface-100 rounded-lg">
              <span className="text-brand-700 block font-medium">Impacted Invoices</span>
              <span className="font-mono font-bold text-sm text-brand-900">
                {simulationResult?.impactedRecordIds.length || 0} Records
              </span>
              <span className="text-[10px] text-brand-700 block mt-0.5">
                No database records modified
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Assumption Levers */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-sm">Active Scenario Levers & Assumptions</CardTitle>
            <p className="text-xs text-brand-700/70 mt-0.5">
              Toggle or tweak hypothetical adjustments to test resilience against delayed payments.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {assumptions.map((asm) => (
              <div
                key={asm.id}
                className="flex items-center justify-between p-3.5 bg-surfaceSubtle border border-slateSurface-200 rounded-xl hover:border-brand-300 transition-colors text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-brand-50 text-forest-action rounded-lg font-bold mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h5 className="font-semibold text-brand-900">{asm.label}</h5>
                    <p className="text-[11px] text-brand-700 mt-0.5">
                      Type: <code>{asm.type}</code> • Shift: {asm.shiftDays || 0} days
                      {asm.percentageDelta ? ` • Incentive: ${asm.percentageDelta}%` : ""}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleAssumption(asm.id)}
                  className="p-1.5 text-brand-700/40 hover:text-risk-600 rounded-lg transition-colors"
                  title="Remove assumption"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
