import { ReminderService } from "../contracts";
import { mockStore, simulateDelay } from "./store";
import { Reminder } from "@/domain/types";
import { mockDataService } from "./data-service";

export class MockReminderService implements ReminderService {
  async getReminders(): Promise<Reminder[]> {
    await simulateDelay();
    return mockStore.getState().reminders;
  }

  async createReminderDraft(
    invoiceId: string,
    discountOfferPercent: number = 2
  ): Promise<Reminder> {
    await simulateDelay();
    const inv = await mockDataService.getInvoiceById(invoiceId);
    if (!inv) throw new Error("Invoice not found");

    const cust = await mockDataService.getCustomerById(inv.counterpartyId);

    const draft: Reminder = {
      id: `rem-${Date.now()}`,
      businessId: inv.businessId,
      invoiceId: inv.id,
      customerId: cust?.id || inv.counterpartyId,
      customerName: cust?.name || inv.counterpartyName,
      customerEmail: cust?.email || "billing@customer.com",
      invoiceNumber: inv.invoiceNumber,
      amountDue: inv.totalAmount - (inv.amountPaid || 0),
      currency: inv.currency,
      dueDate: inv.dueDate,
      daysOverdue: 6,
      subject: `Payment Reminder: Overdue invoice ${inv.invoiceNumber} - Early settlement terms`,
      body: `Dear ${cust?.name || "Customer"},\n\nOur records show that invoice ${inv.invoiceNumber} in the amount of $${((inv.totalAmount - inv.amountPaid) / 100).toFixed(2)} was due on ${inv.dueDate}.\n\nTo facilitate working capital planning, we would like to offer a ${discountOfferPercent}% prompt-settlement deduction for full payment received via wire by October 20, 2026.\n\nPlease let us know if you need updated banking details.\n\nBest regards,\nHarbor & Pine Supply Co.`,
      discountOfferPercent,
      deliveryMethod: "in_app_simulated",
      deliveryStatus: "draft",
      deliveryNotes: "Logged in-app (simulated delivery)",
      createdAt: new Date().toISOString(),
    };

    mockStore.addReminder(draft);
    return draft;
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    await simulateDelay();
    mockStore.updateReminder(id, updates);
    const updated = mockStore.getState().reminders.find((r) => r.id === id);
    if (!updated) throw new Error("Reminder not found");
    return updated;
  }

  async sendReminderSimulated(id: string): Promise<Reminder> {
    await simulateDelay(100);
    const reminder = mockStore.getState().reminders.find((r) => r.id === id);
    if (!reminder) throw new Error("Reminder not found");

    mockStore.updateReminder(id, {
      deliveryStatus: "sent_simulated",
      deliveryNotes: "Logged in-app (simulated delivery)",
      sentAt: new Date().toISOString(),
    });

    await mockDataService.logEvent({
      businessId: reminder.businessId,
      actorType: "user",
      actorName: "Active User",
      action: "SENT_REMINDER_SIMULATED",
      targetType: "Reminder",
      targetId: id,
      details: `Dispatched payment reminder for ${reminder.invoiceNumber} to ${reminder.customerEmail}. Status: Logged in-app (simulated delivery).`,
    });

    return mockStore.getState().reminders.find((r) => r.id === id)!;
  }
}

export const mockReminderService = new MockReminderService();
