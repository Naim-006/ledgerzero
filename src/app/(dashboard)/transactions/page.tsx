"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/app-context";
import { dataService } from "@/services";
import { Transaction, TransactionType, TransactionCategory } from "@/domain/types";
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
  Receipt,
  Plus,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";
import { formatShortDate } from "@/lib/dates";
import { parseDecimalToMinorUnits, minorUnitsToDecimalString } from "@/lib/money";
import Papa from "papaparse";

export default function TransactionsPage() {
  const { activeCurrency, permissions } = useApp();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // New Transaction Form Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [date, setDate] = useState("2026-10-18");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TransactionType>("income");
  const [category, setCategory] = useState<TransactionCategory>("revenue_sales");
  const [amountStr, setAmountStr] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");

  // CSV Import Modal & State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvPreviewRows, setCsvPreviewRows] = useState<any[]>([]);
  const [csvResult, setCsvResult] = useState<{ imported: number; duplicates: number } | null>(null);

  const loadTransactions = React.useCallback(async () => {
    try {
      const { transactions: list, total } = await dataService.getTransactions({
        search: searchQuery,
        type: typeFilter,
        category: categoryFilter,
      });
      setTransactions(list);
      setTotalCount(total);
    } catch (err) {
      console.error("Error loading transactions:", err);
    }
  }, [searchQuery, typeFilter, categoryFilter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amountStr) return;

    const amountMinor = parseDecimalToMinorUnits(amountStr, activeCurrency);

    try {
      await dataService.createTransaction({
        businessId: "biz_harbor_pine",
        date,
        description,
        type,
        category,
        amount: amountMinor,
        currency: activeCurrency,
        counterpartyName: counterpartyName || undefined,
        isSettled: true,
      });
      setIsAddModalOpen(false);
      setDescription("");
      setAmountStr("");
      setCounterpartyName("");
      await loadTransactions();
    } catch (err) {
      console.error("Failed to create transaction:", err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction record?")) return;
    try {
      await dataService.deleteTransaction(id);
      await loadTransactions();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvPreviewRows(results.data);
      },
    });
  };

  const handleCommitCsv = async () => {
    if (csvPreviewRows.length === 0) return;

    const parsedTxs: Omit<Transaction, "id" | "createdAt">[] = csvPreviewRows.map(
      (row) => {
        const rowAmount = row.amount || row.Amount || row.Total || "0";
        const minor = parseDecimalToMinorUnits(rowAmount.toString(), activeCurrency);
        const rowType: TransactionType =
          row.type?.toLowerCase() === "expense" ? "expense" : "income";

        return {
          businessId: "biz_harbor_pine",
          date: row.date || row.Date || "2026-10-18",
          description: row.description || row.Description || "Imported transaction",
          type: rowType,
          category: (row.category as TransactionCategory) || "other",
          amount: Math.abs(minor),
          currency: activeCurrency,
          counterpartyName: row.counterparty || row.Counterparty || undefined,
          isSettled: true,
        };
      }
    );

    try {
      const res = await dataService.importTransactionsCsv(parsedTxs);
      setCsvResult({ imported: res.importedCount, duplicates: res.duplicateCount });
      await loadTransactions();
    } catch (err) {
      console.error("CSV import commit failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slateSurface-200">
        <div>
          <h1 className="text-2xl font-bold text-forest tracking-tight flex items-center gap-2">
            Transactions Ledger
            <Badge variant="outline" size="sm">
              {totalCount} Total
            </Badge>
          </h1>
          <p className="text-xs text-brand-700/70 mt-1">
            Confirmed financial records driving the deterministic liquidity calculations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCsvPreviewRows([]);
              setCsvResult(null);
              setIsCsvModalOpen(true);
            }}
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            disabled={!permissions.canMutateFinancialRecords}
          >
            <Plus className="w-4 h-4" />
            Add Transaction
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
              placeholder="Search by description or counterparty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-36"
              options={[
                { value: "all", label: "All Types" },
                { value: "income", label: "Income (+)" },
                { value: "expense", label: "Expense (-)" },
              ]}
            />

            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-48"
              options={[
                { value: "all", label: "All Categories" },
                { value: "revenue_sales", label: "Sales Revenue" },
                { value: "revenue_services", label: "Services Revenue" },
                { value: "operating_rent", label: "Rent / Facilities" },
                { value: "operating_utilities", label: "Utilities & Tech" },
                { value: "operating_cogs", label: "Cost of Goods" },
                { value: "operating_logistics", label: "Logistics & Freight" },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-brand-700/60">
                  No transactions match the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-xs text-brand-700">
                    {formatShortDate(tx.date)}
                  </TableCell>
                  <TableCell className="font-medium text-brand-900">
                    {tx.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {tx.category.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-brand-800">
                    {tx.counterpartyName || "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    <CurrencyAmount
                      amount={tx.type === "expense" ? -tx.amount : tx.amount}
                      colored
                      showSign
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleDeleteTransaction(tx.id)}
                      disabled={!permissions.canMutateFinancialRecords}
                      className="p-1 text-brand-700/40 hover:text-risk-600 disabled:opacity-30 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record New Transaction"
        description="Add a confirmed bank or ledger transaction"
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4 text-xs">
          <Input
            label="Transaction Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            label="Description"
            placeholder="e.g. Supplier wire payment or client invoice deposit"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Transaction Type"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              options={[
                { value: "income", label: "Income (Inflow)" },
                { value: "expense", label: "Expense (Outflow)" },
              ]}
            />

            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              options={[
                { value: "revenue_sales", label: "Sales Revenue" },
                { value: "revenue_services", label: "Services Revenue" },
                { value: "operating_rent", label: "Facility Rent" },
                { value: "operating_utilities", label: "Utilities / SaaS" },
                { value: "operating_cogs", label: "Cost of Goods Sold" },
                { value: "operating_logistics", label: "Logistics / Freight" },
                { value: "other", label: "Other Operating" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Amount (${activeCurrency})`}
              type="number"
              step="0.01"
              placeholder="e.g. 1500.00"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              required
            />

            <Input
              label="Counterparty (Optional)"
              placeholder="e.g. Apex Retail Partners"
              value={counterpartyName}
              onChange={(e) => setCounterpartyName(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-slateSurface-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Transaction
            </Button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Import Transactions via CSV"
        description="Upload a CSV export from your bank or ERP with automatic duplicate detection"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          {!csvResult && (
            <div className="p-6 border-2 border-dashed border-slateSurface-300 rounded-xl text-center space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-forest-action mx-auto" />
              <div>
                <p className="font-semibold text-brand-900">Choose CSV File to Upload</p>
                <p className="text-[11px] text-brand-700/60 mt-0.5">
                  Expected columns: Date, Description, Amount, Type (income/expense), Category
                </p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvFileUpload}
                className="block mx-auto text-xs text-brand-700 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slateSurface-100 file:text-forest hover:file:bg-slateSurface-200 cursor-pointer"
              />
            </div>
          )}

          {csvPreviewRows.length > 0 && !csvResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-900">
                  Preview ({csvPreviewRows.length} rows parsed)
                </span>
                <span className="text-[11px] text-brand-700/60">
                  Checking for duplicate records against existing ledger...
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-slateSurface-200 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvPreviewRows.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{row.date || row.Date || "2026-10-18"}</TableCell>
                        <TableCell>{row.description || row.Description || "—"}</TableCell>
                        <TableCell className="font-mono">{row.amount || row.Amount || "0"}</TableCell>
                        <TableCell>{row.type || row.Type || "income"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {csvResult && (
            <div className="p-4 bg-success-50 border border-success-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-success-800">
                <CheckCircle2 className="w-5 h-5 text-success-600" />
                CSV Import Completed
              </div>
              <p className="text-success-900/80 leading-relaxed">
                Successfully committed <strong>{csvResult.imported}</strong> new transactions into the ledger.
                {csvResult.duplicates > 0 && (
                  <span>
                    {" "}<strong>{csvResult.duplicates}</strong> duplicate records were identified and ignored.
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slateSurface-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCsvModalOpen(false)}
            >
              Close
            </Button>
            {csvPreviewRows.length > 0 && !csvResult && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleCommitCsv}
                disabled={!permissions.canMutateFinancialRecords}
              >
                Commit {csvPreviewRows.length} Rows to Ledger
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
