import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "risk"
    | "lime"
    | "outline"
    | "simulated";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-medium rounded-full border select-none transition-colors";

  const variantStyles = {
    default: "bg-surface-subtle text-foreground border-border",
    success: "bg-success-50 text-success-700 border-success-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    warning: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    risk: "bg-risk-50 text-risk-700 border-risk-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    lime: "bg-lime-accent/25 text-forest-action font-semibold border-lime-accent/50 dark:bg-lime-950/40 dark:text-lime-300 dark:border-lime-700/50",
    outline: "bg-transparent text-foreground border-border",
    simulated: "bg-amber-100/80 text-amber-950 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/60 font-semibold tracking-wide",
  };

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2.5 py-0.5 gap-1.5",
  };

  return (
    <span
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {variant === "simulated" && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
      )}
      {children}
    </span>
  );
}
