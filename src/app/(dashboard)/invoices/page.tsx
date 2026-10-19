"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/app-context";
import { dataService } from "@/services";
import { Invoice, InvoiceDirection } from "@/domain/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { CurrencyAmount } from "@/components/finance/currency-amount";
import {
  FileText,
  Printer,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Eye,
} from "lucide-react";
import { formatShortDate } from "@/lib/dates";
import { parseDecimalToMinorUnits } from "@/lib/money";

export default function InvoicesPage() {
  const { business, activeCurrency, permissions } = useApp();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Payment Recording Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmountStr, setPaymentAmountStr] = useState("");
  const [paymentDate, setPaymentDate] = useState("2026-10-18");

  // Manual Create Invoice Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualInvNum, setManualInvNum] = useState("");
  const [manualCounterparty, setManualCounterparty] = useState("");
  const [manualDirection, setManualDirection] = useState<InvoiceDirection>("receivable");
  const [manualAmountStr, setManualAmountStr] = useState("");
  const [manualDueDate, setManualDueDate] = useState("2026-10-25");
  const [manualDescription, setManualDescription] = useState("");

  // Selected Invoice for Invoice-Style Detail View
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const loadInvoices = React.useCallback(async () => {
    try {
      const list = await dataService.getInvoices({
        direction: directionFilter === "all" ? undefined : (directionFilter as InvoiceDirection),
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setInvoices(list);
    } catch (err) {
      console.error("Error loading invoices:", err);
    }
  }, [directionFilter, statusFilter]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleCreateManualInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCounterparty || !manualAmountStr) return;
    const invNum = manualInvNum.trim() || `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const amtMinor = parseDecimalToMinorUnits(manualAmountStr, activeCurrency);

    try {
      await dataService.createInvoice({
        businessId: business?.id || "biz_default",
        invoiceNumber: invNum,
        counterpartyId: `cp-${Date.now()}`,
        counterpartyName: manualCounterparty,
        direction: manualDirection,
        issueDate: "2026-10-18",
        dueDate: manualDueDate || "2026-10-25",
        totalAmount: amtMinor,
        currency: activeCurrency,
        status: "issued",
        lineItems: [
          {
            id: `li-${Date.now()}`,
            description: manualDescription || (manualDirection === "receivable" ? "Sales Invoice" : "Vendor Bill"),
            quantity: 1,
            unitPrice: amtMinor,
            taxRatePercent: 0,
            subtotal: amtMinor,
            taxAmount: 0,
            total: amtMinor,
          },
        ],
        subtotal: amtMinor,
        taxTotal: 0,
        amountPaid: 0,
      });
      setIsManualModalOpen(false);
      setManualInvNum("");
      setManualCounterparty("");
      setManualAmountStr("");
      setManualDescription("");
      await loadInvoices();
    } catch (err) {
      console.error("Failed to create manual invoice:", err);
    }
  };

  const handleOpenPaymentModal = (inv: Invoice) => {
    setPaymentInvoice(inv);
    const outstanding = (inv.totalAmount - (inv.amountPaid || 0)) / 100;
    setPaymentAmountStr(outstanding.toFixed(2));
    setPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice || !paymentAmountStr) return;
    const payMinor = parseDecimalToMinorUnits(paymentAmountStr, activeCurrency);

    try {
      await dataService.recordInvoicePayment(
        paymentInvoice.id,
        payMinor,
        paymentDate,
        "Settled via invoice management"
      );
      setPaymentModalOpen(false);
      setPaymentInvoice(null);
      await loadInvoices();
    } catch (err) {
      console.error("Payment recording failed:", err);
    }
  };

  const filteredInvoices = invoices.filter((i) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.invoiceNumber.toLowerCase().includes(q) ||
      i.counterpartyName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slateSurface-200">
        <div>
          <h1 className="text-2xl font-bold text-forest tracking-tight">
            Bills & Invoices
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setManualInvNum(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
              setIsManualModalOpen(true);
            }}
            disabled={!permissions.canMutateFinancialRecords}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Invoice / Bill
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-brand-700/50 absolute left-3 top-2.5" />
            <Input
              type="text"
              placeholder="Search by invoice number or counterparty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
            <Select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-full sm:w-44"
              options={[
                { value: "all", label: "All Directions" },
                { value: "receivable", label: "Receivables (Customers)" },
                { value: "payable", label: "Payables (Suppliers)" },
              ]}
            />

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-40"
              options={[
                { value: "all", label: "All Statuses" },
                { value: "issued", label: "Issued (Open)" },
                { value: "overdue", label: "Overdue ⚠️" },
                { value: "partially_paid", label: "Partially Paid" },
                { value: "paid", label: "Paid" },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Invoices List / Table */}
      <Card>
        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slateSurface-200 dark:divide-slate-800">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-brand-700/60 dark:text-slate-400 text-xs">
              No invoices found matching current criteria.
            </div>
          ) : (
            filteredInvoices.map((inv) => {
              const outstanding = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));
              return (
                <div key={inv.id} className="p-4 space-y-3 hover:bg-surface-subtle/50 transition-colors">
                  <div
                    onClick={() => setSelectedInvoice(inv)}
                    className="cursor-pointer space-y-3"
                    title="Click to view full invoice"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono font-bold text-xs text-brand-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{inv.invoiceNumber}</span>
                          <span className="text-[10px] text-forest-action font-sans font-normal hover:underline flex items-center gap-0.5">
                            <Eye className="w-3 h-3" /> View
                          </span>
                        </div>
                        <div className="font-medium text-sm text-brand-900 dark:text-slate-200 mt-0.5">
                          {inv.counterpartyName}
                        </div>
                      </div>
                      <Badge
                        variant={
                          inv.status === "paid"
                            ? "success"
                            : inv.status === "overdue"
                            ? "risk"
                            : inv.status === "partially_paid"
                            ? "warning"
                            : "default"
                        }
                        size="sm"
                      >
                        {inv.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-brand-700/80 dark:text-slate-400">
                      <Badge
                        variant={inv.direction === "receivable" ? "default" : "outline"}
                        size="sm"
                      >
                        {inv.direction === "receivable" ? "RECEIVABLE" : "PAYABLE"}
                      </Badge>
                      <span className="font-mono text-[11px]">
                        Due: {formatShortDate(inv.dueDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slateSurface-100 dark:border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-brand-700/60 dark:text-slate-400 uppercase tracking-wider block">
                          Total
                        </span>
                        <span className="font-mono font-semibold text-xs text-brand-900 dark:text-slate-100">
                          <CurrencyAmount amount={inv.totalAmount} />
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-brand-700/60 dark:text-slate-400 uppercase tracking-wider block">
                          Outstanding
                        </span>
                        <span className="font-mono font-bold text-xs">
                          <CurrencyAmount
                            amount={outstanding}
                            colored={outstanding > 0 && inv.status === "overdue"}
                          />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInvoice(inv)}
                      className="text-xs py-1.5 px-2.5 gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Invoice
                    </Button>
                    {outstanding > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenPaymentModal(inv)}
                        disabled={!permissions.canMutateFinancialRecords}
                        className="text-xs py-1.5 px-3 gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Record Payment
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-brand-700/60">
                    No invoices found matching current criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => {
                  const outstanding = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));
                  return (
                    <TableRow
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className="cursor-pointer hover:bg-surface-subtle/70 transition-colors"
                      title="Click to view full invoice"
                    >
                      <TableCell className="font-mono font-bold text-xs text-brand-900">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell className="font-medium text-brand-900">
                        {inv.counterpartyName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={inv.direction === "receivable" ? "default" : "outline"}
                          size="sm"
                        >
                          {inv.direction === "receivable" ? "RECEIVABLE" : "PAYABLE"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-brand-700">
                        {formatShortDate(inv.dueDate)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            inv.status === "paid"
                              ? "success"
                              : inv.status === "overdue"
                              ? "risk"
                              : inv.status === "partially_paid"
                              ? "warning"
                              : "default"
                          }
                          size="sm"
                        >
                          {inv.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        <CurrencyAmount amount={inv.totalAmount} />
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        <CurrencyAmount
                          amount={outstanding}
                          colored={outstanding > 0 && inv.status === "overdue"}
                        />
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInvoice(inv)}
                            className="text-[11px] py-1 px-2 gap-1"
                            title="View Invoice"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          {outstanding > 0 && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenPaymentModal(inv)}
                              disabled={!permissions.canMutateFinancialRecords}
                              className="text-[11px] py-1 px-2 gap-1"
                            >
                              <CreditCard className="w-3 h-3" />
                              Pay
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Invoice Detail Modal (Invoice Style) */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-xs text-foreground p-1 select-none">
            {/* Top Bar of the Invoice Paper */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 flex items-center justify-center text-lime-accent font-black text-sm shadow-xs">
                  Ø
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    {business?.legalName || business?.name || "Business Entity"}
                  </h3>
                  <p className="text-[11px] text-text-dim">
                    {business?.countryCode === "CN" ? "China (RMB) Registered SME" : "Registered Business"}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <div className="flex items-center gap-2 sm:justify-end">
                  <span className="font-mono font-black text-base tracking-tight text-foreground">
                    {selectedInvoice.invoiceNumber}
                  </span>
                  <Badge
                    variant={
                      selectedInvoice.status === "paid"
                        ? "success"
                        : selectedInvoice.status === "overdue"
                        ? "risk"
                        : selectedInvoice.status === "partially_paid"
                        ? "warning"
                        : "default"
                    }
                    size="sm"
                  >
                    {selectedInvoice.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-[11px] text-text-dim flex items-center gap-2 sm:justify-end">
                  <span>Type: <strong className="text-foreground uppercase">{selectedInvoice.direction}</strong></span>
                  <span>·</span>
                  <span>Currency: <strong className="text-foreground">{selectedInvoice.currency}</strong></span>
                </div>
              </div>
            </div>

            {/* Billing Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-subtle border border-border/80">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim">
                  {selectedInvoice.direction === "receivable" ? "Billed To (Customer)" : "Bill From (Vendor / Supplier)"}
                </span>
                <p className="text-sm font-bold text-foreground">
                  {selectedInvoice.counterpartyName}
                </p>
                <p className="text-[11px] text-text-dim">
                  ID: <span className="font-mono">{selectedInvoice.counterpartyId}</span>
                </p>
              </div>

              <div className="space-y-1 sm:text-right">
                <div className="flex justify-between sm:justify-end gap-3 text-[11px]">
                  <span className="text-text-dim">Issue Date:</span>
                  <span className="font-mono font-medium text-foreground">{formatShortDate(selectedInvoice.issueDate)}</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-3 text-[11px]">
                  <span className="text-text-dim">Payment Due Date:</span>
                  <span className="font-mono font-bold text-foreground">{formatShortDate(selectedInvoice.dueDate)}</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-3 text-[11px]">
                  <span className="text-text-dim">Payment Terms:</span>
                  <span className="font-medium text-foreground">Standard Net 30</span>
                </div>
              </div>
            </div>

            {/* Line Items Table (Invoice Style) */}
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle border-b border-border text-[11px] font-semibold text-text-dim uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 ? (
                    selectedInvoice.lineItems.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-2.5 px-3 font-medium text-foreground">{item.description}</td>
                        <td className="py-2.5 px-3 text-center text-text-dim font-mono">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-text-dim font-mono">
                          <CurrencyAmount amount={item.unitPrice} />
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-foreground font-mono">
                          <CurrencyAmount amount={item.total || item.subtotal} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-3 px-3 font-medium text-foreground">
                        {selectedInvoice.direction === "receivable" ? "Commercial Goods & Services Provided" : "Vendor Supplies & Operational Expense"}
                      </td>
                      <td className="py-3 px-3 text-center text-text-dim font-mono">1</td>
                      <td className="py-3 px-3 text-right text-text-dim font-mono">
                        <CurrencyAmount amount={selectedInvoice.subtotal} />
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-foreground font-mono">
                        <CurrencyAmount amount={selectedInvoice.subtotal} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Balance Due */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pt-2">
              <div className="text-[11px] text-text-dim max-w-xs space-y-1">
                <p className="font-semibold text-foreground">Settlement Status:</p>
                <p>
                  {selectedInvoice.status === "paid"
                    ? "Full settlement confirmed in ledger."
                    : "Outstanding balance due per agreed terms."}
                </p>
              </div>

              <div className="w-full sm:w-64 space-y-1.5 p-3 rounded-xl bg-surface-subtle border border-border">
                <div className="flex justify-between text-xs text-text-dim">
                  <span>Subtotal:</span>
                  <span className="font-mono text-foreground"><CurrencyAmount amount={selectedInvoice.subtotal} /></span>
                </div>
                <div className="flex justify-between text-xs text-text-dim">
                  <span>Tax:</span>
                  <span className="font-mono text-foreground"><CurrencyAmount amount={selectedInvoice.taxTotal} /></span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border/80">
                  <span>Total Amount:</span>
                  <span className="font-mono text-base"><CurrencyAmount amount={selectedInvoice.totalAmount} /></span>
                </div>
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                  <span>Amount Paid:</span>
                  <span className="font-mono"><CurrencyAmount amount={selectedInvoice.amountPaid || 0} /></span>
                </div>
                <div className="flex justify-between text-xs font-bold text-rose-600 dark:text-rose-400 pt-1 border-t border-border/60">
                  <span>Balance Due:</span>
                  <span className="font-mono text-sm">
                    <CurrencyAmount amount={Math.max(0, selectedInvoice.totalAmount - (selectedInvoice.amountPaid || 0))} />
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </Button>

              <div className="flex items-center gap-2">
                {Math.max(0, selectedInvoice.totalAmount - (selectedInvoice.amountPaid || 0)) > 0 && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const inv = selectedInvoice;
                      setSelectedInvoice(null);
                      handleOpenPaymentModal(inv);
                    }}
                    className="gap-1.5 text-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Record Payment
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInvoice(null)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <Modal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title={`Record Payment for ${paymentInvoice.invoiceNumber}`}
          description={`Counterparty: ${paymentInvoice.counterpartyName}`}
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-3 bg-slateSurface-100 rounded-lg flex items-center justify-between">
              <span className="text-brand-700/70">Total Outstanding Balance:</span>
              <span className="font-mono font-bold text-sm text-forest">
                <CurrencyAmount
                  amount={paymentInvoice.totalAmount - (paymentInvoice.amountPaid || 0)}
                />
              </span>
            </div>

            <Input
              label={`Payment Amount (${activeCurrency})`}
              type="number"
              step="0.01"
              value={paymentAmountStr}
              onChange={(e) => setPaymentAmountStr(e.target.value)}
              required
            />

            <Input
              label="Settlement Date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />

            <p className="text-[11px] text-brand-700/60 leading-relaxed">
              Recording this settlement automatically registers a confirmed cash transaction and prevents double counting in liquidity forecasts.
            </p>

            <div className="pt-4 border-t border-slateSurface-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPaymentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Confirm Settlement
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Manual Invoice Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Create New Invoice or Bill"
        description="Add a customer invoice or vendor bill directly without needing to upload files"
      >
        <form onSubmit={handleCreateManualInvoice} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Invoice Number"
              placeholder="e.g. INV-1001"
              value={manualInvNum}
              onChange={(e) => setManualInvNum(e.target.value)}
              required
            />

            <Select
              label="Direction"
              value={manualDirection}
              onChange={(e) => setManualDirection(e.target.value as InvoiceDirection)}
              options={[
                { value: "receivable", label: "Receivable (Customer Invoice)" },
                { value: "payable", label: "Payable (Supplier Bill)" },
              ]}
            />
          </div>

          <Input
            label={manualDirection === "receivable" ? "Customer / Client Name" : "Supplier / Vendor Name"}
            placeholder="e.g. Beijing Technology Corp or Shenzhen Electronics"
            value={manualCounterparty}
            onChange={(e) => setManualCounterparty(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Total Amount (${activeCurrency})`}
              type="number"
              step="0.01"
              placeholder="e.g. 1500.00"
              value={manualAmountStr}
              onChange={(e) => setManualAmountStr(e.target.value)}
              required
            />

            <Input
              label="Payment Due Date"
              type="date"
              value={manualDueDate}
              onChange={(e) => setManualDueDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Description / Purpose (Optional)"
            placeholder="e.g. POS Hardware supplies, consulting, inventory order"
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value)}
          />

          <div className="pt-4 border-t border-slateSurface-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsManualModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save & Register Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
