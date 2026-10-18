import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppProvider } from "@/context/app-context";
import { ActionTask } from "@/domain/types";
import { Button } from "@/components/ui/button";

function TestApprovalWidget({
  task,
  onApprove,
  canApprove,
}: {
  task: ActionTask;
  onApprove: (id: string) => void;
  canApprove: boolean;
}) {
  return (
    <div>
      <h3>{task.title}</h3>
      <p>{task.reason}</p>
      <span>Status: {task.status}</span>
      <Button
        variant="primary"
        disabled={!canApprove || task.status !== "pending_approval"}
        onClick={() => onApprove(task.id)}
      >
        Authorize & Approve
      </Button>
    </div>
  );
}

describe("Approval Flow Component Behavior", () => {
  const sampleTask: ActionTask = {
    id: "task-test-01",
    businessId: "biz-1",
    type: "send_payment_reminder",
    title: "Send Overdue Reminder with Discount",
    description: "Follow up with client",
    reason: "Mitigate 7-day cash gap",
    expectedOutcome: "Accelerate inflow",
    riskLevel: "medium",
    requiredRole: "Owner",
    status: "pending_approval",
    supportingRecordIds: ["inv-1"],
    supportingRecordType: "invoice",
    parameters: {},
    createdAt: "2026-10-18T00:00:00Z",
    updatedAt: "2026-10-18T00:00:00Z",
  };

  it("renders pending task and allows clicking approve when authorized", () => {
    const handleApprove = vi.fn();
    render(
      <TestApprovalWidget
        task={sampleTask}
        onApprove={handleApprove}
        canApprove={true}
      />
    );

    expect(screen.getByText("Send Overdue Reminder with Discount")).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /Authorize & Approve/i });
    expect(btn).not.toBeDisabled();

    fireEvent.click(btn);
    expect(handleApprove).toHaveBeenCalledWith("task-test-01");
  });

  it("disables approve button when operator role lacks authorization", () => {
    const handleApprove = vi.fn();
    render(
      <TestApprovalWidget
        task={sampleTask}
        onApprove={handleApprove}
        canApprove={false} // e.g. Viewer or Accountant
      />
    );

    const btn = screen.getByRole("button", { name: /Authorize & Approve/i });
    expect(btn).toBeDisabled();

    fireEvent.click(btn);
    expect(handleApprove).not.toHaveBeenCalled();
  });
});
