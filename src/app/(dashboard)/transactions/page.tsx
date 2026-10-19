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
  Search,
  Filter,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { formatShortDate } from "@/lib/dates";
import { parseDecimalToMinorUnits, minorUnitsToDecimalString } from "@/lib/money";

export default function TransactionsPage() {
  const { business, activeCurrency, permissions } = useApp();

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
        businessId: business?.id || "biz_default",
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



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Transactions
            <Badge variant="outline" size="sm">
              {totalCount} Total
            </Badge>
          </h1>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Transactions Table (Desktop) & Card List (Mobile) */}
      <Card className="overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
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
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                    No transactions recorded yet. Click &quot;+ Add Transaction&quot; to begin.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs text-text-dim">
                      {formatShortDate(tx.date)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {tx.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" size="sm">
                        {tx.category.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-foreground/80">
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
                        className="p-1 text-muted-foreground hover:text-red-500 disabled:opacity-30 transition-colors"
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
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden divide-y divide-border">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs p-4">
              No transactions recorded yet. Click &quot;+ Add Transaction&quot; to begin.
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-xs text-foreground truncate">{tx.description}</div>
                    <div className="text-[11px] font-mono text-text-dim mt-0.5">
                      {formatShortDate(tx.date)} {tx.counterpartyName ? `• ${tx.counterpartyName}` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm">
                      <CurrencyAmount
                        amount={tx.type === "expense" ? -tx.amount : tx.amount}
                        colored
                        showSign
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Badge variant="outline" size="sm" className="text-[10px]">
                    {tx.category.replace(/_/g, " ")}
                  </Badge>

                  <button
                    onClick={() => handleDeleteTransaction(tx.id)}
                    disabled={!permissions.canMutateFinancialRecords}
                    className="p-1 text-muted-foreground hover:text-red-500 disabled:opacity-30 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
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
    </div>
  );
}
