import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slateSurface-200/80", className)}
      {...props}
    />
  );
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex space-x-1 border-b border-slateSurface-200 overflow-x-auto", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2",
              isActive
                ? "border-forest-action text-brand-900 font-semibold"
                : "border-transparent text-brand-700/70 hover:text-brand-900 hover:border-slateSurface-300"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  isActive
                    ? "bg-forest-action/10 text-forest-action font-semibold"
                    : "bg-slateSurface-100 text-brand-700/60"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
