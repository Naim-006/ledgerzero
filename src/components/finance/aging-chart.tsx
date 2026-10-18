"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AgingBucket } from "@/lib/finance/engine";
import { formatMinorUnits } from "@/lib/money";
import { useApp } from "@/context/app-context";

export function AgingChart({ buckets, height = 240 }: { buckets: AgingBucket[]; height?: number }) {
  const { countryConfig, activeCurrency, resolvedTheme } = useApp();
  const isDark = resolvedTheme === "dark";
  const factor = Math.pow(10, countryConfig.minorUnitDecimals);

  const data = buckets.map((b) => ({
    label: b.label,
    amount: b.amount,
    amountMajor: b.amount / factor,
    count: b.count,
  }));

  const getBarColor = (label: string) => {
    switch (label) {
      case "Current":
        return isDark ? "#4ADE80" : "#183B2A";
      case "1-30 Days":
        return "#F59E0B";
      case "31-60 Days":
        return "#EA580C";
      case "61-90 Days":
      case "90+ Days":
        return "#DC2626";
      default:
        return isDark ? "#4ADE80" : "#183B2A";
    }
  };

  const gridColor = isDark ? "#22382B" : "#E2E8E4";
  const textColor = isDark ? "#8CA898" : "#5d7365";

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: textColor, fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: textColor, fontSize: 11 }}
            tickFormatter={(val) => `$${val.toLocaleString()}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-slate-900 dark:bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                    <p className="font-semibold text-slate-300">{item.label}</p>
                    <p className="text-emerald-400 font-mono font-bold">
                      {formatMinorUnits(item.amount, activeCurrency, countryConfig.locale)}
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      {item.count} invoice{item.count === 1 ? "" : "s"}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="amountMajor" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.label)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
