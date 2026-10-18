import { describe, it, expect, beforeEach } from "vitest";
import { MockDataService } from "@/services/mock/data-service";
import { mockStore } from "@/services/mock/store";
import { ProductSchema } from "@/domain/types";

describe("POS Register, Inventory & SME Financing (Competition Topic E)", () => {
  let service: MockDataService;

  beforeEach(() => {
    mockStore.reset();
    service = new MockDataService();
  });

  it("validates product schema and successfully adds a product to inventory", async () => {
    const validProduct = {
      id: "prod-test-1",
      businessId: "biz_default",
      name: "Organic Coffee Beans (500g)",
      sku: "COF-500",
      category: "Beverages",
      unitPrice: 2200, // $22.00
      costPrice: 1100, // $11.00
      stockQuantity: 50,
      minStockAlert: 10,
      unit: "bag",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const parsed = ProductSchema.safeParse(validProduct);
    expect(parsed.success).toBe(true);

    const created = await service.createProduct({
      businessId: "biz_default",
      name: validProduct.name,
      sku: validProduct.sku,
      category: validProduct.category,
      unitPrice: validProduct.unitPrice,
      costPrice: validProduct.costPrice,
      stockQuantity: validProduct.stockQuantity,
      minStockAlert: validProduct.minStockAlert,
      unit: validProduct.unit,
    });

    expect(created.name).toBe("Organic Coffee Beans (500g)");
    expect(created.stockQuantity).toBe(50);

    const prods = await service.getProducts();
    expect(prods.length).toBeGreaterThan(0);
    expect(prods[0].sku).toBe("COF-500");
  });

  it("records a POS sale, automatically deducts stock, creates paid invoice, settles cash transaction, and logs audit trail", async () => {
    // 1. Create product with 20 items in stock
    const prod = await service.createProduct({
      businessId: "biz_default",
      name: "Wireless Optical Mouse",
      sku: "TECH-001",
      category: "Electronics",
      unitPrice: 3000, // $30.00
      costPrice: 1500, // $15.00
      stockQuantity: 20,
      minStockAlert: 5,
      unit: "pcs",
    });

    // 2. Perform POS sale of 3 units with cash payment and a 10% discount
    const saleResult = await service.recordPosSale({
      items: [
        {
          productId: prod.id,
          name: prod.name,
          quantity: 3,
          unitPrice: 3000,
          subtotal: 9000,
        },
      ],
      customerName: "Jane Smith",
      customerPhone: "+1-555-0199",
      paymentMethod: "cash",
      discountAmount: 900, // $9.00 discount (10%)
      taxRatePercent: 0,
      notes: "Walk-in shop customer",
    });

    // 3. Verify sale totals
    expect(saleResult.subtotal).toBe(9000);
    expect(saleResult.discountAmount).toBe(900);
    expect(saleResult.totalPaid).toBe(8100); // 9000 - 900 = 8100
    expect(saleResult.receiptNumber).toMatch(/^POS-\d+$/);

    // 4. Verify inventory stock is decremented from 20 to 17
    const updatedProd = await service.getProductById(prod.id);
    expect(updatedProd?.stockQuantity).toBe(17);

    // 5. Verify a settled paid invoice was added to the ledger
    const invoices = await service.getInvoices();
    const posInvoice = invoices.find((inv) => inv.invoiceNumber === saleResult.receiptNumber);
    expect(posInvoice).toBeDefined();
    expect(posInvoice?.status).toBe("paid");
    expect(posInvoice?.totalAmount).toBe(8100);
    expect(posInvoice?.amountPaid).toBe(8100);

    // 6. Verify a settled credit cash transaction was recorded
    const { transactions } = await service.getTransactions();
    const posTx = transactions.find((tx) => tx.invoiceId === posInvoice?.id);
    expect(posTx).toBeDefined();
    expect(posTx?.type).toBe("income");
    expect(posTx?.category).toBe("revenue_sales");
    expect(posTx?.amount).toBe(8100);
    expect(posTx?.isSettled).toBe(true);

    // 7. Verify audit log entry
    const auditLogs = await service.getAuditLogs(10);
    const saleLog = auditLogs.find((l) => l.action === "POS_SALE_SETTLED");
    expect(saleLog).toBeDefined();
    expect(saleLog?.details).toContain(saleResult.receiptNumber);
  });

  it("matches SME financing options tailored to business metrics (Topic E)", async () => {
    const matches = await service.getFinancingMatches();

    expect(matches.overallHealthScore).toBeGreaterThanOrEqual(50);
    expect(matches.options.length).toBe(4);

    const factoring = matches.options.find((o) => o.type === "invoice_factoring");
    expect(factoring).toBeDefined();
    expect(factoring?.matchScore).toBeGreaterThan(80);
    expect(factoring?.repaymentSchedule).toBe("on_invoice_settlement");

    const workingCapital = matches.options.find((o) => o.type === "working_capital");
    expect(workingCapital).toBeDefined();
    expect(workingCapital?.matchScore).toBeGreaterThan(80);

    const inventoryCredit = matches.options.find((o) => o.type === "inventory_credit");
    expect(inventoryCredit).toBeDefined();
  });
});
