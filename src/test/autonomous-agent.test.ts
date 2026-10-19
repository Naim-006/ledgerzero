import { describe, it, expect, beforeEach } from "vitest";
import { executeAgenticAction } from "@/lib/ai/agent-executor";
import { mockStore } from "@/services/mock/store";
import { mockDataService } from "@/services/mock/data-service";

describe("Autonomous AI Agent Executor", () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it("autonomously records a POS sale when asked to 'sell something' or 'random sell'", async () => {
    // Check initial cash
    const initialCash = (await mockDataService.getCashPosition()).currentCash;

    const result = await executeAgenticAction("sell something for me", "biz_default", "CNY");

    expect(result).not.toBeNull();
    expect(result?.isAction).toBe(true);
    expect(result?.actionType).toBe("RECORD_SALE");
    expect(result?.successMessage).toContain("POS Sale Executed Successfully");
    expect(result?.suggestedActions?.length).toBeGreaterThan(0);

    // Verify database was actually modified: cash should have increased
    const newCash = (await mockDataService.getCashPosition()).currentCash;
    expect(newCash).toBeGreaterThan(initialCash);
  });

  it("autonomously generates a random customer invoice without requiring details", async () => {
    const initialInvoices = await mockDataService.getInvoices({ direction: "receivable" });
    const initialCount = initialInvoices.length;

    const result = await executeAgenticAction("generate a random invoice", "biz_default", "CNY");

    expect(result).not.toBeNull();
    expect(result?.isAction).toBe(true);
    expect(result?.actionType).toBe("CREATE_INVOICE");
    expect(result?.successMessage).toContain("Customer Invoice Created Successfully");
    expect(result?.successMessage).toContain("Net 14 Days");

    const updatedInvoices = await mockDataService.getInvoices({ direction: "receivable" });
    expect(updatedInvoices.length).toBe(initialCount + 1);
  });

  it("autonomously generates a random supplier bill without requiring details", async () => {
    const initialBills = await mockDataService.getInvoices({ direction: "payable" });
    const initialCount = initialBills.length;

    const result = await executeAgenticAction("can you create a random bill", "biz_default", "CNY");

    expect(result).not.toBeNull();
    expect(result?.isAction).toBe(true);
    expect(result?.actionType).toBe("CREATE_BILL");
    expect(result?.successMessage).toContain("Supplier Bill Recorded Successfully");

    const updatedBills = await mockDataService.getInvoices({ direction: "payable" });
    expect(updatedBills.length).toBe(initialCount + 1);
  });

  it("autonomously restocks inventory when asked for random stock or product", async () => {
    const initialProducts = await mockDataService.getProducts();
    const initialCount = initialProducts.length;

    const result = await executeAgenticAction("add random product to inventory", "biz_default", "CNY");

    expect(result).not.toBeNull();
    expect(result?.isAction).toBe(true);
    expect(result?.actionType).toBe("ADD_PRODUCT");
    expect(result?.successMessage).toContain("Inventory Restocked Successfully");

    const updatedProducts = await mockDataService.getProducts();
    expect(updatedProducts.length).toBe(initialCount + 1);
  });

  it("provides rich intelligent suggestions when user asks what can be done", async () => {
    const result = await executeAgenticAction("what can you do for my shop?", "biz_default", "CNY");

    expect(result).not.toBeNull();
    expect(result?.isAction).toBe(true);
    expect(result?.actionType).toBe("SUGGESTIONS");
    expect(result?.successMessage).toContain("Autonomous AI Agent Ready");
    expect(result?.suggestedActions).toBeDefined();
    expect(result?.suggestedActions?.length).toBeGreaterThanOrEqual(3);
  });
});
