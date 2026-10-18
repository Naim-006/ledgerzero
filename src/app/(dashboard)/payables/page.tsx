"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/app-context";
import { dataService } from "@/services";
import { Supplier, Invoice } from "@/domain/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyAmount } from "@/components/finance/currency-amount";
import {
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { formatShortDate } from "@/lib/dates";
import Link from "next/link";

export default function PayablesPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const loadData = async () => {
    try {
      const [supps, invs] = await Promise.all([
        dataService.getSuppliers(),
        dataService.getInvoices({ direction: "payable" }),
      ]);
      setSuppliers(supps);
      setInvoices(invs);
    } catch (err) {
      console.error("Error loading payables:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slateSurface-200">
        <div>
          <h1 className="text-2xl font-bold text-forest tracking-tight flex items-center gap-2">
            Suppliers & Payables
            <Badge variant="outline" size="sm">
              {suppliers.length} Vendors
            </Badge>
          </h1>
          <p className="text-xs text-brand-700/70 mt-1">
            Accounts payable management, vendor criticality ratings, and AI cash preservation schedules.
          </p>
        </div>
      </div>

      {/* AI Schedule Suggestion Strip */}
      <Card className="bg-brand-50/60 border-brand-200 p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-brand-100 rounded-lg text-forest-action shrink-0">
              <Sparkles className="w-5 h-5 text-forest" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-forest">
                  AI Payment Scheduling Optimization Suggestion
                </h4>
                <Badge variant="simulated" size="sm">
                  Simulated
                </Badge>
              </div>
              <p className="text-xs text-brand-800/80 mt-1 leading-relaxed max-w-3xl">
                Pay <strong>Cascade Lumber & Millworks</strong> ($25,000) on time (Oct 21) as they are a critical fulfillment vendor. Defer <strong>Northwest Freight Solutions</strong> ($20,000) by 7 days to preserve working capital through the liquidity dip.
              </p>
            </div>
          </div>

          <Link href="/cash-flow">
            <Button variant="primary" size="sm" className="shrink-0">
              Test in Simulator
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suppliers.map((supp) => {
          const suppInvoices = invoices.filter((i) => i.counterpartyId === supp.id);
          const totalPayable = suppInvoices.reduce(
            (acc, i) => acc + Math.max(0, i.totalAmount - (i.amountPaid || 0)),
            0
          );

          return (
            <Card key={supp.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-brand-900">{supp.name}</h3>
                    {supp.isCritical && (
                      <Badge variant="risk" size="sm">
                        CRITICAL VENDOR
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-brand-700/70 mt-0.5">{supp.email}</p>
                </div>
                <Badge variant="outline" size="sm">
                  Net {supp.paymentTermsDays} Terms
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slateSurface-50 rounded-xl text-xs">
                <div>
                  <span className="text-brand-700/60 block">Open Payables</span>
                  <span className="font-mono font-bold text-sm text-risk-600">
                    <CurrencyAmount amount={totalPayable} />
                  </span>
                </div>
                <div>
                  <span className="text-brand-700/60 block">Expense Category</span>
                  <span className="font-semibold text-brand-900 capitalize">
                    {supp.category.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Vendor Bills */}
              <div className="space-y-2 pt-2 border-t border-slateSurface-100 text-xs">
                <span className="font-bold text-brand-900 uppercase text-[10px] tracking-wider block">
                  Maturing Bills
                </span>
                {suppInvoices.map((inv) => {
                  const outstanding = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-2.5 bg-surfaceSubtle border border-slateSurface-200 rounded-lg"
                    >
                      <div>
                        <div className="font-semibold text-brand-900">{inv.invoiceNumber}</div>
                        <div className="text-[11px] text-brand-700">
                          Due: <strong>{formatShortDate(inv.dueDate)}</strong>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-brand-900 block">
                          <CurrencyAmount amount={outstanding} />
                        </span>
                        <span className="text-[10px] text-brand-700/50">
                          Suggestion only (No payment)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
