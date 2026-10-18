import { describe, it, expect, beforeEach } from "vitest";
import { mockAgentService } from "@/services/mock/agent-service";
import { mockActionService } from "@/services/mock/action-service";
import { mockStore } from "@/services/mock/store";
import { AgentEvent } from "@/domain/types";

describe("Agent Simulator & Action Execution Safety", () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it("processes a cash shortage prompt, generates a plan, and stops at pending_approval", async () => {
    const events: AgentEvent[] = [];
    const run = await mockAgentService.runAgentGoal(
      "Help me avoid a cash shortage next week",
      (evt) => events.push(evt)
    );

    expect(run.detectedIntent).toBe("cash_shortage");
    expect(run.status).toBe("waiting_approval");
    expect(run.proposedTaskIds.length).toBeGreaterThan(0);

    // Verify event progression
    const eventTypes = events.map((e) => e.type);
    expect(eventTypes).toContain("goal_received");
    expect(eventTypes).toContain("plan_created");
    expect(eventTypes).toContain("tool_call_start");
    expect(eventTypes).toContain("tool_call_result");
    expect(eventTypes).toContain("evidence_found");
    expect(eventTypes).toContain("approval_requested");

    // The agent must NOT execute the action without approval!
    expect(eventTypes).not.toContain("action_executed");
  });

  it("strictly prevents execution of an unapproved action task", async () => {
    const tasks = await mockActionService.getActionTasks({ status: "pending_approval" });
    const pendingTask = tasks[0];
    expect(pendingTask).toBeDefined();

    // Trying to execute directly while pending_approval MUST throw an error
    await expect(mockActionService.executeActionTask(pendingTask.id)).rejects.toThrow(
      /Action execution denied/
    );
  });

  it("allows execution only after human approval and records verified status", async () => {
    const tasks = await mockActionService.getActionTasks({ status: "pending_approval" });
    const pendingTask = tasks[0];

    // Approve the task
    const approvedTask = await mockActionService.approveActionTask(
      pendingTask.id,
      "mem-1",
      "Alex Vance",
      "Authorized prompt collection reminder"
    );
    expect(approvedTask.status).toBe("approved");

    // Now execute
    const executedTask = await mockActionService.executeActionTask(pendingTask.id);
    expect(executedTask.status).toBe("completed");
    expect(executedTask.verificationResult?.status).toBe("success");
    expect(executedTask.verificationResult?.message).toContain("Logged in-app (simulated delivery)");
  });
});
