"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/app-context";
import { actionService } from "@/services";
import { ActionTask } from "@/domain/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Play,
  Calculator,
} from "lucide-react";
import { formatMinorUnits } from "@/lib/money";

function ActionCenterContent() {
  const searchParams = useSearchParams();
  const { currentMember, currentRole, permissions, activeCurrency, countryConfig } = useApp();

  const [tasks, setTasks] = useState<ActionTask[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<ActionTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editableDiscount, setEditableDiscount] = useState<number>(2.0);

  const loadTasks = useCallback(async () => {
    try {
      const allTasks = await actionService.getActionTasks();
      setTasks(allTasks);

      const queryTaskId = searchParams.get("taskId");
      if (queryTaskId) {
        const found = allTasks.find((t) => t.id === queryTaskId);
        if (found) {
          setSelectedTask(found);
          if (found.parameters?.discountPercent !== undefined) {
            setEditableDiscount(found.parameters.discountPercent);
          }
          setIsModalOpen(true);
        }
      }
    } catch (err) {
      console.error("Error loading action tasks:", err);
    }
  }, [searchParams]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleOpenTask = (task: ActionTask) => {
    setSelectedTask(task);
    if (task.parameters?.discountPercent !== undefined) {
      setEditableDiscount(task.parameters.discountPercent);
    }
    setIsModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedTask || isProcessing) return;
    setIsProcessing(true);
    try {
      selectedTask.parameters.discountPercent = editableDiscount;
      const updated = await actionService.approveActionTask(
        selectedTask.id,
        currentMember?.id || "mem-1",
        currentMember?.name || "Active User",
        `Authorized from Action Center with ${editableDiscount}% prompt-settlement assumption`
      );
      setSelectedTask(updated);
      await loadTasks();
    } catch (err) {
      console.error("Approve failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTask || isProcessing) return;
    setIsProcessing(true);
    try {
      const updated = await actionService.rejectActionTask(
        selectedTask.id,
        currentMember?.id || "mem-1",
        currentMember?.name || "Active User",
        "Rejected by operator in Action Center"
      );
      setSelectedTask(updated);
      await loadTasks();
    } catch (err) {
      console.error("Reject failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedTask || isProcessing) return;
    setIsProcessing(true);
    try {
      const executed = await actionService.executeActionTask(selectedTask.id);
      setSelectedTask(executed);
      await loadTasks();
    } catch (err) {
      console.error("Execute failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeTab === "pending") return t.status === "pending_approval";
    if (activeTab === "approved") return t.status === "approved" || t.status === "executing";
    if (activeTab === "completed") return t.status === "completed";
    if (activeTab === "rejected") return t.status === "rejected" || t.status === "cancelled";
    return true;
  });

  const tabs = [
    { id: "all", label: "All Actions", count: tasks.length },
    {
      id: "pending",
      label: "Pending Approval",
      count: tasks.filter((t) => t.status === "pending_approval").length,
    },
    {
      id: "approved",
      label: "Approved & Executing",
      count: tasks.filter((t) => t.status === "approved" || t.status === "executing").length,
    },
    {
      id: "completed",
      label: "Verified & Completed",
      count: tasks.filter((t) => t.status === "completed").length,
    },
    {
      id: "rejected",
      label: "Rejected / Cancelled",
      count: tasks.filter((t) => t.status === "rejected" || t.status === "cancelled").length,
    },
  ];

  // Dynamic recomputed inflow for Apex invoice ($15k base)
  const baseInvoiceMinor = 1500000;
  const recomputedInflowMinor = baseInvoiceMinor - Math.round(baseInvoiceMinor * (editableDiscount / 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slateSurface-200">
        <div>
          <h1 className="text-2xl font-bold text-forest tracking-tight flex items-center gap-2">
            Action Center
            <Badge variant="simulated" size="sm">
              Simulated Delivery
            </Badge>
          </h1>
          <p className="text-xs text-brand-700/70 mt-1">
            Governed intervention queue: review, authorize, execute, and verify autonomous financial tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" size="sm">
            Observe → Approve → Execute → Verify
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Action Task List */}
      <div className="space-y-3.5">
        {filteredTasks.length === 0 ? (
          <Card className="p-8 text-center text-xs text-brand-700/60">
            No action tasks found in this view.
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="p-5 hover:border-brand-300 transition-all cursor-pointer shadow-card hover:shadow-cardHover"
              onClick={() => handleOpenTask(task)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        task.status === "completed"
                          ? "success"
                          : task.status === "approved"
                          ? "lime"
                          : task.status === "pending_approval"
                          ? "warning"
                          : "default"
                      }
                      size="sm"
                    >
                      {task.status.toUpperCase()} (SIMULATED)
                    </Badge>

                    <Badge
                      variant={task.riskLevel === "high" ? "risk" : "outline"}
                      size="sm"
                    >
                      {task.riskLevel.toUpperCase()} RISK
                    </Badge>

                    <span className="text-[11px] text-brand-700 font-medium">
                      Requires {task.requiredRole}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-brand-900">{task.title}</h3>
                  <p className="text-xs text-brand-700 leading-relaxed max-w-3xl">
                    {task.reason}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Button variant="outline" size="sm">
                    <Eye className="w-3.5 h-3.5" />
                    Inspect Details
                  </Button>
                </div>
              </div>

              {/* Verified Result Strip */}
              {task.verificationResult && (
                <div className="mt-3 pt-3 border-t border-slateSurface-100 flex items-center gap-2 text-xs text-success-700 dark:text-success-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-success-600 dark:text-success-400" />
                  <span className="font-semibold">Verified Result (Simulated):</span>
                  <span className="text-brand-900/80 truncate">
                    {task.verificationResult.message}
                  </span>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Task Inspection & Approval Modal */}
      {selectedTask && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedTask.title}
          description={`Action Task ID: ${selectedTask.id}`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            {/* Status & Risk Pill */}
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  selectedTask.status === "completed"
                    ? "success"
                    : selectedTask.status === "approved"
                    ? "lime"
                    : selectedTask.status === "pending_approval"
                    ? "warning"
                    : "default"
                }
                size="md"
              >
                STATUS: {selectedTask.status.toUpperCase()} (SIMULATED)
              </Badge>
              <Badge variant="outline" size="md">
                RISK: {selectedTask.riskLevel.toUpperCase()}
              </Badge>
              <Badge variant="outline" size="md">
                ROLE: {selectedTask.requiredRole}
              </Badge>
            </div>

            {/* Description & Justification */}
            <div className="p-3.5 bg-slateSurface-50 rounded-xl space-y-2">
              <div>
                <span className="font-bold text-forest uppercase tracking-wider text-[10px] block">
                  Action Scope
                </span>
                <p className="text-brand-900 mt-0.5 leading-relaxed">
                  {selectedTask.description}
                </p>
              </div>

              <div>
                <span className="font-bold text-forest uppercase tracking-wider text-[10px] block">
                  Why Autonomous Intervention Is Proposed
                </span>
                <p className="text-brand-900 mt-0.5 leading-relaxed">
                  {selectedTask.reason}
                </p>
              </div>

              <div>
                <span className="font-bold text-forest uppercase tracking-wider text-[10px] block">
                  Expected Financial Outcome
                </span>
                <p className="text-forest font-semibold mt-0.5 leading-relaxed">
                  {selectedTask.expectedOutcome}
                </p>
              </div>
            </div>

            {/* Editable Assumption if applicable */}
            {selectedTask.status === "pending_approval" && selectedTask.type === "send_payment_reminder" && (
              <div className="p-3.5 bg-brand-50 border border-slateSurface-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-forest-action" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                      Assumption
                    </span>
                  </div>
                  <span className="text-[11px] text-brand-700 font-semibold">
                    Prompt-Settlement Discount
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={editableDiscount}
                      onChange={(e) => setEditableDiscount(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-xs font-mono font-bold bg-surface border border-slateSurface-300 rounded text-brand-900 focus:outline-none focus:ring-1 focus:ring-forest-action"
                    />
                    <span className="text-xs font-bold text-brand-900">%</span>
                  </div>
                  <div className="text-[11px] text-brand-700 font-semibold">
                    Recomputed Inflow: {formatMinorUnits(recomputedInflowMinor, activeCurrency, countryConfig.locale)}
                  </div>
                </div>
              </div>
            )}

            {/* Parameters Preview */}
            <div>
              <span className="font-bold text-brand-900 block mb-1">
                Execution Parameters
              </span>
              <pre className="p-3 bg-slateSurface-100 rounded-lg font-mono text-[11px] text-brand-800 overflow-x-auto">
                {JSON.stringify(selectedTask.parameters, null, 2)}
              </pre>
            </div>

            {/* Verification Result */}
            {selectedTask.verificationResult && (
              <div className="p-3.5 bg-success-50 border border-success-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-success-800 dark:text-success-300">
                  <CheckCircle2 className="w-4 h-4 text-success-600 dark:text-success-400" />
                  Verified Final State (Simulated Delivery)
                </div>
                <p className="text-success-900/80 dark:text-success-200 leading-relaxed">
                  {selectedTask.verificationResult.message}
                </p>
                <div className="text-[11px] text-brand-700 pt-1">
                  Verified at: {selectedTask.verificationResult.verifiedAt}
                </div>
              </div>
            )}

            {/* Role Guard Warning */}
            {!permissions.canApproveActions && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-amber-900 dark:text-amber-200 text-xs">
                ⚠️ Your current role (<strong>{currentRole}</strong>) lacks approval permissions. Switch to <strong>Owner</strong> or <strong>Admin</strong> in the top bar to approve or execute this task.
              </div>
            )}

            {/* Controls */}
            <div className="pt-4 border-t border-slateSurface-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Close Preview
              </Button>

              <div className="flex items-center gap-2">
                {selectedTask.status === "pending_approval" && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={isProcessing}
                      disabled={!permissions.canApproveActions || isProcessing}
                      onClick={handleReject}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isProcessing}
                      disabled={!permissions.canApproveActions || isProcessing}
                      onClick={handleApprove}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Authorize & Approve
                    </Button>
                  </>
                )}

                {selectedTask.status === "approved" && (
                  <Button
                    variant="lime"
                    size="sm"
                    isLoading={isProcessing}
                    disabled={!permissions.canExecuteActions || isProcessing}
                    onClick={handleExecute}
                  >
                    <Play className="w-4 h-4" />
                    Execute Approved Action (Simulated)
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function ActionCenterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-brand-700">Loading Action Center...</div>}>
      <ActionCenterContent />
    </Suspense>
  );
}
