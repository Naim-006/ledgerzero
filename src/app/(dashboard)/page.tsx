"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/app-context";
import { dataService, actionService } from "@/services";
import {
  CashPosition,
  ReceivablesSummary,
  PayablesSummary,
  CashFlowForecast,
  AgingBucket,
  AnomalyFlag,
} from "@/lib/finance/engine";
import { ActionTask, AuditLog } from "@/domain/types";
import { MetricCard } from "@/components/finance/metric-card";
import { CashChart } from "@/components/finance/cash-chart";
import { AgingChart } from "@/components/finance/aging-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyAmount } from "@/components/finance/currency-amount";
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { formatShortDate } from "@/lib/dates";

export default function OverviewPage() {
  const { permissions } = useApp();
  const [cashPos, setCashPos] = useState<CashPosition | null>(null);
  const [recSummary, setRecSummary] = useState<ReceivablesSummary | null>(null);
  const [paySummary, setPaySummary] = useState<PayablesSummary | null>(null);
  const [forecast, setForecast] = useState<CashFlowForecast | null>(null);
  const [forecastDays, setForecastDays] = useState<7 | 30>(7);
  const [agingBuckets, setAgingBuckets] = useState<AgingBucket[]>([]);
  const [pendingTasks, setPendingTasks] = useState<ActionTask[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyFlag[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = React.useCallback(async () => {
    try {
      const [cp, rs, ps, fc, ab, tasks, anom, logs] = await Promise.all([
        dataService.getCashPosition(),
        dataService.getReceivablesSummary(),
        dataService.getPayablesSummary(),
        dataService.getForecast(forecastDays),
        dataService.getReceivablesAging(),
        actionService.getActionTasks({ status: "pending_approval" }),
        dataService.getAnomalies(),
        dataService.getAuditLogs(5),
      ]);
      setCashPos(cp);
      setRecSummary(rs);
      setPaySummary(ps);
      setForecast(fc);
      setAgingBuckets(ab);
      setPendingTasks(tasks);
      setAnomalies(anom);
      setRecentLogs(logs);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [forecastDays]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const net7DayGap = (cashPos?.currentCash || 0) - (paySummary?.dueWithin7Days || 0);
  const hasShortfall = (forecast && forecast.minimumCash < 0) || net7DayGap < 0;

  return (
    <div className="space-y-6 fade-in select-none">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Financial Overview
          </h1>
          <p className="text-xs text-text-dim mt-0.5">
            Real-time summary of cash balance, receivables, and upcoming obligations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/ai-workspace">
            <Button variant="primary" size="sm" className="font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Ask AI Co-Pilot
            </Button>
          </Link>
          <Link href="/action-center">
            <Button variant="outline" size="sm" className="text-xs">
              <Zap className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Approvals ({pendingTasks.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* Sleek Liquidity Alert Callout */}
      {hasShortfall && (
        <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <div className="text-xs text-rose-900 dark:text-rose-200">
              <span className="font-semibold">Projected Cash Shortfall:</span> Available cash of{" "}
              <strong>$20,000.00</strong> will not cover upcoming payables of{" "}
              <strong>$45,000.00</strong> due within 5 days.
            </div>
          </div>

          <Link href="/ai-workspace?prompt=Help%20me%20avoid%20a%20cash%20shortage%20next%20week">
            <button className="text-xs font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-900 flex items-center gap-1 shrink-0">
              Get AI Advice
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      )}

      {/* Top 4 Financial Metric Cards — Clean & Minimal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cash Position"
          amount={cashPos?.currentCash || 0}
          period="Verified bank funds"
          href="/transactions"
          trend={{ value: "+$4,500 settled", isPositive: true }}
        />

        <MetricCard
          title="Customer Receivables"
          amount={recSummary?.totalReceivables || 0}
          period="Open customer invoices"
          href="/receivables"
          variant={recSummary?.overdueAmount ? "warning" : "default"}
          trend={{ value: "4 invoices open", isPositive: true }}
        />

        <MetricCard
          title="Upcoming Payables"
          amount={paySummary?.dueWithin7Days || 0}
          period="Due within 7 days"
          href="/payables"
          variant="risk"
          trend={{ value: "High urgency", isPositive: false }}
        />

        <MetricCard
          title="7-Day Liquidity Buffer"
          amount={net7DayGap}
          period="Estimated net balance"
          href="/cash-flow"
          variant={net7DayGap < 0 ? "risk" : "success"}
          trend={{
            value: net7DayGap < 0 ? "Shortfall alert" : "Safe liquidity",
            isPositive: net7DayGap >= 0,
          }}
        />
      </div>

      {/* Main Charts: Cash Flow Forecast & Receivables Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Balance Forecast Chart */}
        <Card className="lg:col-span-2 border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Cash Flow Forecast
              </CardTitle>
              <p className="text-xs text-text-dim mt-0.5">
                Projected cash balance trajectory based on scheduled payments.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-lg border border-border">
              <button
                onClick={() => setForecastDays(7)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  forecastDays === 7
                    ? "bg-surface text-foreground font-bold shadow-xs border border-border"
                    : "text-text-dim hover:text-foreground"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setForecastDays(30)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  forecastDays === 30
                    ? "bg-surface text-foreground font-bold shadow-xs border border-border"
                    : "text-text-dim hover:text-foreground"
                }`}
              >
                30 Days
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {forecast && <CashChart projections={forecast.dailyProjections} height={260} />}

            <div className="grid grid-cols-3 gap-4 mt-4 pt-3 border-t border-border/60 text-xs">
              <div>
                <span className="text-text-dim block">Minimum Cash</span>
                <span
                  className={`font-semibold text-sm tabular-nums ${
                    forecast?.minimumCash! < 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  <CurrencyAmount amount={forecast?.minimumCash || 0} colored />
                </span>
              </div>
              <div>
                <span className="text-text-dim block">Expected Inflows</span>
                <span className="font-semibold text-sm tabular-nums text-foreground">
                  <CurrencyAmount amount={forecast?.totalExpectedInflows || 0} />
                </span>
              </div>
              <div>
                <span className="text-text-dim block">Scheduled Outflows</span>
                <span className="font-semibold text-sm tabular-nums text-rose-600">
                  <CurrencyAmount amount={forecast?.totalScheduledOutflows || 0} />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receivables Aging Schedule */}
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Receivables Aging
              </CardTitle>
              <p className="text-xs text-text-dim mt-0.5">
                Outstanding balances by days overdue
              </p>
            </div>
            <Link
              href="/receivables"
              className="text-xs font-semibold text-forest-action hover:underline"
            >
              View All
            </Link>
          </CardHeader>

          <CardContent>
            <AgingChart buckets={agingBuckets} height={200} />

            <div className="mt-4 p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-xl text-xs">
              <div className="flex items-center justify-between font-semibold text-amber-900 dark:text-amber-200">
                <span>Apex Retail Partners</span>
                <span className="tabular-nums font-bold">$15,000.00</span>
              </div>
              <p className="text-text-dim text-[11px] mt-1 leading-relaxed">
                Invoice INV-2026-089 is <strong>6 days overdue</strong>. Recommended for expedited collection with 2% discount incentive.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals & Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-sm font-bold text-foreground">
                Pending Approvals
              </CardTitle>
              {pendingTasks.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] font-bold">
                  {pendingTasks.length} Awaiting
                </span>
              )}
            </div>
            <Link
              href="/action-center"
              className="text-xs font-semibold text-forest-action hover:underline"
            >
              Open Center
            </Link>
          </CardHeader>

          <CardContent className="space-y-3 pt-3">
            {pendingTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-dim">
                No actions currently pending approval. All recommendations resolved.
              </div>
            ) : (
              pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 border border-border rounded-xl bg-surface-subtle hover:border-forest-action/30 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        {task.riskLevel} Risk • Requires {task.requiredRole}
                      </span>
                      <h4 className="text-xs font-bold text-foreground mt-0.5">
                        {task.title}
                      </h4>
                      <p className="text-xs text-text-dim mt-0.5 leading-relaxed">
                        {task.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <span className="text-xs font-semibold text-forest-action">
                      Outcome: {task.expectedOutcome}
                    </span>

                    <Link href={`/action-center?taskId=${task.id}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs font-semibold"
                        disabled={!permissions.canApproveActions}
                      >
                        Review Action
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Log */}
        <Card className="border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-forest-action" />
              <CardTitle className="text-sm font-bold text-foreground">
                Activity Trail
              </CardTitle>
            </div>
            <Link
              href="/audit-logs"
              className="text-xs font-semibold text-forest-action hover:underline"
            >
              Full Log
            </Link>
          </CardHeader>

          <CardContent className="pt-3">
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 p-1 rounded-full bg-surface-subtle text-text-dim shrink-0">
                    {log.actorType === "agent" ? (
                      <Bot className="w-3.5 h-3.5 text-forest-action" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground truncate">
                        {log.actorName}
                      </span>
                      <span className="text-[10px] text-text-dim shrink-0 flex items-center gap-1 tabular-nums">
                        <Clock className="w-3 h-3" />
                        {formatShortDate(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-text-dim mt-0.5 leading-relaxed">
                      {log.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
