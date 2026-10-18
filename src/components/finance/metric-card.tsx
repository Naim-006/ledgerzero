"use client";

import React from "react";
import { CurrencyAmount } from "./currency-amount";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  title: string;
  amount: number; // minor units
  currency?: string;
  definition?: string;
  period?: string;
  source?: string;
  href?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "risk" | "warning" | "success";
  className?: string;
}

export function MetricCard({
  title,
  amount,
  currency,
  href,
  trend,
  period,
  variant = "default",
  className,
}: MetricCardProps) {
  const variantStyles = {
    default: "border-border bg-surface hover:border-forest/40",
    risk: "border-risk-200/80 bg-risk-50/15 dark:bg-risk-900/10 hover:border-risk-400",
    warning: "border-warning-200/80 bg-warning-50/15 dark:bg-warning-900/10 hover:border-warning-400",
    success: "border-success-200/80 bg-success-50/15 dark:bg-success-900/10 hover:border-success-400",
  };

  const content = (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-all duration-150 card-hover select-none",
        variantStyles[variant],
        className
      )}
    >
      {/* Top Header: Title & Optional Trend Pill */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">
          {title}
        </span>
        {trend && (
          <span
            className={cn(
              "text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums",
              trend.isPositive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {/* Main Big Number */}
      <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
        <CurrencyAmount amount={amount} currency={currency} />
      </div>

      {/* Clean Single Subtitle line */}
      {period && (
        <div className="mt-2 text-xs text-text-dim/80">
          {period}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}
