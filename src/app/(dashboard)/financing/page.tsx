"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Banknote,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  Percent,
  Calendar,
  Building2,
  ChevronRight,
  ExternalLink,
  Sliders,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { dataService, actionService } from "@/services";
import { formatMinorUnits } from "@/lib/money";
import { FinancingEligibility, FinancingOption } from "@/domain/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

export default function FinancingPage() {
  const { business } = useApp();
  const formatMoney = (cents: number) => formatMinorUnits(cents, business?.currency || "USD");
  const [eligibility, setEligibility] = useState<FinancingEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<FinancingOption | null>(null);
  const [requestedAmount, setRequestedAmount] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

  useEffect(() => {
    const fetchFinancing = async () => {
      try {
        setLoading(true);
        const data = await dataService.getFinancingMatches();
        setEligibility(data);
      } catch (err) {
        console.error("Failed to load financing matches:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFinancing();
  }, []);

  const handleOpenApplyModal = (opt: FinancingOption) => {
    setSelectedOption(opt);
    setRequestedAmount((opt.maxAmountCents / 100).toFixed(0));
    setActionSuccess(false);
    setIsModalOpen(true);
  };

  const handleCreateApprovalTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption || !eligibility) return;
    setSubmitting(true);
    try {
      const amountCents = Math.round(parseFloat(requestedAmount) * 100);
      await actionService.createActionTask({
        businessId: business?.id || "biz_default",
        type: "apply_sme_financing",
        title: `Apply for ${selectedOption.name} (${formatMoney(amountCents)})`,
        description: `Submit application to ${selectedOption.providerName} for ${formatMoney(amountCents)} at ${selectedOption.interestRateAnnualPercent}% APR (${selectedOption.repaymentSchedule} repayment).`,
        reason: `Working capital injection to strengthen cash flow buffer and support inventory turnover. Match score: ${selectedOption.matchScore}%.`,
        expectedOutcome: `Immediate working capital liquidity injection of ${formatMoney(amountCents)}, extending cash runway by ~45 days.`,
        riskLevel: "medium",
        requiredRole: "Owner",
        status: "pending_approval",
        supportingRecordIds: [selectedOption.id],
        supportingRecordType: "scenario",
        parameters: {
          facilityType: selectedOption.type,
          provider: selectedOption.providerName,
          apr: selectedOption.interestRateAnnualPercent,
          termMonths: selectedOption.termMonths,
          amountCents,
        },
      });

      setActionSuccess(true);
    } catch (err: any) {
      alert(`Failed to create application task: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Business Financing</h1>
          <p className="text-xs text-text-dim mt-0.5">
            Pre-qualified working capital and invoice factoring matched to your shop&apos;s real cash flow
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/cash-flow">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Sliders className="w-3.5 h-3.5 text-forest-action" />
              <span>Simulate in Cash Flow</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Credit & Financing Capacity Summary */}
      {eligibility && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          <Card className="p-3.5 sm:p-4 bg-surface border-border shadow-2xs">
            <div className="flex items-center justify-between text-xs text-text-dim font-medium">
              <span>Credit Health</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {eligibility.overallHealthScore} / 100
            </div>
            <div className="text-[10px] sm:text-[11px] text-text-dim mt-0.5">
              Strong low-risk profile
            </div>
          </Card>

          <Card className="p-3.5 sm:p-4 bg-surface border-border shadow-2xs">
            <div className="flex items-center justify-between text-xs text-text-dim font-medium">
              <span>Monthly Sales</span>
              <TrendingUp className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-foreground mt-1 tabular-nums">
              {formatMoney(eligibility.monthlyRevenueCents)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-text-dim mt-0.5">
              Verified 30-day revenue
            </div>
          </Card>

          <Card className="p-3.5 sm:p-4 bg-surface border-border shadow-2xs">
            <div className="flex items-center justify-between text-xs text-text-dim font-medium">
              <span>Customer Invoices</span>
              <FileText className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-foreground mt-1 tabular-nums">
              {formatMoney(eligibility.availableReceivablesCents)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-text-dim mt-0.5">
              Available for cash advance
            </div>
          </Card>

          <Card className="p-3.5 sm:p-4 bg-surface border-border shadow-2xs">
            <div className="flex items-center justify-between text-xs text-text-dim font-medium">
              <span>Max Pre-Approved</span>
              <Sparkles className="w-4 h-4 text-forest-action" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-forest-action mt-1 tabular-nums">
              {formatMoney(eligibility.recommendedFundingCents)}
            </div>
            <div className="text-[10px] sm:text-[11px] text-text-dim mt-0.5">
              Available borrowing limit
            </div>
          </Card>
        </div>
      )}

      {/* Matched Financing Options Grid */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-forest-action" />
            <span>Available Financing Options ({eligibility?.options.length || 0})</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-56 bg-surface rounded-2xl border border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {eligibility?.options.map((opt) => {
              const isPreQualified = opt.qualificationStatus === "pre_qualified";

              return (
                <Card
                  key={opt.id}
                  className="p-4 sm:p-5 bg-surface border-border flex flex-col justify-between space-y-4 hover:border-forest-action/40 transition-all shadow-2xs rounded-2xl"
                >
                  <div className="space-y-3">
                    {/* Header: Title & Match Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-foreground truncate">{opt.name}</h3>
                        <p className="text-xs text-text-dim mt-0.5 flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-text-dim shrink-0" />
                          <span>{opt.providerName}</span>
                        </p>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <Badge
                          variant="outline"
                          className={
                            isPreQualified
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-bold"
                              : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 text-xs font-bold"
                          }
                        >
                          {opt.matchScore}% Match
                        </Badge>
                        <span className="text-[10px] text-text-dim mt-0.5">
                          {isPreQualified ? "Pre-Qualified" : "Eligible"}
                        </span>
                      </div>
                    </div>

                    {/* Key Financial Terms */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 sm:p-3 bg-surface-subtle rounded-xl border border-border/70 text-xs">
                      <div>
                        <span className="text-[10px] text-text-dim block">Max Amount</span>
                        <span className="font-black text-foreground text-xs sm:text-sm tabular-nums">
                          {formatMoney(opt.maxAmountCents)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-dim block">Interest Rate</span>
                        <span className="font-black text-foreground text-xs sm:text-sm tabular-nums">
                          {opt.interestRateAnnualPercent}% <span className="text-[10px] font-normal text-text-dim">APR</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-dim block">Speed</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="truncate">{opt.disbursementTimeframe}</span>
                        </span>
                      </div>
                    </div>

                    {/* Benefit Bullets in plain English */}
                    <div className="space-y-1.5 pt-0.5">
                      {opt.keyBenefits.map((b, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-text-dim">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                    <Link
                      href={`/cash-flow?simAmount=${opt.maxAmountCents}&simRate=${opt.interestRateAnnualPercent}`}
                      className="text-xs text-text-dim hover:text-foreground font-medium flex items-center gap-1 transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5 text-text-dim" />
                      <span>Simulate</span>
                    </Link>

                    <Button
                      size="sm"
                      onClick={() => handleOpenApplyModal(opt)}
                      className="bg-forest-action hover:bg-forest-actionHover text-white text-xs gap-1.5 shadow-xs"
                    >
                      <span>Apply Online</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Pre-Qualification & Application Modal */}
      {selectedOption && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Apply for ${selectedOption.name}`}
        >
          {actionSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">Application Submitted for Approval</h3>
                <p className="text-xs text-text-dim mt-1 max-w-sm mx-auto leading-relaxed">
                  Your financing request for {formatMoney(Math.round(parseFloat(requestedAmount) * 100))} has been created and sent to your **Pending Approvals** list.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <Link href="/action-center">
                  <Button size="sm" className="bg-forest-action hover:bg-forest-actionHover text-white text-xs gap-1.5">
                    View in Approvals
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateApprovalTask} className="space-y-4">
              <div className="p-3 bg-surface-subtle rounded-xl text-xs space-y-2 border border-border">
                <div className="flex justify-between">
                  <span className="text-text-dim">Provider:</span>
                  <span className="font-semibold text-foreground">{selectedOption.providerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Annual Interest Rate:</span>
                  <span className="font-bold text-foreground">{selectedOption.interestRateAnnualPercent}% APR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Repayment Frequency:</span>
                  <span className="capitalize text-foreground">{selectedOption.repaymentSchedule.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Verification:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% Online & Paperless</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Requested Amount ({business?.currency || "CNY"}) *
                </label>
                <Input
                  required
                  type="number"
                  min="500"
                  max={(selectedOption.maxAmountCents / 100).toString()}
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  className="mt-1 text-base font-bold font-mono"
                />
                <p className="text-[11px] text-text-dim mt-1">
                  Maximum available for this facility:{" "}
                  <strong className="text-foreground">
                    {formatMoney(selectedOption.maxAmountCents)}
                  </strong>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-subtle border border-border text-xs text-text-dim space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Security & Approval Guarantee
                </div>
                <p className="text-[11px] leading-relaxed">
                  Submitting this application creates an approval request for the business owner. No funds or commitments are executed without your final confirmation.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-forest-action hover:bg-forest-actionHover text-white"
                >
                  {submitting ? "Submitting..." : "Submit for Approval"}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
