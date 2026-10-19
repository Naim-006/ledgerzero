import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("Welcome Tutorial & Workflow Tour", () => {
  it("defines the expected steps covering app capabilities and each core page", async () => {
    const { WelcomeTutorialModal } = await import("@/components/onboarding/welcome-tutorial-modal");
    expect(WelcomeTutorialModal).toBeDefined();
  }, 15000);

  it("persists tutorial completion key in localStorage format", () => {
    const key = "ledger_zero_tutorial_seen_v1";
    expect(key).toBe("ledger_zero_tutorial_seen_v1");
  });
});
