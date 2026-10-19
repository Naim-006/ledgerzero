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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-forest tracking-tight">Business Financing</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/cash-flow">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Sliders className="w-4 h-4 text-forest-action" />
              Simulate in Cash Flow
            </Button>
          </Link>
        </div>
      </div>

      {/* Credit & Underwriting Capacity Summary Cards */}
      {eligibility && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Creditworthiness Score</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {eligibility.overallHealthScore} / 100
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Prime Low-Risk SME Profile
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Monthly Sales Revenue</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-foreground mt-1">
              {formatMoney(eligibility.monthlyRevenueCents)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Verified 30-day cash turnover
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Pledgeable Receivables</span>
              <FileText className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl font-bold text-foreground mt-1">
              {formatMoney(eligibility.availableReceivablesCents)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Available for invoice advance
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Inventory Asset Backing</span>
              <Banknote className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-foreground mt-1">
              {formatMoney(eligibility.inventoryValuationCents)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Wholesale collateral backing
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Max Matched Line</span>
              <Sparkles className="w-4 h-4 text-forest" />
            </div>
            <div className="text-xl font-bold text-forest mt-1">
              {formatMoney(eligibility.recommendedFundingCents)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Safe borrowing envelope
            </div>
          </Card>
        </div>
      )}

      {/* Matched Financing Options Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-forest-action" />
            Matched Facilities ({eligibility?.options.length || 0})
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-surface rounded-xl border border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eligibility?.options.map((opt) => {
              const isPreQualified = opt.qualificationStatus === "pre_qualified";

              return (
                <Card
                  key={opt.id}
                  className="p-5 bg-surface border-border flex flex-col justify-between space-y-4 hover:border-forest/40 transition-all shadow-xs"
                >
                  <div className="space-y-3">
                    {/* Header: Title & Match Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-foreground">{opt.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          {opt.providerName}
                        </p>
                      </div>

                      <div className="flex flex-col items-end">
                        <Badge
                          variant="outline"
                          className={
                            isPreQualified
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-bold"
                              : "bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs font-bold"
                          }
                        >
                          {opt.matchScore}% Match
                        </Badge>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {isPreQualified ? "Pre-Qualified" : "Eligible"}
                        </span>
                      </div>
                    </div>

                    {/* Key Financial Terms */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-surface-elevated/70 rounded-xl border border-border/60 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Max Facility</span>
                        <span className="font-extrabold text-foreground text-sm">
                          {formatMoney(opt.maxAmountCents)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Rate / APR</span>
                        <span className="font-extrabold text-foreground text-sm">
                          {opt.interestRateAnnualPercent}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Disbursement</span>
                        <span className="font-medium text-emerald-600 text-xs flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {opt.disbursementTimeframe}
                        </span>
                      </div>
                    </div>

                    {/* Benefit Bullets */}
                    <div className="space-y-1.5 pt-1">
                      {opt.keyBenefits.map((b, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                    <Link
                      href={`/cash-flow?simAmount=${opt.maxAmountCents}&simRate=${opt.interestRateAnnualPercent}`}
                      className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Simulate Impact
                    </Link>

                    <Button
                      size="sm"
                      onClick={() => handleOpenApplyModal(opt)}
                      className="bg-forest-action hover:bg-forest-actionHover text-white text-xs gap-1.5 shadow-xs"
                    >
                      Apply / Pre-Qualify
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
                <h3 className="font-bold text-foreground text-base">Application Task Created!</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  An authorized approval request for {formatMoney(Math.round(parseFloat(requestedAmount) * 100))} has been submitted to the **Pending Approvals** workflow.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <Link href="/action-center">
                  <Button size="sm" className="bg-forest-action hover:bg-forest-actionHover text-white text-xs gap-1.5">
                    Review in Action Center
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
              <div className="p-3 bg-surface-elevated rounded-lg text-xs space-y-1.5 border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-semibold text-foreground">{selectedOption.providerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Benchmark APR / Rate:</span>
                  <span className="font-bold text-foreground">{selectedOption.interestRateAnnualPercent}% p.a.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Repayment Schedule:</span>
                  <span className="capitalize">{selectedOption.repaymentSchedule.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approval Mode:</span>
                  <span className="text-emerald-600 font-medium">Digital Instant Verification (100% Paperless)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Requested Capital Amount ($)
                </label>
                <Input
                  required
                  type="number"
                  min="500"
                  max={(selectedOption.maxAmountCents / 100).toString()}
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                  className="mt-1 text-base font-bold"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Maximum pre-approved envelope:{" "}
                  <span className="font-bold text-foreground">
                    {formatMoney(selectedOption.maxAmountCents)}
                  </span>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-emerald-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Compliance & Governance Guarantee
                </div>
                <p className="text-[11px]">
                  Under competition safety rules, submitting this application will generate a pending owner approval task. No funds or commitments are executed without explicit owner sign-off.
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
                  {submitting ? "Submitting Request..." : "Submit for Owner Approval"}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
