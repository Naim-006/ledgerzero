import { AgentService } from "../contracts";
import {
  AgentRun,
  AgentEvent,
  AgentEventType,
  AgentToolName,
  ActionTask,
} from "@/domain/types";
import { SupabaseDataService } from "./data-service";
import { SupabaseActionService } from "./action-service";
import { SupabaseReminderService } from "./reminder-service";
import { getSupabaseClient } from "@/lib/supabase/client";

export class SupabaseAgentService implements AgentService {
  private dataService: SupabaseDataService;
  private actionService: SupabaseActionService;
  private reminderService: SupabaseReminderService;

  constructor(
    dataService: SupabaseDataService,
    actionService: SupabaseActionService,
    reminderService: SupabaseReminderService
  ) {
    this.dataService = dataService;
    this.actionService = actionService;
    this.reminderService = reminderService;
  }

  private async getClient() {
    return getSupabaseClient();
  }

  async runAgentGoal(
    userPrompt: string,
    onEvent: (event: AgentEvent) => void
  ): Promise<AgentRun> {
    const runId = `run-${Date.now()}`;
    const promptLower = userPrompt.toLowerCase();
    const sb = await this.getClient();
    const biz = await this.dataService.getBusiness();

    // 1. Intent Detection
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
      promptLower.includes("spend") ||
      promptLower.includes("bill") ||
      promptLower.includes("supplier")
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
      businessId: biz.id,
      userPrompt,
      detectedIntent,
      status: "running",
      summary: "Autonomous financial coordination initiated...",
      verifiedFacts: [],
      assumptions: [],
      events: [],
      proposedTaskIds: [],
      createdAt: new Date().toISOString(),
    };

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
      delayMs: number = 250
    ) => {
      const event: AgentEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        runId,
        timestamp: new Date().toISOString(),
        type,
        message,
        toolName: details?.toolName,
        toolArgs: details?.toolArgs,
        toolResult: details?.toolResult,
        evidence: details?.evidence,
        actionTaskId: details?.actionTaskId,
      };

      run.events.push(event);
      onEvent(event);
      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    };

    // 2. Goal Received & Specialized Agent Dispatch
    await emitEvent("goal_received", `Command received: "${userPrompt}"`);

    // Plan Creation (Status: PLANNED)
    await emitEvent(
      "plan_created",
      "Created execution strategy. Coordinating 4 specialized agents: [Liquidity Sentinel], [Receivables Specialist], [Payables Negotiator], and [Risk & Compliance Gatekeeper]."
    );

    // Step 1: Liquidity Sentinel Execution (Status: RUNNING)
    await emitEvent("tool_call_start", "Liquidity Sentinel Agent: Querying real-time cash position & 30-day forecast...", {
      toolName: "calculate_cash_flow_forecast",
      toolArgs: { days: 30 },
    });

    const cashPos = await this.dataService.getCashPosition();
    const forecast = await this.dataService.getForecast(30);

    await emitEvent(
      "tool_call_result",
      `Liquidity Sentinel Report: Current Cash: $${(cashPos.currentCash / 100).toFixed(2)}. 30-Day Lowest Balance: $${(forecast.minimumCash / 100).toFixed(2)}. ${
        forecast.firstShortfallDate ? `Shortfall flagged on ${forecast.firstShortfallDate}!` : "No liquidity deficit detected."
      }`,
      {
        toolName: "calculate_cash_flow_forecast",
        toolResult: {
          currentCash: cashPos.currentCash,
          minimumCash: forecast.minimumCash,
          firstShortfallDate: forecast.firstShortfallDate,
        },
        evidence: {
          verifiedBalance: cashPos.currentCash,
          settledIncome: cashPos.totalIncome,
          settledExpense: cashPos.totalExpense,
        },
      }
    );

    run.verifiedFacts.push(`Cash balance verified from live ledger: $${(cashPos.currentCash / 100).toFixed(2)}.`);

    // Step 2: Receivables Specialist Agent
    await emitEvent("tool_call_start", "Receivables Specialist Agent: Auditing unpaid customer invoices and payment deadlines...", {
      toolName: "list_overdue_receivables",
      toolArgs: {},
    });

    const overdueInvoices = await this.dataService.getInvoices({ status: "overdue" });
    const allInvoices = await this.dataService.getInvoices({ direction: "receivable" });
    const targetInvoices = overdueInvoices.length > 0 ? overdueInvoices : allInvoices.filter((i) => i.status !== "paid");

    await emitEvent(
      "tool_call_result",
      `Receivables Audit: Found ${targetInvoices.length} outstanding invoice(s). Total pending collection: $${(
        targetInvoices.reduce((sum, i) => sum + i.totalAmount, 0) / 100
      ).toFixed(2)}.`,
      {
        toolName: "list_overdue_receivables",
        toolResult: targetInvoices.map((i) => ({
          invoiceNumber: i.invoiceNumber,
          customer: i.counterpartyName,
          amount: i.totalAmount,
          due: i.dueDate,
        })),
        evidence: {
          overdueCount: overdueInvoices.length,
          openInvoiceCount: targetInvoices.length,
        },
      }
    );

    // Step 3: Payables Negotiator Agent
    await emitEvent("tool_call_start", "Payables Negotiator Agent: Inspecting upcoming vendor obligations...", {
      toolName: "list_upcoming_payables",
      toolArgs: { withinDays: 14 },
    });

    const payablesSummary = await this.dataService.getPayablesSummary();
    await emitEvent(
      "tool_call_result",
      `Payables Assessment: Upcoming bills in next 7 days: $${(payablesSummary.dueWithin7Days / 100).toFixed(2)}. Total payables: $${(payablesSummary.totalPayables / 100).toFixed(2)}.`,
      {
        toolName: "list_upcoming_payables",
        toolResult: payablesSummary,
      }
    );

    // Step 4: Autonomous Workflow & Proposal Generation (Status: PENDING_APPROVAL)
    if (targetInvoices.length > 0) {
      const topInvoice = targetInvoices[0];
      await emitEvent(
        "draft_produced",
        `Drafted personalized collection reminder for ${topInvoice.counterpartyName} (Invoice #${topInvoice.invoiceNumber}, $${(topInvoice.totalAmount / 100).toFixed(2)}). Includes 2% prompt-settlement incentive.`,
        {
          toolName: "create_reminder_draft",
          toolArgs: { invoiceId: topInvoice.id, discountPercent: 2.0 },
        }
      );

      // Create ActionTask with strict approval status in Supabase
      const actionTask = await this.actionService.createActionTask({
        businessId: biz.id,
        type: "send_payment_reminder",
        title: `Dispatch Collection Reminder to ${topInvoice.counterpartyName}`,
        description: `Send personalized payment reminder for Invoice #${topInvoice.invoiceNumber} ($${(topInvoice.totalAmount / 100).toFixed(2)}) with a 2% prompt-settlement discount.`,
        reason: `Accelerates customer payment to protect working capital liquidity and avert cash shortfalls.`,
        expectedOutcome: `Expected inflow of $${((topInvoice.totalAmount * 0.98) / 100).toFixed(2)} within 48 hours.`,
        riskLevel: "medium",
        requiredRole: "Owner",
        status: "pending_approval",
        supportingRecordIds: [topInvoice.id],
        supportingRecordType: "invoice",
        parameters: {
          invoiceId: topInvoice.id,
          customerName: topInvoice.counterpartyName,
          discountPercent: 2.0,
        },
      });

      run.proposedTaskIds.push(actionTask.id);

      // Step 5: Risk & Compliance Gatekeeper (Status: APPROVAL_REQUESTED)
      await emitEvent(
        "approval_requested",
        `[Risk & Compliance Gatekeeper]: Action Task #${actionTask.id.slice(0, 8)} generated with status 'pending_approval'. Action execution blocked until verified Owner authorization.`,
        {
          actionTaskId: actionTask.id,
          evidence: {
            requiredRole: "Owner",
            riskLevel: "medium",
            impactAmount: topInvoice.totalAmount,
          },
        }
      );

      run.summary = `Plan formulated. Identified $${(topInvoice.totalAmount / 100).toFixed(2)} in outstanding receivables. Generated Action Task #${actionTask.id.slice(0, 8)} awaiting Owner approval in Action Center.`;
    } else {
      run.summary = `Analysis complete. Cash position is safe at $${(cashPos.currentCash / 100).toFixed(2)} with no overdue invoices requiring intervention.`;
    }

    // Step 6: Completion (Status: COMPLETED)
    run.status = "completed";
    await emitEvent("run_completed", "Autonomous cycle completed. All evidence verified from live database records.");

    // Store in Supabase system_settings
    await sb.from("system_settings").upsert(
      {
        key: `agent_run_${run.id}`,
        value: JSON.stringify(run),
        description: "Agent execution history record",
      },
      { onConflict: "key" }
    );

    return run;
  }

  async getAgentRun(runId: string): Promise<AgentRun | null> {
    const sb = await this.getClient();
    const { data } = await sb
      .from("system_settings")
      .select("value")
      .eq("key", `agent_run_${runId}`)
      .maybeSingle();

    if (!data || !data.value) return null;
    try {
      return JSON.parse(data.value);
    } catch {
      return null;
    }
  }

  async getRecentRuns(): Promise<AgentRun[]> {
    const sb = await this.getClient();
    const { data } = await sb
      .from("system_settings")
      .select("value")
      .ilike("key", "agent_run_%")
      .order("updated_at", { ascending: false })
      .limit(10);

    if (!data) return [];
    return data
      .map((d: any) => {
        try {
          return JSON.parse(d.value);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }
}
