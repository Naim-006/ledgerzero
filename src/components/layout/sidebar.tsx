"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  CheckSquare,
  TrendingUp,
  Receipt,
  FileText,
  Users,
  Building2,
  PieChart,
  BarChart3,
  History,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { actionService } from "@/services";
import { useApp } from "@/context/app-context";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { business } = useApp();
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const tasks = await actionService.getActionTasks({ status: "pending_approval" });
        setPendingApprovalsCount(tasks.length);
      } catch {
        // Ignore in unmounted state
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 4000);
    return () => clearInterval(interval);
  }, [pathname]);

  const navigationGroups: NavGroup[] = [
    {
      label: "Dashboard",
      items: [
        { name: "Overview", href: "/", icon: LayoutDashboard },
        { name: "AI Assistant", href: "/ai-workspace", icon: Bot },
        {
          name: "Pending Approvals",
          href: "/action-center",
          icon: CheckSquare,
          badge: pendingApprovalsCount,
        },
        { name: "Cash Flow & Forecasts", href: "/cash-flow", icon: TrendingUp },
      ],
    },
    {
      label: "Finance",
      items: [
        { name: "Transactions", href: "/transactions", icon: Receipt },
        { name: "Invoices", href: "/invoices", icon: FileText },
        { name: "Customers & Receivables", href: "/receivables", icon: Users },
        { name: "Suppliers & Payables", href: "/payables", icon: Building2 },
      ],
    },
    {
      label: "Management",
      items: [
        { name: "Budgets", href: "/budgets", icon: PieChart },
        { name: "Reports & Insights", href: "/reports", icon: BarChart3 },
        { name: "Activity Log", href: "/audit-logs", icon: History },
        { name: "Team & Permissions", href: "/team", icon: ShieldCheck },
        { name: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-forest flex items-center justify-center text-lime-accent font-black text-base shadow-xs shrink-0">
          Ø
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight text-foreground">
            LEDGER ZERO
          </div>
          <div className="text-[10px] font-medium text-text-dim">
            Financial Operating System
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-dim/80">
              {group.label}
            </div>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors group",
                      isActive
                        ? "bg-forest-action/10 text-forest-action font-semibold dark:bg-forest-action/20"
                        : "text-foreground/80 hover:bg-surface-subtle hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive
                            ? "text-forest-action"
                            : "text-text-dim group-hover:text-foreground"
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white min-w-[18px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Clean Live Status Footer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-surface-subtle border border-border/60">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-foreground truncate">
              {business?.name || "Production Ledger"}
            </div>
            <div className="text-[10px] text-text-dim truncate">
              Live & Synchronized
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
