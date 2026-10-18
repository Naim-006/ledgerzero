import { ActionService } from "../contracts";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ActionTask, ActionStatus, ActionRiskLevel, Role } from "@/domain/types";

export class SupabaseActionService implements ActionService {
  private activeBusinessId: string | null = null;

  private async getClient() {
    return getSupabaseClient();
  }

  private async getActiveBusinessId(): Promise<string> {
    if (this.activeBusinessId) return this.activeBusinessId;

    const sb = await this.getClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return "00000000-0000-0000-0000-000000000000";

    const { data: bizList } = await sb
      .from("businesses")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1);

    if (bizList && bizList.length > 0) {
      this.activeBusinessId = bizList[0].id;
      return bizList[0].id;
    }

    return "00000000-0000-0000-0000-000000000000";
  }

  async getActionTasks(params?: { status?: string }): Promise<ActionTask[]> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    let query = sb
      .from("action_tasks")
      .select("*")
      .eq("business_id", bizId)
      .order("created_at", { ascending: false });

    if (params?.status && params.status !== "all") {
      query = query.eq("status", params.status);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((t: any) => ({
      id: t.id,
      businessId: t.business_id,
      type: (t.task_type || "send_payment_reminder") as any,
      title: t.title,
      description: t.description,
      reason: t.reason,
      expectedOutcome: t.expected_outcome || "",
      riskLevel: (t.risk_level || "medium") as ActionRiskLevel,
      requiredRole: (t.required_role === "owner" ? "Owner" : "Admin") as Role,
      status: (t.status || "pending_approval") as ActionStatus,
      supportingRecordIds: t.parameters?.invoiceId ? [t.parameters.invoiceId] : [],
      supportingRecordType: "invoice" as const,
      parameters: t.parameters || {},
      createdAt: t.created_at,
      updatedAt: t.created_at,
    }));
  }

  async getActionTaskById(id: string): Promise<ActionTask | null> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("action_tasks")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      businessId: data.business_id,
      type: (data.task_type || "send_payment_reminder") as any,
      title: data.title,
      description: data.description,
      reason: data.reason,
      expectedOutcome: data.expected_outcome || "",
      riskLevel: (data.risk_level || "medium") as ActionRiskLevel,
      requiredRole: (data.required_role === "owner" ? "Owner" : "Admin") as Role,
      status: (data.status || "pending_approval") as ActionStatus,
      supportingRecordIds: data.parameters?.invoiceId ? [data.parameters.invoiceId] : [],
      supportingRecordType: "invoice" as const,
      parameters: data.parameters || {},
      createdAt: data.created_at,
      updatedAt: data.created_at,
    };
  }

  async createActionTask(
    task: Omit<ActionTask, "id" | "createdAt" | "updatedAt">
  ): Promise<ActionTask> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();
    const { data: { user } } = await sb.auth.getUser();

    const payload = {
      business_id: bizId,
      title: task.title,
      description: task.description,
      reason: task.reason,
      expected_outcome: task.expectedOutcome,
      task_type: task.type,
      risk_level: task.riskLevel,
      required_role: task.requiredRole.toLowerCase(),
      status: "pending_approval",
      impact_amount_cents: task.parameters?.discountAmount || 0,
      parameters: task.parameters || {},
      created_by: user?.id || null,
    };

    const { data, error } = await sb.from("action_tasks").insert(payload).select().single();
    if (error) throw new Error(error.message);

    // Audit Log
    await sb.from("audit_logs").insert({
      business_id: bizId,
      user_id: user?.id || null,
      actor_name: "AI Autonomous Agent",
      actor_type: "agent",
      action: "PROPOSED_ACTION_TASK",
      entity_type: "ActionTask",
      entity_id: data.id,
      details: `Generated proposal: "${task.title}". Awaiting human owner authorization.`,
    });

    return (await this.getActionTaskById(data.id))!;
  }

  async approveActionTask(
    taskId: string,
    memberId: string,
    memberName: string,
    reason?: string
  ): Promise<ActionTask> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();
    const { data: { user } } = await sb.auth.getUser();

    const task = await this.getActionTaskById(taskId);
    if (!task) throw new Error("Action task not found");

    await sb
      .from("action_tasks")
      .update({
        status: "approved",
        approved_by: user?.id || null,
        approved_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    // Audit log
    await sb.from("audit_logs").insert({
      business_id: bizId,
      user_id: user?.id || null,
      actor_name: memberName || "Shop Owner",
      actor_type: "user",
      action: "APPROVED_ACTION_TASK",
      entity_type: "ActionTask",
      entity_id: taskId,
      details: `Authorized task: "${task.title}". Reason: ${reason || "Verified and confirmed"}.`,
    });

    return (await this.getActionTaskById(taskId))!;
  }

  async rejectActionTask(
    taskId: string,
    memberId: string,
    memberName: string,
    reason?: string
  ): Promise<ActionTask> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();
    const { data: { user } } = await sb.auth.getUser();

    await sb
      .from("action_tasks")
      .update({
        status: "rejected",
      })
      .eq("id", taskId);

    await sb.from("audit_logs").insert({
      business_id: bizId,
      user_id: user?.id || null,
      actor_name: memberName || "Shop Owner",
      actor_type: "user",
      action: "REJECTED_ACTION_TASK",
      entity_type: "ActionTask",
      entity_id: taskId,
      details: `Declined task: ${reason || "Not approved by owner"}.`,
    });

    return (await this.getActionTaskById(taskId))!;
  }

  async executeActionTask(taskId: string): Promise<ActionTask> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();
    const { data: { user } } = await sb.auth.getUser();

    const task = await this.getActionTaskById(taskId);
    if (!task) throw new Error("Action task not found");

    // Strict security check: MUST be approved prior to execution
    if (task.status !== "approved") {
      throw new Error(`Cannot execute task with status '${task.status}'. Explicit owner approval is required.`);
    }

    // Execute side-effect depending on task type
    if ((task.type as string) === "reschedule_supplier_payment" && task.parameters?.targetInvoiceId) {
      const shiftDays = task.parameters?.shiftDays || 14;
      const { data: inv } = await sb.from("invoices").select("due_date").eq("id", task.parameters.targetInvoiceId).maybeSingle();
      if (inv) {
        const currentDue = new Date(inv.due_date);
        currentDue.setDate(currentDue.getDate() + shiftDays);
        const newDue = currentDue.toISOString().split("T")[0];
        await sb.from("invoices").update({ due_date: newDue }).eq("id", task.parameters.targetInvoiceId);
      }
    }

    await sb
      .from("action_tasks")
      .update({
        status: "executed",
      })
      .eq("id", taskId);

    await sb.from("audit_logs").insert({
      business_id: bizId,
      user_id: user?.id || null,
      actor_name: "Workflow Engine",
      actor_type: "system",
      action: "EXECUTED_ACTION_TASK",
      entity_type: "ActionTask",
      entity_id: taskId,
      details: `Successfully executed: "${task.title}". State transition completed.`,
    });

    return (await this.getActionTaskById(taskId))!;
  }

  async cancelActionTask(taskId: string, reason: string): Promise<ActionTask> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    await sb.from("action_tasks").update({ status: "cancelled" }).eq("id", taskId);

    await sb.from("audit_logs").insert({
      business_id: bizId,
      actor_name: "Shop Owner",
      actor_type: "user",
      action: "CANCELLED_ACTION_TASK",
      entity_type: "ActionTask",
      entity_id: taskId,
      details: `Cancelled task: ${reason}`,
    });

    return (await this.getActionTaskById(taskId))!;
  }
}
