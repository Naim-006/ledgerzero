"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/app-context";
import { dataService } from "@/services";
import { BudgetUtilization } from "@/lib/finance/engine";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyAmount } from "@/components/finance/currency-amount";
import { PieChart, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function BudgetsPage() {
  const { permissions } = useApp();
  const [utilizations, setUtilizations] = useState<BudgetUtilization[]>([]);
  const [periodMonth, setPeriodMonth] = useState("2026-10");

  const loadBudgets = React.useCallback(async () => {
    try {
      const utils = await dataService.getBudgetUtilization(periodMonth);
      setUtilizations(utils);
    } catch (err) {
      console.error("Error loading budgets:", err);
    }
  }, [periodMonth]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slateSurface-200">
        <div>
          <h1 className="text-2xl font-bold text-forest tracking-tight flex items-center gap-2">
            Budget Surveillance
            <Badge variant="outline" size="sm">
              October 2026
            </Badge>
          </h1>
          <p className="text-xs text-brand-700/70 mt-1">
            Category expense caps, real-time burn tracking, and early threshold anomaly alerts.
          </p>
        </div>
      </div>

      {/* Utilization Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {utilizations.map((b) => {
          const isWarning = b.isWarning;
          const isExceeded = b.isExceeded;

          return (
            <Card key={b.budgetId} className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-brand-900 capitalize">
                    {b.category.replace(/_/g, " ")}
                  </h3>
                  <p className="text-xs text-brand-700/70 mt-0.5">
                    Monthly spending allocation limit
                  </p>
                </div>
                <Badge
                  variant={isExceeded ? "risk" : isWarning ? "warning" : "success"}
                  size="sm"
                >
                  {b.utilizationPercent}% Utilized
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slateSurface-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isExceeded
                        ? "bg-risk-500"
                        : isWarning
                        ? "bg-warning-500"
                        : "bg-forest-action"
                    }`}
                    style={{ width: `${Math.min(100, b.utilizationPercent)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slateSurface-100 rounded-lg text-xs">
                <div>
                  <span className="text-brand-700 block text-[11px] font-medium">Spent to Date</span>
                  <span className="font-mono font-bold text-brand-900">
                    <CurrencyAmount amount={b.spentAmount} />
                  </span>
                </div>
                <div>
                  <span className="text-brand-700 block text-[11px] font-medium">Limit</span>
                  <span className="font-mono font-semibold text-brand-900">
                    <CurrencyAmount amount={b.amountLimit} />
                  </span>
                </div>
                <div>
                  <span className="text-brand-700 block text-[11px] font-medium">Remaining</span>
                  <span className={`font-mono font-bold ${b.remainingAmount < 0 ? "text-risk-600" : "text-forest"}`}>
                    <CurrencyAmount amount={b.remainingAmount} colored />
                  </span>
                </div>
              </div>

              {isWarning && (
                <div className="flex items-center gap-2 text-xs text-warning-800 bg-warning-50 p-2.5 rounded-lg border border-warning-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-warning-600" />
                  <span>
                    Category has exceeded the 75% warning threshold. Approaching budget cap.
                  </span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
