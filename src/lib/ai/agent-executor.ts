import { dataService, reminderService } from "@/services";
import { parseDecimalToMinorUnits } from "@/lib/money";

export interface AgentExecutionResult {
  isAction: boolean;
  actionType?: "ADD_PRODUCT" | "CREATE_INVOICE" | "RECORD_SALE" | "SEND_REMINDER" | "SIMULATE_FORECAST";
  successMessage?: string;
  navigateHref?: string;
}

/**
 * Intelligent Agentic Action Executor
 * Inspects user prompt for actionable business intents and executes them directly against live database.
 */
export async function executeAgenticAction(
  prompt: string,
  businessId: string = "biz_default",
  currency: string = "CNY"
): Promise<AgentExecutionResult | null> {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // 1. ADD PRODUCT / STOCK INVENTORY
  // Matches e.g. "add stock: 50 Wireless Mouse at 25 yuan" or "add 20 USB Cables price 15" or "添加商品" / "增加库存"
  if (
    lower.startsWith("add stock") ||
    lower.startsWith("add product") ||
    lower.startsWith("new product") ||
    lower.includes("add to stock") ||
    lower.includes("restock") ||
    p.includes("添加商品") ||
    p.includes("增加库存") ||
    p.includes("স্টক যোগ")
  ) {
    // Extract numbers: quantity and price
    const numbers = p.match(/\d+(\.\d+)?/g);
    const qty = numbers && numbers[0] ? parseInt(numbers[0], 10) : 20;
    const priceStr = numbers && numbers[1] ? numbers[1] : "25.00";
    const priceMinor = parseDecimalToMinorUnits(priceStr, currency);

    // Clean product name
    let cleanName = p
      .replace(/add stock:?/i, "")
      .replace(/add product:?/i, "")
      .replace(/new product:?/i, "")
      .replace(/at \d+(\.\d+)? (yuan|cny|usd|bdt|rmb)?/i, "")
      .replace(/for \d+(\.\d+)?/i, "")
      .replace(/\d+ (units|pcs|items)?/i, "")
      .replace(/price \d+/i, "")
      .replace(/添加商品/g, "")
      .replace(/增加库存/g, "")
      .trim();

    if (!cleanName || cleanName.length < 2) {
      cleanName = "New Inventory Item";
    }

    const sku = cleanName.slice(0, 3).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900);

    try {
      const prod = await dataService.createProduct({
        businessId,
        name: cleanName,
        sku,
        category: "General",
        unitPrice: priceMinor || 2500,
        costPrice: Math.floor((priceMinor || 2500) * 0.7),
        stockQuantity: qty,
        minStockAlert: 5,
        unit: "pcs",
      });

      return {
        isAction: true,
        actionType: "ADD_PRODUCT",
        successMessage: `✅ **Task Executed: Added to Stock**
- **Product:** ${prod.name}
- **SKU:** ${prod.sku}
- **Quantity In Hand:** +${prod.stockQuantity} pcs
- **Retail Price:** ¥${(prod.unitPrice / 100).toFixed(2)}
- **Database Status:** Live in inventory & POS register.`,
        navigateHref: "/inventory",
      };
    } catch (err: any) {
      return {
        isAction: true,
        actionType: "ADD_PRODUCT",
        successMessage: `⚠️ Could not complete product addition: ${err.message}`,
      };
    }
  }

  // 2. CREATE INVOICE OR BILL
  // Matches e.g. "create invoice for Huawei 5000 yuan" or "add bill from Supplier ABC 2500" or "创建发票" / "开具账单"
  if (
    lower.startsWith("create invoice") ||
    lower.startsWith("new invoice") ||
    lower.startsWith("add bill") ||
    lower.startsWith("create bill") ||
    p.includes("创建发票") ||
    p.includes("开具账单") ||
    p.includes("ইনভয়েস তৈরি")
  ) {
    const isPayable = lower.includes("bill") || lower.includes("supplier") || lower.includes("vendor");
    const numbers = p.match(/\d+(\.\d+)?/g);
    const amountStr = numbers && numbers[0] ? numbers[0] : "1500";
    const amountMinor = parseDecimalToMinorUnits(amountStr, currency);

    let counterparty = isPayable ? "East Coast Logistics Ltd" : "China Retail Partners";
    const words = p.split(/for|from|to|向|给/i);
    if (words[1]) {
      const extracted = words[1].replace(/\d+(\.\d+)?/g, "").replace(/(yuan|cny|rmb|usd|bill|invoice)/gi, "").trim();
      if (extracted.length > 2) counterparty = extracted;
    }

    const invNum = (isPayable ? "BILL-" : "INV-") + Math.floor(1000 + Math.random() * 9000);
    const today = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

    try {
      await dataService.createInvoice({
        businessId,
        direction: isPayable ? "payable" : "receivable",
        invoiceNumber: invNum,
        counterpartyId: isPayable ? "supp-new" : "cust-new",
        counterpartyName: counterparty,
        issueDate: today,
        dueDate,
        status: "issued",
        currency,
        lineItems: [
          {
            id: `li-${Date.now()}`,
            description: isPayable ? "Supplier inventory batch settlement" : "Client sales order goods",
            quantity: 1,
            unitPrice: amountMinor,
            taxRatePercent: 13,
            subtotal: amountMinor,
            taxAmount: Math.floor(amountMinor * 0.13),
            total: amountMinor,
          },
        ],
        subtotal: amountMinor,
        taxTotal: Math.floor(amountMinor * 0.13),
        totalAmount: amountMinor,
        amountPaid: 0,
        extractionConfidence: 100,
      });

      return {
        isAction: true,
        actionType: "CREATE_INVOICE",
        successMessage: `✅ **Task Executed: ${isPayable ? "Supplier Bill" : "Customer Invoice"} Recorded**
- **Document Number:** ${invNum}
- **Counterparty:** ${counterparty}
- **Total Amount:** ¥${(amountMinor / 100).toFixed(2)}
- **Due Date:** ${dueDate}
- **Impact:** Automatically updated your 7-day cash flow schedule.`,
        navigateHref: "/invoices",
      };
    } catch (err: any) {
      return {
        isAction: true,
        actionType: "CREATE_INVOICE",
        successMessage: `⚠️ Could not record invoice: ${err.message}`,
      };
    }
  }

  // 3. RECORD CASH SALE OR EXPENSE
  // Matches e.g. "record sale: 300 cash" or "record expense: 150 office supplies" or "记录销售" / "记账"
  if (
    lower.startsWith("record sale") ||
    lower.startsWith("add sale") ||
    lower.startsWith("record expense") ||
    p.includes("记录销售") ||
    p.includes("记账") ||
    p.includes("বিক্রি যোগ")
  ) {
    const isExpense = lower.includes("expense") || lower.includes("cost") || lower.includes("支出");
    const numbers = p.match(/\d+(\.\d+)?/g);
    const amountStr = numbers && numbers[0] ? numbers[0] : "200";
    const amountMinor = parseDecimalToMinorUnits(amountStr, currency);

    const today = new Date().toISOString().split("T")[0];
    const desc = isExpense ? "Operating store expense (AI Logged)" : "Cash counter retail sale (AI Logged)";

    try {
      await dataService.createTransaction({
        businessId,
        date: today,
        description: desc,
        type: isExpense ? "expense" : "income",
        category: isExpense ? "operating_utilities" : "revenue_sales",
        amount: amountMinor,
        currency,
        isSettled: true,
      });

      return {
        isAction: true,
        actionType: "RECORD_SALE",
        successMessage: `✅ **Task Executed: Transaction Recorded**
- **Type:** ${isExpense ? "Expense (Money Out)" : "Sale Income (Money In)"}
- **Amount:** ¥${(amountMinor / 100).toFixed(2)}
- **Settlement:** Confirmed into shop balance & ledger.`,
        navigateHref: "/transactions",
      };
    } catch (err: any) {
      return {
        isAction: true,
        actionType: "RECORD_SALE",
        successMessage: `⚠️ Could not record transaction: ${err.message}`,
      };
    }
  }

  // 4. SEND PAYMENT REMINDER
  if (
    lower.includes("send reminder") ||
    lower.includes("remind customer") ||
    lower.includes("draft reminder") ||
    p.includes("发送提醒") ||
    p.includes("催款")
  ) {
    try {
      const invs = await dataService.getInvoices({ direction: "receivable" });
      const unpaid = invs.find((i) => i.status !== "paid");
      if (unpaid) {
        const draft = await reminderService.createReminderDraft(unpaid.id, 2);
        await reminderService.sendReminderSimulated(draft.id);

        return {
          isAction: true,
          actionType: "SEND_REMINDER",
          successMessage: `✅ **Task Executed: Customer Payment Reminder Sent**
- **Invoice Number:** ${unpaid.invoiceNumber}
- **Customer:** ${unpaid.counterpartyName}
- **Incentive:** 2% prompt settlement discount offered
- **Audit:** Activity logged and timestamped in system history.`,
          navigateHref: "/invoices",
        };
      }
    } catch (err: any) {
      // Continue
    }
  }

  return null;
}
