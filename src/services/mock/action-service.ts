import { ActionService } from "../contracts";
import { mockStore, simulateDelay } from "./store";
import { ActionTask, Approval, Reminder } from "@/domain/types";
import { mockDataService } from "./data-service";
import { addDaysToDate } from "@/lib/dates";

export class MockActionService implements ActionService {
  async getActionTasks(params?: { status?: string }): Promise<ActionTask[]> {
    await simulateDelay();
    let tasks = [...mockStore.getState().actionTasks];
    if (params?.status && params.status !== "all") {
      tasks = tasks.filter((t) => t.status === params.status);
    }
    return tasks;
  }

  async getActionTaskById(id: string): Promise<ActionTask | null> {
    await simulateDelay();
    return mockStore.getState().actionTasks.find((t) => t.id === id) || null;
  }

  async createActionTask(taskData: Omit<ActionTask, "id" | "createdAt" | "updatedAt">): Promise<ActionTask> {
    await simulateDelay();
    const newTask: ActionTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockStore.addActionTask(newTask);

    await mockDataService.logEvent({
      businessId: newTask.businessId,
      actorType: "agent",
      actorName: "Autonomous Financial Agent",
      action: "PROPOSED_ACTION_TASK",
      targetType: "ActionTask",
      targetId: newTask.id,
      details: `Generated action proposal: "${newTask.title}" [Risk: ${newTask.riskLevel.toUpperCase()}].`,
    });

    return newTask;
  }

  async approveActionTask(
    taskId: string,
    memberId: string,
    memberName: string,
    reason?: string
  ): Promise<ActionTask> {
    await simulateDelay();
    const task = await this.getActionTaskById(taskId);
    if (!task) throw new Error("Task not found");

    if (task.status !== "pending_approval") {
      throw new Error(`Cannot approve task in '${task.status}' state. Expected 'pending_approval'.`);
    }

    const approval: Approval = {
      id: `appr-${Date.now()}`,
      taskId,
      decidedByMemberId: memberId,
      decidedByMemberName: memberName,
      decision: "approved",
      reason: reason || "Approved for simulated execution.",
      decidedAt: new Date().toISOString(),
    };
    mockStore.addApproval(approval);

    mockStore.updateActionTask(taskId, {
      status: "approved",
      approvalId: approval.id,
    });

    await mockDataService.logEvent({
      businessId: task.businessId,
      actorType: "user",
      actorName: memberName,
      action: "APPROVED_ACTION_TASK",
      targetType: "ActionTask",
      targetId: task.id,
      details: `Approved action "${task.title}". Reason: ${approval.reason}`,
    });

    return (await this.getActionTaskById(taskId))!;
  }

  async rejectActionTask(
    taskId: string,
    memberId: string,
    memberName: string,
    reason?: string
  ): Promise<ActionTask> {
    await simulateDelay();
    const task = await this.getActionTaskById(taskId);
    if (!task) throw new Error("Task not found");

    const approval: Approval = {
      id: `appr-${Date.now()}`,
      taskId,
      decidedByMemberId: memberId,
      decidedByMemberName: memberName,
      decision: "rejected",
      reason: reason || "Declined by operator.",
      decidedAt: new Date().toISOString(),
    };
    mockStore.addApproval(approval);

    mockStore.updateActionTask(taskId, {
      status: "rejected",
      approvalId: approval.id,
    });

    await mockDataService.logEvent({
      businessId: task.businessId,
      actorType: "user",
      actorName: memberName,
      action: "REJECTED_ACTION_TASK",
      targetType: "ActionTask",
      targetId: task.id,
      details: `Rejected action "${task.title}". Reason: ${approval.reason}`,
    });

    return (await this.getActionTaskById(taskId))!;
  }

  async executeActionTask(taskId: string): Promise<ActionTask> {
    await simulateDelay(120);
    const task = await this.getActionTaskById(taskId);
    if (!task) throw new Error("Task not found");

    // STRICT SAFETY CHECK: Must be approved before executing
    if (task.status !== "approved") {
      throw new Error(
        `Action execution denied: task '${taskId}' status is '${task.status}', but must be 'approved'.`
      );
    }

    mockStore.updateActionTask(taskId, { status: "executing" });

    // Simulate domain effect based on task type
    if (task.type === "send_payment_reminder") {
      const invId = task.parameters.invoiceId;
      const inv = await mockDataService.getInvoiceById(invId);
      const cust = inv ? await mockDataService.getCustomerById(inv.counterpartyId) : null;

      const reminder: Reminder = {
        id: `rem-${Date.now()}`,
        businessId: task.businessId,
        invoiceId: invId,
        customerId: cust?.id || "cust-unknown",
        customerName: cust?.name || inv?.counterpartyName || "Customer",
        customerEmail: cust?.email || "customer@example.com",
        invoiceNumber: inv?.invoiceNumber || "INV-UNKNOWN",
        amountDue: inv ? inv.totalAmount - inv.amountPaid : 1500000,
        currency: inv?.currency || "USD",
        dueDate: inv?.dueDate || "2026-10-12",
        daysOverdue: 6,
        subject: `Payment Reminder: Overdue invoice ${inv?.invoiceNumber}`,
        body: `Dear ${cust?.name || "Customer"},\n\nWe would like to remind you that invoice ${inv?.invoiceNumber} was due on ${inv?.dueDate}. We are pleased to offer a 2% prompt settlement incentive if settled by wire before Oct 20.\n\nBest regards,\nHarbor & Pine Supply Co.`,
        discountOfferPercent: task.parameters.discountPercent || 2,
        deliveryMethod: "in_app_simulated",
        deliveryStatus: "sent_simulated",
        deliveryNotes: "Logged in-app (simulated delivery)",
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      mockStore.addReminder(reminder);

      mockStore.updateActionTask(taskId, {
        status: "completed",
        verificationResult: {
          verifiedAt: new Date().toISOString(),
          status: "success",
          message: "Logged in-app (simulated delivery). Customer reminder dispatched and recorded in audit log.",
          evidence: {
            reminderId: reminder.id,
            targetEmail: reminder.customerEmail,
            deliveryChannel: "in_app_simulated",
          },
        },
      });
    } else if (task.type === "reschedule_supplier_payment") {
      const billId = task.parameters.invoiceId;
      const shiftDays = task.parameters.shiftDays || 7;
      const bill = await mockDataService.getInvoiceById(billId);
      if (bill) {
        const newDueDate = addDaysToDate(bill.dueDate, shiftDays);
        await mockDataService.updateInvoice(billId, { dueDate: newDueDate });
      }

      mockStore.updateActionTask(taskId, {
        status: "completed",
        verificationResult: {
          verifiedAt: new Date().toISOString(),
          status: "success",
          message: `Supplier payment successfully deferred by ${shiftDays} days. Schedule verified in accounts payable.`,
        },
      });
    } else {
      mockStore.updateActionTask(taskId, {
        status: "completed",
        verificationResult: {
          verifiedAt: new Date().toISOString(),
          status: "success",
          message: "Action verified and executed successfully.",
        },
      });
    }

    await mockDataService.logEvent({
      businessId: task.businessId,
      actorType: "agent",
      actorName: "Autonomous Financial Agent",
      action: "EXECUTED_ACTION_TASK",
      targetType: "ActionTask",
      targetId: task.id,
      details: `Executed approved task: "${task.title}". Status: COMPLETED (Simulated).`,
    });

    return (await this.getActionTaskById(taskId))!;
  }

  async cancelActionTask(taskId: string, reason: string): Promise<ActionTask> {
    await simulateDelay();
    const task = await this.getActionTaskById(taskId);
    if (!task) throw new Error("Task not found");

    mockStore.updateActionTask(taskId, { status: "cancelled" });

    await mockDataService.logEvent({
      businessId: task.businessId,
      actorType: "user",
      actorName: "Active User",
      action: "CANCELLED_ACTION_TASK",
      targetType: "ActionTask",
      targetId: task.id,
      details: `Cancelled task "${task.title}". Reason: ${reason}`,
    });

    return (await this.getActionTaskById(taskId))!;
  }
}

export const mockActionService = new MockActionService();
