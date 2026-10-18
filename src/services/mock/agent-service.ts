import { AgentService } from "../contracts";
import { mockStore } from "./store";
import {
  AgentRun,
  AgentEvent,
  AgentEventType,
  AgentToolName,
  ActionTask,
} from "@/domain/types";
import { mockDataService } from "./data-service";
import { mockActionService } from "./action-service";
import { mockReminderService } from "./reminder-service";
import { DEMO_REFERENCE_DATE } from "./seed";
import { z } from "zod";

// Zod schemas for tool argument validation
const ToolArgSchemas: Record<AgentToolName, z.ZodType<any>> = {
  get_business_summary: z.object({}),
  list_transactions: z.object({ limit: z.number().optional() }),
  list_overdue_receivables: z.object({}),
  list_upcoming_payables: z.object({ withinDays: z.number() }),
  calculate_cash_flow_forecast: z.object({ days: z.number().min(1).max(90) }),
  simulate_cash_flow_scenario: z.object({
    assumptions: z.array(z.any()),
    days: z.number().optional(),
  }),
  create_reminder_draft: z.object({
    invoiceId: z.string(),
    discountPercent: z.number().optional(),
  }),
  request_action_approval: z.object({
    taskTitle: z.string(),
    taskType: z.string(),
    parameters: z.record(z.any()),
  }),
  schedule_follow_up: z.object({ targetDate: z.string(), note: z.string() }),
  execute_approved_reminder: z.object({ taskId: z.string() }),
  verify_action_result: z.object({ taskId: z.string() }),
};

export class MockAgentService implements AgentService {
  async runAgentGoal(
    userPrompt: string,
    onEvent: (event: AgentEvent) => void
  ): Promise<AgentRun> {
    const runId = `run-${Date.now()}`;
    const promptLower = userPrompt.toLowerCase();

    // Intent detection
    let detectedIntent: AgentRun["detectedIntent"] = "general_query";
    if (
      promptLower.includes("shortage") ||
      promptLower.includes("gap") ||
      promptLower.includes("cash") ||
      promptLower.includes("liquidity")
    ) {
      detectedIntent = "cash_shortage";
    } else if (
      promptLower.includes("overdue") ||
      promptLower.includes("collect") ||
      promptLower.includes("chase") ||
      promptLower.includes("unpaid")
    ) {
      detectedIntent = "overdue_collections";
    } else if (
      promptLower.includes("expense") ||
      promptLower.includes("spending") ||
      promptLower.includes("bill") ||
      promptLower.includes("audit")
    ) {
      detectedIntent = "expense_review";
    } else if (
      promptLower.includes("what if") ||
      promptLower.includes("scenario") ||
      promptLower.includes("delay") ||
      promptLower.includes("simulate")
    ) {
      detectedIntent = "scenario_simulation";
    }

    const run: AgentRun = {
      id: runId,
      businessId: mockStore.getState().business.id,
      userPrompt,
      detectedIntent,
      status: "running",
      summary: "Analyzing business state and executing targeted investigation...",
      verifiedFacts: [],
      assumptions: [],
      events: [],
      proposedTaskIds: [],
      createdAt: new Date().toISOString(),
    };

    mockStore.addAgentRun(run);

    const emitEvent = async (
      type: AgentEventType,
      message: string,
      details?: {
        toolName?: AgentToolName;
        toolArgs?: Record<string, any>;
        toolResult?: any;
        evidence?: Record<string, any>;
        actionTaskId?: string;
      },
      delayMs: number = 300
    ) => {
      // Validate tool args if calling a tool
      if (details?.toolName && details?.toolArgs) {
        const schema = ToolArgSchemas[details.toolName];
        if (schema) {
          const valResult = schema.safeParse(details.toolArgs);
          if (!valResult.success) {
            const errEvent: AgentEvent = {
              id: `evt-err-${Date.now()}`,
              runId,
              timestamp: new Date().toISOString(),
              type: "tool_call_error",
              message: `Validation failed for tool ${details.toolName}: ${valResult.error.message}`,
              toolName: details.toolName,
              toolArgs: details.toolArgs,
              isSimulated: true,
            };
            run.events.push(errEvent);
            onEvent(errEvent);
            return;
          }
        }
      }

      await new Promise((r) => setTimeout(r, delayMs));
      const evt: AgentEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        runId,
        timestamp: new Date().toISOString(),
        type,
        message,
        ...details,
        isSimulated: true,
      };
      run.events.push(evt);
      mockStore.updateAgentRun(runId, { events: [...run.events] });
      onEvent(evt);
    };

    // Scripted execution by intent
    if (detectedIntent === "cash_shortage") {
      await this.runCashShortageWorkflow(run, emitEvent);
    } else if (detectedIntent === "overdue_collections") {
      await this.runOverdueCollectionsWorkflow(run, emitEvent);
    } else if (detectedIntent === "expense_review") {
      await this.runExpenseReviewWorkflow(run, emitEvent);
    } else if (detectedIntent === "scenario_simulation") {
      await this.runScenarioSimulationWorkflow(run, emitEvent);
    } else {
      await this.runGeneralQueryFallback(run, emitEvent);
    }

    return run;
  }

  // --- Workflows ---

  private async runCashShortageWorkflow(
    run: AgentRun,
    emitEvent: Function
  ) {
    await emitEvent("goal_received", `Goal registered: "${run.userPrompt}". Initiating liquidity audit.`);
    await emitEvent("plan_created", "Formulated 4-step investigation plan:\n1. Query 7-day cash flow forecast\n2. Inspect upcoming supplier obligations and overdue customer invoices\n3. Evaluate intervention scenario\n4. Propose actionable collection reminder for human approval.");

    // Step 1: Calculate forecast
    await emitEvent("tool_call_start", "Executing tool: calculate_cash_flow_forecast", {
      toolName: "calculate_cash_flow_forecast",
      toolArgs: { days: 7 },
    });
    const forecast = await mockDataService.getForecast(7);
    await emitEvent("tool_call_result", `Forecast computed: Current cash $20,000.00, upcoming outflows $45,000.00. First shortfall projected on ${forecast.firstShortfallDate} (-$25,000.00 deficit).`, {
      toolName: "calculate_cash_flow_forecast",
      toolResult: {
        minimumCash: forecast.minimumCash,
        firstShortfallDate: forecast.firstShortfallDate,
      },
    });

    run.verifiedFacts.push(
      "Current confirmed cash balance is $20,000.00.",
      "Two supplier obligations totaling $45,000.00 are due within the next 5 days.",
      "Projected cash balance reaches -$25,000.00 on October 23 without additional inflows."
    );

    // Step 2: List overdue receivables
    await emitEvent("tool_call_start", "Executing tool: list_overdue_receivables", {
      toolName: "list_overdue_receivables",
      toolArgs: {},
    });
    const overdueInvoices = await mockDataService.getInvoices({ status: "overdue" });
    const apexInvoice = overdueInvoices.find((i) => i.counterpartyName.includes("Apex")) || overdueInvoices[0];
    await emitEvent("tool_call_result", `Found overdue receivable: ${apexInvoice.counterpartyName} (${apexInvoice.invoiceNumber}) owes $15,000.00 (6 days overdue).`, {
      toolName: "list_overdue_receivables",
      toolResult: overdueInvoices,
    });

    await emitEvent("evidence_found", "Evidence verified: Apex Retail Partners has an uncollected invoice of $15,000.00. Customer has an average payment turnaround of 38 days and responds well to early-settlement terms.", {
      evidence: {
        customer: "Apex Retail Partners",
        invoiceNumber: apexInvoice.invoiceNumber,
        amount: apexInvoice.totalAmount,
        reliabilityScore: 68,
      },
    });

    // Step 3: Produce draft & propose action
    await emitEvent("tool_call_start", "Executing tool: create_reminder_draft", {
      toolName: "create_reminder_draft",
      toolArgs: { invoiceId: apexInvoice.id, discountPercent: 2 },
    });
    const reminder = await mockReminderService.createReminderDraft(apexInvoice.id, 2);
    await emitEvent("draft_produced", "Drafted expedited payment reminder offering a 2% early settlement discount ($300.00 incentive) for payment by Oct 20.", {
      toolName: "create_reminder_draft",
      toolResult: reminder,
    });

    // Step 4: Propose Action Task for Approval
    const existingTask = (await mockActionService.getActionTasks()).find(
      (t) => t.parameters.invoiceId === apexInvoice.id && t.status === "pending_approval"
    );

    let task: ActionTask;
    if (existingTask) {
      task = existingTask;
    } else {
      task = await mockActionService.createActionTask({
        businessId: mockStore.getState().business.id,
        agentRunId: run.id,
        type: "send_payment_reminder",
        title: "Dispatch Collection Reminder with 2% Early Settlement Discount",
        description: `Follow up with Apex Retail Partners for overdue invoice ${apexInvoice.invoiceNumber} ($15,000.00). Offer 2% discount ($300.00) for wire settlement by Oct 20.`,
        reason: "Working capital shortfall of -$25,000.00 on Oct 21 caused by upcoming supplier payments.",
        expectedOutcome: "Accelerates $14,700.00 inflow before Oct 21, reducing shortfall from -$25,000.00 to -$10,300.00.",
        riskLevel: "medium",
        requiredRole: "Owner",
        status: "pending_approval",
        supportingRecordIds: [apexInvoice.id, apexInvoice.counterpartyId],
        supportingRecordType: "invoice",
        parameters: {
          invoiceId: apexInvoice.id,
          discountPercent: 2,
          customerEmail: "ap@apexretailpartners.com",
        },
      });
    }

    run.proposedTaskIds.push(task.id);
    run.assumptions.push(
      "Customer will accept 2% discount terms and remit funds within 48 hours of dispatch."
    );

    await emitEvent("approval_requested", "Action Task created requiring Owner/Admin approval. Awaiting your authorization before any communication is dispatched.", {
      actionTaskId: task.id,
    });

    run.status = "waiting_approval";
    run.summary = "Cash shortfall identified. Action proposal ready for your approval.";
    mockStore.updateAgentRun(run.id, {
      status: "waiting_approval",
      summary: run.summary,
      verifiedFacts: run.verifiedFacts,
      assumptions: run.assumptions,
      proposedTaskIds: run.proposedTaskIds,
    });
  }

  private async runOverdueCollectionsWorkflow(
    run: AgentRun,
    emitEvent: Function
  ) {
    await emitEvent("goal_received", `Goal registered: "${run.userPrompt}". Inspecting aging receivables ledger.`);
    await emitEvent("plan_created", "Plan:\n1. Audit aging buckets\n2. Group outstanding invoices by customer reliability\n3. Prepare tailored outreach queue.");

    const aging = await mockDataService.getReceivablesAging();
    await emitEvent("tool_call_start", "Executing tool: list_overdue_receivables", {
      toolName: "list_overdue_receivables",
      toolArgs: {},
    });
    await emitEvent("tool_call_result", `Audited aging schedule: Total receivables $25,000.00 across 2 customers. Overdue amount: $15,000.00 (Apex Retail Partners).`, {
      toolName: "list_overdue_receivables",
      toolResult: aging,
    });

    run.verifiedFacts.push(
      "Total accounts receivable outstanding: $25,000.00.",
      "60% of receivables ($15,000.00) are currently overdue in the 1-30 day aging bracket."
    );

    const task = await mockActionService.createActionTask({
      businessId: mockStore.getState().business.id,
      agentRunId: run.id,
      type: "send_payment_reminder",
      title: "Issue Standard Collection Follow-Up to Apex Retail Partners",
      description: "Request formal remittance advice and payment status update for INV-2026-089.",
      reason: "Invoice is 6 days past agreed Net-30 payment terms.",
      expectedOutcome: "Confirm scheduled payment date and prevent slip into 30+ day aging bracket.",
      riskLevel: "low",
      requiredRole: "Admin",
      status: "pending_approval",
      supportingRecordIds: ["inv-rec-089"],
      supportingRecordType: "invoice",
      parameters: { invoiceId: "inv-rec-089" },
    });

    run.proposedTaskIds.push(task.id);
    await emitEvent("approval_requested", "Collection reminder draft created and queued in Action Center.", {
      actionTaskId: task.id,
    });

    run.status = "waiting_approval";
    run.summary = "Overdue collection review complete. Action queued for approval.";
    mockStore.updateAgentRun(run.id, {
      status: "waiting_approval",
      summary: run.summary,
      verifiedFacts: run.verifiedFacts,
      proposedTaskIds: run.proposedTaskIds,
    });
  }

  private async runExpenseReviewWorkflow(
    run: AgentRun,
    emitEvent: Function
  ) {
    await emitEvent("goal_received", `Goal registered: "${run.userPrompt}". Auditing operating expenses and supplier terms.`);
    await emitEvent("plan_created", "Plan:\n1. Analyze monthly budget utilization\n2. Cross-reference upcoming supplier obligations\n3. Identify deferral or consolidation opportunities.");

    const budgets = await mockDataService.getBudgetUtilization("2026-10");
    await emitEvent("tool_call_start", "Executing tool: list_upcoming_payables", {
      toolName: "list_upcoming_payables",
      toolArgs: { withinDays: 14 },
    });
    const payables = await mockDataService.getInvoices({ direction: "payable" });
    await emitEvent("tool_call_result", `Analyzed payables: 2 upcoming supplier invoices totaling $45,000.00 due this week. Rent budget at 87.5% capacity.`, {
      toolName: "list_upcoming_payables",
      toolResult: payables,
    });

    run.verifiedFacts.push(
      "Cascade Lumber bill ($25,000.00) due Oct 21 is critical for material supply.",
      "Northwest Freight bill ($20,000.00) due Oct 23 can be rescheduled by 7 days without service interruption."
    );

    const task = await mockActionService.createActionTask({
      businessId: mockStore.getState().business.id,
      agentRunId: run.id,
      type: "reschedule_supplier_payment",
      title: "Reschedule Northwest Freight Supplier Payment by 7 Days",
      description: "Request a 7-day payment extension on BILL-2026-7834 ($20,000.00) to Oct 30.",
      reason: "Relieves short-term cash pressure while maintaining critical timber deliveries with Cascade Lumber.",
      expectedOutcome: "Preserves $20,000.00 in operating cash through the critical Oct 21-25 window.",
      riskLevel: "medium",
      requiredRole: "Admin",
      status: "pending_approval",
      supportingRecordIds: ["inv-pay-7834"],
      supportingRecordType: "invoice",
      parameters: { invoiceId: "inv-pay-7834", shiftDays: 7 },
    });

    run.proposedTaskIds.push(task.id);
    await emitEvent("approval_requested", "Payment reschedule proposal prepared for approval.", {
      actionTaskId: task.id,
    });

    run.status = "waiting_approval";
    run.summary = "Operating expense review complete. Supplier payment reschedule proposed.";
    mockStore.updateAgentRun(run.id, {
      status: "waiting_approval",
      summary: run.summary,
      verifiedFacts: run.verifiedFacts,
      proposedTaskIds: run.proposedTaskIds,
    });
  }

  private async runScenarioSimulationWorkflow(
    run: AgentRun,
    emitEvent: Function
  ) {
    await emitEvent("goal_received", `Goal registered: "${run.userPrompt}". Initializing hypothetical cash flow simulation.`);
    await emitEvent("plan_created", "Plan:\n1. Load baseline 30-day forecast\n2. Apply late payment assumption\n3. Calculate liquidity impact and stress test.");

    await emitEvent("tool_call_start", "Executing tool: simulate_cash_flow_scenario", {
      toolName: "simulate_cash_flow_scenario",
      toolArgs: {
        assumptions: [{ type: "delay_customer_payment", shiftDays: 14 }],
        days: 30,
      },
    });

    const simulation = await mockDataService.simulateScenario([
      {
        id: "asm-sim",
        type: "delay_customer_payment",
        label: "Beacon Maritime payment delayed 14 days",
        targetInvoiceId: "inv-rec-094",
        shiftDays: 14,
      },
    ]);

    await emitEvent("tool_call_result", `Scenario simulated: Minimum cash projected at -$25,000.00. Recovery delayed until Day 18.`, {
      toolName: "simulate_cash_flow_scenario",
      toolResult: simulation,
    });

    run.verifiedFacts.push(
      "If Beacon Maritime payment is delayed by 14 days, cash shortfall remains active until Nov 5.",
      "Working capital buffer of at least $25,000.00 is required to absorb this customer delay."
    );

    run.status = "completed";
    run.summary = "Scenario simulation complete. Liquidity stress model saved to simulator view.";
    await emitEvent("run_completed", "Simulation complete. You can inspect the full curve in Cash Flow & Scenarios.");

    mockStore.updateAgentRun(run.id, {
      status: "completed",
      summary: run.summary,
      verifiedFacts: run.verifiedFacts,
      completedAt: new Date().toISOString(),
    });
  }

  private async runGeneralQueryFallback(
    run: AgentRun,
    emitEvent: Function
  ) {
    await emitEvent("goal_received", `Goal received: "${run.userPrompt}".`);
    await emitEvent("plan_created", "LEDGER ZERO Agent specialized financial scope:\n- Cash shortage prevention\n- Receivables collection management\n- Supplier payment optimization\n- Cash flow scenario simulation");

    run.summary = `I am LEDGER ZERO's financial operating assistant. I specialize in cash flow forecasting, overdue collections, and supplier payment scheduling. How can I help you with your liquidity or receivables today?`;
    run.status = "completed";

    await emitEvent("run_completed", run.summary);
    mockStore.updateAgentRun(run.id, {
      status: "completed",
      summary: run.summary,
      completedAt: new Date().toISOString(),
    });
  }

  async getAgentRun(runId: string): Promise<AgentRun | null> {
    return mockStore.getState().agentRuns.find((r) => r.id === runId) || null;
  }

  async getRecentRuns(): Promise<AgentRun[]> {
    return mockStore.getState().agentRuns.slice(0, 10);
  }
}

export const mockAgentService = new MockAgentService();
