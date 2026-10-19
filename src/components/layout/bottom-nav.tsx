"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  FileText,
  Banknote,
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "POS", href: "/pos", icon: ShoppingCart },
    { name: "Stock", href: "/inventory", icon: Boxes },
    { name: "Bills", href: "/invoices", icon: FileText },
    { name: "Financing", href: "/financing", icon: Banknote },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur-md border-t border-border z-40 px-2 py-1 flex items-center justify-around shadow-lg select-none">
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 ${
              isActive
                ? "text-forest-action font-bold"
                : "text-text-dim hover:text-foreground"
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                isActive ? "bg-forest-action/10" : ""
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
