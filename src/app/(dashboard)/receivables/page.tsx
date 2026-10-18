"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/app-context";
import { dataService, reminderService } from "@/services";
import { Customer, Invoice, Reminder } from "@/domain/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CurrencyAmount } from "@/components/finance/currency-amount";
import {
  Users,
  Mail,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatShortDate } from "@/lib/dates";

export default function ReceivablesPage() {
  const { permissions } = useApp();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Reminder Drafting Modal
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [activeDraft, setActiveDraft] = useState<Reminder | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const loadData = async () => {
    try {
      const [custs, invs] = await Promise.all([
        dataService.getCustomers(),
        dataService.getInvoices({ direction: "receivable" }),
      ]);
      setCustomers(custs);
      setInvoices(invs);
    } catch (err) {
      console.error("Error loading receivables:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDraftReminder = async (invoiceId: string) => {
    try {
      const draft = await reminderService.createReminderDraft(invoiceId, 2);
      setActiveDraft(draft);
      setSentSuccess(false);
      setIsReminderModalOpen(true);
    } catch (err) {
      console.error("Draft failed:", err);
    }
  };

  const handleSendReminder = async () => {
    if (!activeDraft) return;
    setIsSending(true);
    try {
      const sent = await reminderService.sendReminderSimulated(activeDraft.id);
      setActiveDraft(sent);
      setSentSuccess(true);
      await loadData();
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slateSurface-200">
        <div>
          <h1 className="text-2xl font-bold text-forest tracking-tight flex items-center gap-2">
            Customers & Receivables
            <Badge variant="outline" size="sm">
              {customers.length} Accounts
            </Badge>
          </h1>
          <p className="text-xs text-brand-700/70 mt-1">
            Customer payment history, reliability scoring, aging status, and targeted collection workflows.
          </p>
        </div>
      </div>

      {/* Customer Accounts Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {customers.map((cust) => {
          const custInvoices = invoices.filter((i) => i.counterpartyId === cust.id);
          const totalOwed = custInvoices.reduce(
            (acc, i) => acc + Math.max(0, i.totalAmount - (i.amountPaid || 0)),
            0
          );
          const overdueInvoices = custInvoices.filter((i) => i.status === "overdue");

          return (
            <Card key={cust.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-brand-900">{cust.name}</h3>
                  <p className="text-xs text-brand-700/70">{cust.email}</p>
                </div>
                <Badge
                  variant={cust.reliabilityScore >= 80 ? "success" : "warning"}
                  size="sm"
                >
                  Reliability: {cust.reliabilityScore}%
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slateSurface-50 rounded-xl text-xs">
                <div>
                  <span className="text-brand-700/60 block">Open Balance</span>
                  <span className="font-mono font-bold text-sm text-brand-900">
                    <CurrencyAmount amount={totalOwed} />
                  </span>
                </div>
                <div>
                  <span className="text-brand-700/60 block">Payment Terms</span>
                  <span className="font-semibold text-brand-900">Net {cust.paymentTermsDays}</span>
                </div>
                <div>
                  <span className="text-brand-700/60 block">Avg Settlement</span>
                  <span className="font-semibold text-brand-900">{cust.avgDaysToPay} Days</span>
                </div>
              </div>

              {/* Invoices for this customer */}
              <div className="space-y-2 pt-2 border-t border-slateSurface-100 text-xs">
                <span className="font-bold text-brand-900 uppercase text-[10px] tracking-wider block">
                  Active Invoices
                </span>
                {custInvoices.map((inv) => {
                  const outstanding = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-2.5 bg-surfaceSubtle border border-slateSurface-200 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-brand-900">
                          <span>{inv.invoiceNumber}</span>
                          <Badge
                            variant={inv.status === "overdue" ? "risk" : "outline"}
                            size="sm"
                          >
                            {inv.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-brand-700/60">
                          Due: {formatShortDate(inv.dueDate)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-brand-900">
                          <CurrencyAmount amount={outstanding} />
                        </span>

                        {inv.status === "overdue" && (
                          <Button
                            variant="lime"
                            size="sm"
                            onClick={() => handleOpenDraftReminder(inv.id)}
                            className="text-[11px] py-1 px-2.5"
                          >
                            <Mail className="w-3 h-3" />
                            Draft Reminder
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Reminder Drafting & Simulated Delivery Modal */}
      {activeDraft && (
        <Modal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          title="Payment Reminder & Settlement Offer"
          description={`Customer: ${activeDraft.customerName} (${activeDraft.customerEmail})`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-forest">Overdue Invoice {activeDraft.invoiceNumber}</span>
                <span className="font-mono font-bold text-forest-action">
                  <CurrencyAmount amount={activeDraft.amountDue} />
                </span>
              </div>
              <p className="text-[11px] text-brand-700/70">
                Offering <strong>2% Prompt Payment Incentive</strong> to accelerate inflow before Oct 21.
              </p>
            </div>

            <div>
              <label className="font-semibold text-brand-900 block mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={activeDraft.subject}
                onChange={(e) => setActiveDraft({ ...activeDraft, subject: e.target.value })}
                className="w-full px-3 py-2 border border-slateSurface-300 rounded-lg text-brand-900 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-brand-900 block mb-1">
                Message Body
              </label>
              <textarea
                rows={6}
                value={activeDraft.body}
                onChange={(e) => setActiveDraft({ ...activeDraft, body: e.target.value })}
                className="w-full p-3 border border-slateSurface-300 rounded-lg text-brand-900 text-xs font-sans leading-relaxed"
              />
            </div>

            {sentSuccess && (
              <div className="p-3 bg-success-50 border border-success-200 rounded-xl text-success-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success-600 shrink-0" />
                <span>
                  <strong>Logged in-app (simulated delivery).</strong> Reminder record saved to audit log.
                </span>
              </div>
            )}

            <div className="pt-4 border-t border-slateSurface-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReminderModalOpen(false)}
              >
                Close
              </Button>

              {!sentSuccess ? (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isSending}
                  disabled={!permissions.canMutateFinancialRecords || isSending}
                  onClick={handleSendReminder}
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Reminder (Simulated)
                </Button>
              ) : (
                <Badge variant="success" size="md">
                  Delivered (Simulated)
                </Badge>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
