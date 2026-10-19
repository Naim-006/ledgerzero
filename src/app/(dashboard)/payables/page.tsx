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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-forest tracking-tight">
            Payables
          </h1>
        </div>
      </div>

      {/* Supplier Cards */}
      {suppliers.length === 0 ? (
        <Card className="p-10 text-center border-dashed border-border text-xs text-text-dim">
          <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h3 className="font-bold text-foreground text-sm">No supplier bills yet</h3>
          <p className="mt-1 max-w-sm mx-auto">
            When you enter bills or invoices from your suppliers, their due dates and payment schedules will appear here.
          </p>
        </Card>
      ) : (
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
      )}
    </div>
  );
}
