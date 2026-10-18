import { describe, it, expect, beforeEach } from "vitest";
import { mockDataService } from "@/services/mock/data-service";
import { mockStore } from "@/services/mock/store";
import { Transaction } from "@/domain/types";

describe("CSV Import & Duplicate Detection", () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it("imports new transactions and ignores exact duplicates", async () => {
    const newTxBatch: Omit<Transaction, "id" | "createdAt">[] = [
      {
        businessId: "biz_harbor_pine",
        date: "2026-10-15",
        description: "New Hardware Purchase",
        type: "expense",
        category: "operating_utilities",
        amount: 32000,
        currency: "USD",
        isSettled: true,
      },
      // Duplicate of initial seed: "Warehouse Facility Lease - October 2026" on 2026-10-05 for $3500 (350000 cents)
      {
        businessId: "biz_harbor_pine",
        date: "2026-10-05",
        description: "Warehouse Facility Lease - October 2026",
        type: "expense",
        category: "operating_rent",
        amount: 350000,
        currency: "USD",
        isSettled: true,
      },
    ];

    const result = await mockDataService.importTransactionsCsv(newTxBatch);

    expect(result.importedCount).toBe(1);
    expect(result.duplicateCount).toBe(1);

    const { transactions } = await mockDataService.getTransactions({ search: "Hardware" });
    expect(transactions.length).toBe(1);
    expect(transactions[0].description).toBe("New Hardware Purchase");
  });
});
