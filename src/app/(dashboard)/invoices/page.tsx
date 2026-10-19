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
  Upload,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
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

  // Optional OCR Upload Modal (Secondary)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    invoiceNumber: string;
    counterpartyName: string;
    direction: InvoiceDirection;
    totalAmountStr: string;
    dueDate: string;
    confidence: number;
    fieldsConfidence: Record<string, number>;
  } | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Type and size validation
    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Invalid format: Please upload a PDF, PNG, or JPEG file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    setUploadedFile(file);
    setIsExtracting(true);

    // Simulate OCR Extraction with high fidelity confidence metrics
    setTimeout(() => {
      setExtractedData({
        invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        counterpartyName: "Pacific Coast Timber Co.",
        direction: "payable",
        totalAmountStr: "8500.00",
        dueDate: "2026-11-05",
        confidence: 96,
        fieldsConfidence: {
          invoiceNumber: 99,
          counterpartyName: 94,
          totalAmount: 98,
          dueDate: 92,
        },
      });
      setIsExtracting(false);
    }, 1200);
  };

  const handleCommitExtracted = async () => {
    if (!extractedData) return;
    const amountMinor = parseDecimalToMinorUnits(extractedData.totalAmountStr, activeCurrency);

    try {
      await dataService.createInvoice({
        businessId: business?.id || "biz_default",
        direction: extractedData.direction,
        invoiceNumber: extractedData.invoiceNumber,
        counterpartyId: "supp-new",
        counterpartyName: extractedData.counterpartyName,
        issueDate: "2026-10-18",
        dueDate: extractedData.dueDate,
        status: "issued",
        currency: activeCurrency,
        lineItems: [
          {
            id: `li-${Date.now()}`,
            description: "Extracted Line Items (Verified by Operator)",
            quantity: 1,
            unitPrice: amountMinor,
            taxRatePercent: 0,
            subtotal: amountMinor,
            taxAmount: 0,
            total: amountMinor,
          },
        ],
        subtotal: amountMinor,
        taxTotal: 0,
        totalAmount: amountMinor,
        amountPaid: 0,
        extractionConfidence: extractedData.confidence,
      });

      setIsUploadModalOpen(false);
      setUploadedFile(null);
      setExtractedData(null);
      await loadInvoices();
    } catch (err) {
      console.error("Failed to commit invoice:", err);
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setUploadedFile(null);
              setExtractedData(null);
              setIsUploadModalOpen(true);
            }}
            disabled={!permissions.canMutateFinancialRecords}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
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

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-44"
              options={[
                { value: "all", label: "All Directions" },
                { value: "receivable", label: "Receivables (Customers)" },
                { value: "payable", label: "Payables (Suppliers)" },
              ]}
            />

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
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
                <div key={inv.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono font-bold text-xs text-brand-900 dark:text-slate-100">
                        {inv.invoiceNumber}
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

                  {outstanding > 0 && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenPaymentModal(inv)}
                        disabled={!permissions.canMutateFinancialRecords}
                        className="text-xs py-1.5 px-3 w-full sm:w-auto justify-center"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Record Payment
                      </Button>
                    </div>
                  )}
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
                <TableHead className="w-24"></TableHead>
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
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono font-bold text-xs text-brand-900">
                        {inv.invoiceNumber}
                        {inv.extractionConfidence && (
                          <span className="block text-[10px] text-brand-700/60 font-normal">
                            OCR: {inv.extractionConfidence}%
                          </span>
                        )}
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
                      <TableCell className="text-right">
                        {outstanding > 0 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenPaymentModal(inv)}
                            disabled={!permissions.canMutateFinancialRecords}
                            className="text-[11px] py-1 px-2"
                          >
                            <CreditCard className="w-3 h-3" />
                            Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Smart Invoice & Receipt Upload & Review Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Smart Invoice & Receipt Ingestion"
        description="Upload invoice PDF or receipt image for automated data extraction and human verification"
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs">
          {!uploadedFile && (
            <div className="p-8 border-2 border-dashed border-slateSurface-300 rounded-xl text-center space-y-2">
              <Upload className="w-8 h-8 text-forest-action mx-auto" />
              <div>
                <p className="font-semibold text-brand-900">Upload Invoice / Receipt (PDF / PNG / JPEG)</p>
                <p className="text-[11px] text-brand-700/60 mt-0.5">
                  Max file size: 10MB. Automated parser extracts vendor, amount, line items, and due date.
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                className="block mx-auto text-xs text-brand-700 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slateSurface-100 file:text-forest hover:file:bg-slateSurface-200 cursor-pointer"
              />
            </div>
          )}

          {isExtracting && (
            <div className="p-8 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-lime-accent mx-auto animate-spin" />
              <p className="font-semibold text-brand-900">Running AI document parser...</p>
              <p className="text-[11px] text-brand-700/60">
                Extracting metadata, line items, tax totals, and due date.
              </p>
            </div>
          )}

          {extractedData && (
            <div className="space-y-3">
              <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest-action" />
                  <span className="font-semibold text-forest">
                    Automated Extraction Completed ({extractedData.confidence}% Confidence)
                  </span>
                </div>
                <Badge variant="lime" size="sm">
                  AI Parsed
                </Badge>
              </div>

              {/* Duplicate Warning check */}
              {invoices.some((i) => i.invoiceNumber === extractedData.invoiceNumber) && (
                <div className="p-2.5 bg-warning-50 border border-warning-200 rounded-lg text-warning-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warning-600 shrink-0" />
                  <span>Warning: An invoice with number {extractedData.invoiceNumber} already exists in the ledger.</span>
                </div>
              )}

              {/* Editable Fields with Per-Field Confidence */}
              <div className="space-y-3 p-4 bg-slateSurface-50 rounded-xl">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-brand-900">Invoice Number</span>
                    <Badge variant="success" size="sm">
                      {extractedData.fieldsConfidence.invoiceNumber}% confidence
                    </Badge>
                  </div>
                  <Input
                    value={extractedData.invoiceNumber}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, invoiceNumber: e.target.value })
                    }
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-brand-900">Counterparty Name</span>
                    <Badge variant="success" size="sm">
                      {extractedData.fieldsConfidence.counterpartyName}% confidence
                    </Badge>
                  </div>
                  <Input
                    value={extractedData.counterpartyName}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, counterpartyName: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-brand-900">Total Amount</span>
                      <Badge variant="success" size="sm">
                        {extractedData.fieldsConfidence.totalAmount}% confidence
                      </Badge>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={extractedData.totalAmountStr}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, totalAmountStr: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-brand-900">Due Date</span>
                      <Badge variant="success" size="sm">
                        {extractedData.fieldsConfidence.dueDate}% confidence
                      </Badge>
                    </div>
                    <Input
                      type="date"
                      value={extractedData.dueDate}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, dueDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slateSurface-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            {extractedData && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleCommitExtracted}
                disabled={!permissions.canMutateFinancialRecords}
              >
                Save Bill to System
              </Button>
            )}
          </div>
        </div>
      </Modal>

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
