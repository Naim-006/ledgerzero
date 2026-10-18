"use client";

import React from "react";
import { formatMinorUnits } from "@/lib/money";
import { useApp } from "@/context/app-context";
import { cn } from "@/lib/utils";

export interface CurrencyAmountProps {
  amount: number; // minor units
  currency?: string;
  colored?: boolean;
  showSign?: boolean;
  className?: string;
}

export function CurrencyAmount({
  amount,
  currency,
  colored = false,
  showSign = false,
  className,
}: CurrencyAmountProps) {
  const { countryConfig } = useApp();
  const activeCurrency = currency || countryConfig.defaultCurrency;

  const formatted = formatMinorUnits(amount, activeCurrency, countryConfig.locale, {
    showPlusSign: showSign,
  });

  const isPositive = amount > 0;
  const isNegative = amount < 0;

  const colorClass = colored
    ? isPositive
      ? "text-success-700"
      : isNegative
      ? "text-risk-600"
      : "text-brand-900"
    : "";

  return (
    <span
      className={cn("tabular-nums font-mono font-medium tracking-tight", colorClass, className)}
    >
      {formatted}
    </span>
  );
}
