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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Pending Approvals & Actions
            <Badge variant="outline" size="sm" className="text-xs">
              Owner Sign-off Gate
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Review and approve automated financial decisions before they take effect. You have full control.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Action Task List */}
      <div className="space-y-3.5">
        {filteredTasks.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted-foreground">
            No action tasks found in this view.
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="p-5 hover:border-forest/40 transition-all cursor-pointer shadow-xs"
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
                      {task.status.replace(/_/g, " ").toUpperCase()}
                    </Badge>

                    <Badge
                      variant={task.riskLevel === "high" ? "risk" : "outline"}
                      size="sm"
                    >
                      {task.riskLevel.toUpperCase()} RISK
                    </Badge>

                    <span className="text-[11px] text-muted-foreground font-medium">
                      Owner Decision
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-foreground">{task.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                    {task.reason}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Button variant="outline" size="sm">
                    <Eye className="w-3.5 h-3.5" />
                    Review Details
                  </Button>
                </div>
              </div>

              {/* Verified Result Strip */}
              {task.verificationResult && (
                <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-2 text-xs text-emerald-600">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span className="font-semibold">Completed:</span>
                  <span className="text-foreground/80 truncate">
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
            {selectedTask.parameters && Object.keys(selectedTask.parameters).length > 0 && (
              <div>
                <span className="font-bold text-foreground text-xs block mb-1.5">
                  Action Details & Settings
                </span>
                <div className="p-3 bg-surface-elevated rounded-lg border border-border/60 text-xs space-y-1">
                  {Object.entries(selectedTask.parameters).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1")}:</span>
                      <span className="font-semibold text-foreground">
                        {typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Result */}
            {selectedTask.verificationResult && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Action Completed & Recorded
                </div>
                <p className="text-foreground/90 text-xs leading-relaxed">
                  {selectedTask.verificationResult.message}
                </p>
                <div className="text-[11px] text-muted-foreground pt-1">
                  Completed on: {new Date(selectedTask.verificationResult.verifiedAt).toLocaleString()}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
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
                      disabled={isProcessing}
                      onClick={handleReject}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isProcessing}
                      disabled={isProcessing}
                      onClick={handleApprove}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Authorize
                    </Button>
                  </>
                )}

                {selectedTask.status === "approved" && (
                  <Button
                    variant="lime"
                    size="sm"
                    isLoading={isProcessing}
                    disabled={isProcessing}
                    onClick={handleExecute}
                  >
                    <Play className="w-4 h-4" />
                    Execute Approved Action
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
