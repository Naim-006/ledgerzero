import { dataService, reminderService } from "@/services";
import { parseDecimalToMinorUnits, formatMinorUnits } from "@/lib/money";
import { PosSaleItem } from "@/domain/types";

export interface AgentExecutionResult {
  isAction: boolean;
  actionType?:
    | "ADD_PRODUCT"
    | "CREATE_INVOICE"
    | "CREATE_BILL"
    | "RECORD_SALE"
    | "RECORD_EXPENSE"
    | "SEND_REMINDER"
    | "SUGGESTIONS";
  successMessage?: string;
  navigateHref?: string;
  suggestedActions?: string[];
}

// Realistic Small Business Data Pools for Autonomous Generation
const SAMPLE_CUSTOMERS = [
  "Shanghai Horizon Retail Ltd (上海地平线零售)",
  "Shenzhen Apex Trading Co. (深圳顶峰贸易)",
  "Metro Tech Solutions Ltd (美罗科技)",
  "Guangzhou Global Commerce (广州环球商贸)",
  "Beijing Nexus Logistics (北京枢纽物流)",
  "Hangzhou Digital Mart (杭州数码超市)",
  "Chengdu Pioneer Wholesale (成都先锋批发)",
];

const SAMPLE_SUPPLIERS = [
  "East Coast Logistics Ltd (华东物流集团)",
  "Shenzhen Micro-Chip Electronics (微芯电子配件)",
  "Golden Harvest Raw Materials (金禾原材料供应)",
  "Evergreen Packaging Solutions (长青环保包装)",
  "Zhejiang Supply Chain Partners (浙江供应链联盟)",
  "Pacific Freight Forwarders (太平洋货运)",
  "National Power & Telecom Utilities (国家动力与通讯服务)",
];

const SAMPLE_INVOICE_ITEMS = [
  { desc: "Wholesale Consumer Merchandise Batch", unitPrice: 2800 },
  { desc: "Commercial Software & SLA Maintenance", unitPrice: 4500 },
  { desc: "Hardware Peripherals & Cable Accessories", unitPrice: 1900 },
  { desc: "Custom Branded Merchandise Display Units", unitPrice: 3200 },
  { desc: "Storefront POS Hardware Deployment", unitPrice: 5800 },
];

const SAMPLE_BILL_ITEMS = [
  { desc: "Bulk Inventory Replenishment Consignment", unitPrice: 3200 },
  { desc: "Commercial Freight & Express Dispatch", unitPrice: 1450 },
  { desc: "Warehouse Facility Rent & Utility Operations", unitPrice: 4200 },
  { desc: "Eco-Friendly Packaging & Boxes (1,000 units)", unitPrice: 1850 },
  { desc: "Cloud Hosting & Automated Backup Infrastructure", unitPrice: 950 },
];

const SAMPLE_CATALOG_PRODUCTS = [
  { name: "Artisan Coffee Beans (250g)", sku: "COF-001", category: "Beverages", unitPrice: 2900, costPrice: 1400, unit: "bag" },
  { name: "Organic Green Tea (50 bags)", sku: "TEA-002", category: "Beverages", unitPrice: 1900, costPrice: 900, unit: "box" },
  { name: "Wireless Bluetooth Mouse", sku: "TECH-101", category: "Electronics", unitPrice: 5600, costPrice: 2800, unit: "pcs" },
  { name: "Braided USB-C Cable (2m)", sku: "TECH-102", category: "Electronics", unitPrice: 2400, costPrice: 950, unit: "pcs" },
  { name: "Hardcover Executive Notebook", sku: "STAT-201", category: "Stationery", unitPrice: 3200, costPrice: 1500, unit: "pcs" },
  { name: "Premium Ballpoint Pen Set", sku: "STAT-202", category: "Stationery", unitPrice: 1700, costPrice: 700, unit: "set" },
  { name: "Organic Almond Snack Pack", sku: "SNK-301", category: "Grocery", unitPrice: 1100, costPrice: 550, unit: "pack" },
  { name: "Canvas Reusable Shopping Tote", sku: "APP-401", category: "Apparel", unitPrice: 1400, costPrice: 500, unit: "pcs" },
  { name: "Ergonomic Desk Phone Stand", sku: "TECH-103", category: "Electronics", unitPrice: 3800, costPrice: 1800, unit: "pcs" },
  { name: "Thermal Insulated Travel Mug", sku: "LIF-501", category: "Lifestyle", unitPrice: 4500, costPrice: 2100, unit: "pcs" },
];

const SAMPLE_EXPENSES = [
  { desc: "Store electricity & energy utility bill", category: "operating_utilities", min: 25000, max: 65000 },
  { desc: "Express delivery & local courier dispatch", category: "operating_shipping", min: 8000, max: 25000 },
  { desc: "High-speed business fiber broadband", category: "operating_utilities", min: 18000, max: 35000 },
  { desc: "Store hygiene & sanitization restocking", category: "operating_other", min: 12000, max: 28000 },
];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Highly Autonomous Agentic Action Executor
 * Understands both structured commands and casual natural language requests:
 * "sell something", "random bill", "generate invoice", "restock items", "suggest something"
 */
export async function executeAgenticAction(
  prompt: string,
  businessId: string = "biz_default",
  currency: string = "CNY"
): Promise<AgentExecutionResult | null> {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  const formatCurr = (cents: number) => formatMinorUnits(cents, currency);

  // =========================================================================
  // 1. SMART SUGGESTIONS ("what can you do?", "suggest something", "help me")
  // =========================================================================
  if (
    lower === "suggest" ||
    lower.startsWith("suggest") ||
    lower.includes("what can you do") ||
    lower.includes("suggest something") ||
    lower.includes("give me options") ||
    lower.includes("what can i do") ||
    lower.includes("help me") ||
    p.includes("建议") ||
    p.includes("你能做什么") ||
    p.includes("পরামর্শ")
  ) {
    try {
      const prods = await dataService.getProducts();
      const inStock = prods.filter((pr) => pr.stockQuantity > 0);
      const sampleProd = inStock.length > 0 ? getRandom(inStock) : getRandom(SAMPLE_CATALOG_PRODUCTS);

      return {
        isAction: true,
        actionType: "SUGGESTIONS",
        successMessage: `🤖 **Autonomous AI Agent Ready!**
Here are high-impact actions I can perform immediately for your business without requiring manual forms:

1. 🛒 **Instant POS Sale:** Sell an in-stock item (deducts inventory, records cash, issues receipt).
2. 📄 **Generate Customer Invoice:** Bill a client with realistic line items and VAT.
3. 📦 **Record Supplier Bill:** Log incoming vendor payable to track 7-day cash flow.
4. 📦 **Restock Inventory:** Add new products with automatic SKUs and prices.
5. 🔔 **Send Payment Reminder:** Promptly recover receivables with a 2% discount incentive.

Tap any quick action below to run it now:`,
        suggestedActions: [
          `Sell 1x ${sampleProd.name} (${formatCurr(sampleProd.unitPrice)})`,
          "Generate a random customer invoice",
          "Generate a random supplier bill",
          "Add random stock item",
        ],
      };
    } catch {
      // Continue to other matches
    }
  }

  // =========================================================================
  // 2. RECORD POS SALE / SELL PRODUCT ("sell something", "random sell", "sell 2 coffee")
  // =========================================================================
  const isSellIntent =
    lower.includes("sell") ||
    lower.includes("sale") ||
    lower.includes("pos") ||
    lower.includes("sold") ||
    p.includes("销售") ||
    p.includes("卖出") ||
    p.includes("收银") ||
    p.includes("বিক্রি");

  if (isSellIntent && !lower.includes("invoice") && !lower.includes("bill")) {
    try {
      let prods = await dataService.getProducts();

      // If no products exist in the store, seed starter products first
      if (!prods || prods.length === 0) {
        for (const item of SAMPLE_CATALOG_PRODUCTS.slice(0, 4)) {
          await dataService.createProduct({
            businessId,
            name: item.name,
            sku: item.sku,
            category: item.category,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            stockQuantity: 40,
            minStockAlert: 5,
            unit: item.unit,
          });
        }
        prods = await dataService.getProducts();
      }

      // Check if user specifically named a product
      let targetProduct = prods.find((prod) =>
        lower.includes(prod.name.toLowerCase()) ||
        lower.includes(prod.category.toLowerCase()) ||
        lower.includes(prod.sku.toLowerCase())
      );

      // Otherwise pick an in-stock product, or the product with most stock
      if (!targetProduct) {
        const inStock = prods.filter((pr) => pr.stockQuantity > 0);
        targetProduct = inStock.length > 0 ? getRandom(inStock) : prods[0];
      }

      // Extract quantity from prompt or pick random 1-2 pcs
      const numbers = p.match(/\b\d+\b/g);
      let qty = numbers && numbers[0] ? parseInt(numbers[0], 10) : Math.floor(Math.random() * 2) + 1;
      if (qty <= 0) qty = 1;
      if (qty > 10) qty = 3;

      // Ensure stock quantity isn't exceeded, restock if necessary
      if (targetProduct.stockQuantity < qty) {
        await dataService.updateProduct(targetProduct.id, {
          stockQuantity: targetProduct.stockQuantity + 30,
        });
        targetProduct.stockQuantity += 30;
      }

      const saleItem: PosSaleItem = {
        productId: targetProduct.id,
        productName: targetProduct.name,
        sku: targetProduct.sku,
        unitPrice: targetProduct.unitPrice,
        quantity: qty,
        subtotal: targetProduct.unitPrice * qty,
      };

      const customerNames = ["Walk-in Customer", "Regular VIP Client", "Ms. Zhang (Zhang Wei)", "Mr. Liu (Local Patron)"];
      const customerName = getRandom(customerNames);

      const saleResult = await dataService.recordPosSale({
        items: [saleItem],
        customerName,
        paymentMethod: "cash",
        taxRatePercent: 0,
        notes: "Autonomous POS sale executed via AI Financial Agent",
      });

      const updatedProd = await dataService.getProductById(targetProduct.id);
      const remainingStock = updatedProd ? updatedProd.stockQuantity : targetProduct.stockQuantity - qty;

      return {
        isAction: true,
        actionType: "RECORD_SALE",
        successMessage: `🎉 **POS Sale Executed Successfully!**
- **Receipt No:** \`${saleResult.receiptNumber}\`
- **Customer:** ${customerName}
- **Item Sold:** ${qty}x **${targetProduct.name}**
- **Unit Price:** ${formatCurr(targetProduct.unitPrice)}
- **Total Received (Cash):** **${formatCurr(saleResult.totalPaid)}**
- **Remaining Stock:** ${remainingStock} ${targetProduct.unit || "pcs"} left
- **Ledger Impact:** Added to cash on hand & logged in POS audit trail.`,
        navigateHref: "/pos",
        suggestedActions: [
          "Sell another item",
          "Generate a random customer invoice",
          "Generate a random supplier bill",
          "Check cash flow forecast",
        ],
      };
    } catch (err: any) {
      return {
        isAction: true,
        actionType: "RECORD_SALE",
        successMessage: `⚠️ Failed executing sale: ${err.message}`,
      };
    }
  }

  // =========================================================================
  // 3. CREATE / GENERATE SUPPLIER BILL ("random bill", "generate a bill", "add bill")
  // =========================================================================
  const isBillIntent =
    lower.includes("bill") ||
    lower.includes("payable") ||
    lower.includes("supplier") ||
    lower.includes("vendor") ||
    p.includes("账单") ||
    p.includes("供应商") ||
    p.includes("বিল");

  if (isBillIntent) {
    // Extract amount if user supplied any, else pick realistic random amount (¥1,200 ~ ¥5,800)
    const numbers = p.match(/\d+(\.\d+)?/g);
    let amountMinor = 0;
    if (numbers && numbers[0] && parseFloat(numbers[0]) > 0) {
      amountMinor = parseDecimalToMinorUnits(numbers[0], currency);
    } else {
      amountMinor = Math.floor(Math.random() * 46 + 12) * 10000; // e.g. 120,000 to 580,000 cents (¥1,200 - ¥5,800)
    }

    const supplierName = getRandom(SAMPLE_SUPPLIERS);
    const itemTemplate = getRandom(SAMPLE_BILL_ITEMS);
    const billNum = "BILL-" + Math.floor(1000 + Math.random() * 9000);
    const today = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + (Math.floor(Math.random() * 7) + 7) * 86400000)
      .toISOString()
      .split("T")[0];

    try {
      const invoice = await dataService.createInvoice({
        businessId,
        direction: "payable",
        invoiceNumber: billNum,
        counterpartyId: `supp-${Date.now()}`,
        counterpartyName: supplierName,
        issueDate: today,
        dueDate,
        status: "issued",
        currency,
        lineItems: [
          {
            id: `li-${Date.now()}`,
            description: itemTemplate.desc,
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
        actionType: "CREATE_BILL",
        successMessage: `🧾 **Supplier Bill Recorded Successfully!**
- **Bill Reference:** \`${invoice.invoiceNumber}\`
- **Supplier:** ${supplierName}
- **Description:** ${itemTemplate.desc}
- **Total Amount Due:** **${formatCurr(amountMinor)}**
- **Due Date:** ${dueDate} (Scheduled in payables)
- **Status:** Issued (Awaiting Settlement)
- **Cash Impact:** Added to upcoming 7-day cash outflow forecast.`,
        navigateHref: "/invoices",
        suggestedActions: [
          "Generate a random customer invoice",
          "Sell an item in POS",
          "Check cash flow forecast",
          "View Invoices",
        ],
      };
    } catch (err: any) {
      return {
        isAction: true,
        actionType: "CREATE_BILL",
        successMessage: `⚠️ Failed creating bill: ${err.message}`,
      };
    }
  }

  // =========================================================================
  // 4. CREATE / GENERATE CUSTOMER INVOICE ("random invoice", "generate invoice", "create invoice")
  // =========================================================================
  const isInvoiceIntent =
    lower.includes("invoice") ||
    lower.includes("receivable") ||
    lower.includes("client bill") ||
    p.includes("发票") ||
    p.includes("客户账单") ||
    p.includes("ইনভয়েস");

  if (isInvoiceIntent) {
    const numbers = p.match(/\d+(\.\d+)?/g);
    let amountMinor = 0;
    if (numbers && numbers[0] && parseFloat(numbers[0]) > 0) {
      amountMinor = parseDecimalToMinorUnits(numbers[0], currency);
    } else {
      amountMinor = Math.floor(Math.random() * 55 + 25) * 10000; // ¥2,500 ~ ¥8,000
    }

    const customerName = getRandom(SAMPLE_CUSTOMERS);
    const itemTemplate = getRandom(SAMPLE_INVOICE_ITEMS);
    const invNum = "INV-" + Math.floor(1000 + Math.random() * 9000);
    const today = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

    try {
      const invoice = await dataService.createInvoice({
        businessId,
        direction: "receivable",
        invoiceNumber: invNum,
        counterpartyId: `cust-${Date.now()}`,
        counterpartyName: customerName,
        issueDate: today,
        dueDate,
        status: "issued",
        currency,
        lineItems: [
          {
            id: `li-${Date.now()}`,
            description: itemTemplate.desc,
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
        successMessage: `📄 **Customer Invoice Created Successfully!**
- **Invoice Number:** \`${invoice.invoiceNumber}\`
- **Customer:** ${customerName}
- **Item / Service:** ${itemTemplate.desc}
- **Total Amount:** **${formatCurr(amountMinor)}** (incl. 13% VAT)
- **Payment Terms:** Net 14 Days (Due ${dueDate})
- **Status:** Issued (Awaiting Customer Payment)
- **Cash Impact:** Added to expected customer receivables.`,
        navigateHref: "/invoices",
        suggestedActions: [
          "Send Payment Reminder",
          "Generate a random supplier bill",
          "Sell an item in POS",
          "View Invoices",
        ],
      };
    } catch (err: any) {
      return {
        isAction: true,
        actionType: "CREATE_INVOICE",
        successMessage: `⚠️ Failed creating invoice: ${err.message}`,
      };
    }
  }

  // =========================================================================
  // 5. ADD PRODUCT / RESTOCK INVENTORY ("add stock", "random product", "restock")
  // =========================================================================
  const isProductIntent =
    lower.includes("stock") ||
    lower.includes("product") ||
    lower.includes("item") ||
    lower.includes("inventory") ||
    lower.includes("restock") ||
    p.includes("添加商品") ||
    p.includes("增加库存") ||
    p.includes("补货") ||
    p.includes("স্টক");

  if (isProductIntent) {
    const numbers = p.match(/\d+(\.\d+)?/g);
    const qty = numbers && numbers[0] ? parseInt(numbers[0], 10) : Math.floor(Math.random() * 30 + 20);

    const catalogChoice = getRandom(SAMPLE_CATALOG_PRODUCTS);
    let cleanName = catalogChoice.name;

    // Check if user specified a name
    const stripped = p
      .replace(/add stock:?/i, "")
      .replace(/add product:?/i, "")
      .replace(/new product:?/i, "")
      .replace(/random product:?/i, "")
      .replace(/restock:?/i, "")
      .replace(/\d+(\.\d+)?/g, "")
      .replace(/(yuan|cny|usd|rmb|pcs|units|items)/gi, "")
      .replace(/添加商品/g, "")
      .replace(/增加库存/g, "")
      .trim();

    if (stripped.length > 2 && !stripped.toLowerCase().includes("random")) {
      cleanName = stripped;
    }

    const sku = cleanName.slice(0, 3).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900);
    const priceMinor = catalogChoice.unitPrice;
    const costMinor = catalogChoice.costPrice;

    try {
      const prod = await dataService.createProduct({
        businessId,
        name: cleanName,
        sku,
        category: catalogChoice.category || "General",
        unitPrice: priceMinor,
        costPrice: costMinor,
        stockQuantity: qty,
        minStockAlert: 5,
        unit: catalogChoice.unit || "pcs",
      });

      return {
        isAction: true,
        actionType: "ADD_PRODUCT",
        successMessage: `📦 **Inventory Restocked Successfully!**
- **Product Name:** ${prod.name}
- **SKU Code:** \`${prod.sku}\`
- **Quantity Added:** +${prod.stockQuantity} ${prod.unit}
- **Selling Price:** ${formatCurr(prod.unitPrice)}
- **Cost Price:** ${formatCurr(prod.costPrice)}
- **Store Status:** Available immediately in POS Register.`,
        navigateHref: "/inventory",
        suggestedActions: [
          `Sell 1x ${prod.name}`,
          "View Inventory",
          "Generate a random customer invoice",
          "Add another product",
        ],
      };
    } catch (err: any) {
      return {
        isAction: true,
        actionType: "ADD_PRODUCT",
        successMessage: `⚠️ Failed adding product: ${err.message}`,
      };
    }
  }

  // =========================================================================
  // 6. RECORD EXPENSE ("record expense", "random expense", "operating cost")
  // =========================================================================
  const isExpenseIntent =
    lower.includes("expense") ||
    lower.includes("spending") ||
    lower.includes("cost") ||
    p.includes("记录支出") ||
    p.includes("记账") ||
    p.includes("খরচ");

  if (isExpenseIntent) {
    const expenseTemplate = getRandom(SAMPLE_EXPENSES);
    const numbers = p.match(/\d+(\.\d+)?/g);
    let amountMinor = 0;
    if (numbers && numbers[0] && parseFloat(numbers[0]) > 0) {
      amountMinor = parseDecimalToMinorUnits(numbers[0], currency);
    } else {
      amountMinor = Math.floor(Math.random() * 200 + 100) * 100; // ¥100 - ¥300
    }

    const today = new Date().toISOString().split("T")[0];

    try {
      await dataService.createTransaction({
        businessId,
        date: today,
        description: expenseTemplate.desc,
        type: "expense",
        category: expenseTemplate.category as any,
        amount: amountMinor,
        currency,
        isSettled: true,
      });

      return {
        isAction: true,
        actionType: "RECORD_EXPENSE",
        successMessage: `💸 **Operating Expense Recorded!**
- **Description:** ${expenseTemplate.desc}
- **Amount Deducted:** **${formatCurr(amountMinor)}**
- **Date Settled:** ${today}
- **Ledger Impact:** Recorded in cash transactions & updated net operating balance.`,
        navigateHref: "/transactions",
        suggestedActions: [
          "Check cash flow forecast",
          "Sell an item in POS",
          "Generate a random customer invoice",
        ],
      };
    } catch (err: any) {
      return {
        isAction: true,
        actionType: "RECORD_EXPENSE",
        successMessage: `⚠️ Could not record expense: ${err.message}`,
      };
    }
  }

  // =========================================================================
  // 7. SEND PAYMENT REMINDER ("send reminder", "remind customer", "chase unpaid")
  // =========================================================================
  if (
    lower.includes("reminder") ||
    lower.includes("remind") ||
    lower.includes("overdue") ||
    lower.includes("chase") ||
    p.includes("提醒") ||
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
          successMessage: `🔔 **Automated Payment Reminder Dispatched!**
- **Target Invoice:** \`${unpaid.invoiceNumber}\`
- **Customer:** ${unpaid.counterpartyName}
- **Balance Outstanding:** ${formatCurr(unpaid.totalAmount - (unpaid.amountPaid || 0))}
- **Incentive Applied:** 2% prompt settlement cash discount
- **Delivery:** Simulated multi-channel notice (WeChat Work / Email) recorded in audit history.`,
          navigateHref: "/invoices",
          suggestedActions: [
            "Check cash flow forecast",
            "Generate a random supplier bill",
            "Sell an item in POS",
          ],
        };
      } else {
        return {
          isAction: true,
          actionType: "SEND_REMINDER",
          successMessage: `✅ **All customer invoices are currently settled!**
No overdue customer accounts need collection at this time.`,
          suggestedActions: [
            "Generate a random customer invoice",
            "Sell an item in POS",
            "Check cash flow forecast",
          ],
        };
      }
    } catch (err: any) {
      // Continue
    }
  }

  return null;
}
