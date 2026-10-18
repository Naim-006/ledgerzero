"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { DailyCashProjection } from "@/lib/finance/engine";
import { formatMinorUnits } from "@/lib/money";
import { useApp } from "@/context/app-context";
import { formatShortDate } from "@/lib/dates";

export interface CashChartProps {
  projections: DailyCashProjection[];
  height?: number;
  showInflowsOutflows?: boolean;
}

export function CashChart({ projections, height = 280 }: CashChartProps) {
  const { countryConfig, activeCurrency, resolvedTheme } = useApp();
  const isDark = resolvedTheme === "dark";

  const chartData = projections.map((p) => ({
    date: p.date,
    formattedDate: formatShortDate(p.date),
    closingCash: p.closingCash,
    cashMajor: p.closingCash / Math.pow(10, countryConfig.minorUnitDecimals),
    expectedInflows: p.expectedInflows / Math.pow(10, countryConfig.minorUnitDecimals),
    scheduledOutflows: p.scheduledOutflows / Math.pow(10, countryConfig.minorUnitDecimals),
    isShortfall: p.isShortfall,
  }));

  const minCash = Math.min(...projections.map((p) => p.closingCash), 0);
  const maxCash = Math.max(...projections.map((p) => p.closingCash), 100000);
  const factor = Math.pow(10, countryConfig.minorUnitDecimals);

  const gridColor = isDark ? "#22382B" : "#E2E8E4";
  const textColor = isDark ? "#8CA898" : "#5d7365";
  const strokeLineColor = isDark ? "#4ADE80" : "#183B2A";

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeLineColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={strokeLineColor} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="shortfallGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis
            dataKey="formattedDate"
            tickLine={false}
            axisLine={false}
            tick={{ fill: textColor, fontSize: 11 }}
          />
          <YAxis
            domain={[minCash / factor * 1.1, maxCash / factor * 1.1]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: textColor, fontSize: 11 }}
            tickFormatter={(val) => `${val >= 0 ? "" : "-"}$${Math.abs(val).toLocaleString()}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                const isNegative = data.closingCash < 0;
                return (
                  <div className="bg-slate-900 dark:bg-slate-950 border border-slate-700 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                    <p className="font-semibold text-slate-300">
                      {data.date}
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Projected Balance:</span>
                      <span
                        className={`font-mono font-bold ${
                          isNegative ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {formatMinorUnits(data.closingCash, activeCurrency, countryConfig.locale)}
                      </span>
                    </div>
                    {data.isShortfall && (
                      <p className="mt-1 text-[11px] text-rose-400 font-semibold">
                        ⚠️ Deficit below zero liquidity threshold
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />

          <ReferenceLine
            y={0}
            stroke="#EF4444"
            strokeDasharray="3 3"
            label={{
              value: "Zero Reserve",
              fill: isDark ? "#F87171" : "#DC2626",
              fontSize: 10,
              position: "insideBottomLeft",
            }}
          />

          <Area
            type="monotone"
            dataKey="cashMajor"
            stroke={strokeLineColor}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#cashGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
