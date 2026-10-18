"use client";

import React, { useState } from "react";
import { useApp } from "@/context/app-context";
import {
  Search,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Building,
} from "lucide-react";
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

export function Topbar() {
  const {
    business,
    resolvedTheme,
    setTheme,
    countryConfig,
    switchCountryPreset,
    isAuthenticated,
    supabaseUser,
    signOut,
  } = useApp();

  const pathname = usePathname();
  const [showLocaleDropdown, setShowLocaleDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const localePresets = [
    { code: "US", label: "USD ($) — United States" },
    { code: "EU", label: "EUR (€) — Eurozone" },
    { code: "GB", label: "GBP (£) — United Kingdom" },
    { code: "BD", label: "BDT (৳) — Bangladesh" },
    { code: "IN", label: "INR (₹) — India" },
  ];

  const mobileNavLinks = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "AI Assistant", href: "/ai-workspace", icon: Bot },
    { name: "Pending Approvals", href: "/action-center", icon: CheckSquare },
    { name: "Cash Flow & Forecasts", href: "/cash-flow", icon: TrendingUp },
    { name: "Transactions", href: "/transactions", icon: Receipt },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Customers & Receivables", href: "/receivables", icon: Users },
    { name: "Suppliers & Payables", href: "/payables", icon: Building2 },
    { name: "Budgets", href: "/budgets", icon: PieChart },
    { name: "Reports & Insights", href: "/reports", icon: BarChart3 },
    { name: "Activity Log", href: "/audit-logs", icon: History },
    { name: "Team & Permissions", href: "/team", icon: ShieldCheck },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const displayName =
    (supabaseUser as any)?.user_metadata?.full_name ||
    supabaseUser?.name ||
    supabaseUser?.email?.split("@")[0] ||
    "Business Owner";

  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="h-14 bg-surface border-b border-border px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-20">
        {/* Left: Mobile Toggle + Business Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-text-dim hover:text-foreground rounded-lg hover:bg-surface-subtle"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-subtle text-foreground border border-border/60">
            <Building className="w-3.5 h-3.5 text-forest-action" />
            <span className="text-xs font-semibold tracking-tight">
              {business?.name || "My Business"}
            </span>
          </div>
        </div>

        {/* Center: Clean Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-text-dim absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search invoices, customers, transactions..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-surface-subtle border border-border rounded-lg text-foreground placeholder:text-text-dim/60 focus:outline-none focus:border-forest-action transition-colors"
            />
          </div>
        </div>

        {/* Right: Currency Selector, Theme Toggle & User Profile */}
        <div className="flex items-center gap-2">
          {/* Currency / Region Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLocaleDropdown(!showLocaleDropdown);
                setShowUserDropdown(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-foreground bg-surface-subtle border border-border rounded-lg hover:bg-border/30 transition-colors"
            >
              <span>{countryConfig?.defaultCurrency || "USD"}</span>
              <ChevronDown className="w-3 h-3 text-text-dim" />
            </button>

            {showLocaleDropdown && (
              <div className="absolute right-0 top-9 w-52 bg-surface border border-border rounded-xl shadow-lg p-1 z-30 animate-in fade-in">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-text-dim">
                  Select Currency
                </div>
                {localePresets.map((locale) => (
                  <button
                    key={locale.code}
                    onClick={() => {
                      switchCountryPreset(locale.code);
                      setShowLocaleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
                      countryConfig?.code === locale.code
                        ? "bg-forest-action/10 text-forest-action font-semibold"
                        : "text-foreground hover:bg-surface-subtle"
                    }`}
                  >
                    <span>{locale.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-1.5 text-text-dim hover:text-foreground rounded-lg hover:bg-surface-subtle transition-colors"
            aria-label="Toggle Color Theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* User Profile Pill & Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowLocaleDropdown(false);
              }}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg hover:bg-surface-subtle border border-transparent hover:border-border transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-forest-action text-white flex items-center justify-center font-bold text-xs shrink-0">
                {userInitial}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-foreground">
                {displayName}
              </span>
              <ChevronDown className="w-3 h-3 text-text-dim" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 top-10 w-56 bg-surface border border-border rounded-xl shadow-lg p-1.5 z-30 animate-in fade-in">
                <div className="px-3 py-2 border-b border-border/60 mb-1">
                  <div className="text-xs font-semibold text-foreground truncate">{displayName}</div>
                  <div className="text-[11px] text-text-dim truncate">
                    {supabaseUser?.email || "owner@business.com"}
                  </div>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setShowUserDropdown(false)}
                  className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-surface-subtle rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-text-dim" />
                  Workspace Settings
                </Link>

                <div className="border-t border-border/60 my-1" />

                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      signOut();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/sign-in"
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full text-left px-3 py-1.5 text-xs text-forest-action hover:bg-forest-action/10 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    Sign In to Account
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-surface border-r border-border h-full flex flex-col p-4 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-forest flex items-center justify-center text-lime-accent font-black text-sm">
                  Ø
                </div>
                <span className="font-bold text-sm text-foreground">LEDGER ZERO</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-text-dim hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-3 space-y-1">
              {mobileNavLinks.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-forest-action/10 text-forest-action font-semibold"
                        : "text-foreground/80 hover:bg-surface-subtle"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
