import { ReminderService } from "../contracts";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Reminder } from "@/domain/types";

export class SupabaseReminderService implements ReminderService {
  private activeBusinessId: string | null = null;

  private async getClient() {
    return getSupabaseClient();
  }

  private async getActiveBusinessId(): Promise<string> {
    if (this.activeBusinessId) return this.activeBusinessId;

    const sb = await this.getClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return "00000000-0000-0000-0000-000000000000";

    const { data: bizList } = await sb
      .from("businesses")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1);

    if (bizList && bizList.length > 0) {
      this.activeBusinessId = bizList[0].id;
      return bizList[0].id;
    }

    return "00000000-0000-0000-0000-000000000000";
  }

  async getReminders(): Promise<Reminder[]> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const { data } = await sb
      .from("system_settings")
      .select("value")
      .eq("key", `reminders_${bizId}`)
      .maybeSingle();

    if (!data || !data.value) return [];
    try {
      return JSON.parse(data.value);
    } catch {
      return [];
    }
  }

  async createReminderDraft(invoiceId: string, discountOfferPercent?: number): Promise<Reminder> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();

    const { data: inv } = await sb
      .from("invoices")
      .select("*, customer:customers(*)")
      .eq("id", invoiceId)
      .maybeSingle();

    if (!inv) throw new Error("Invoice not found");

    const dueDate = new Date(inv.due_date);
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    const daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    const discountText = discountOfferPercent
      ? `\n\nPrompt Settlement Incentive: Settle this invoice within 48 hours to receive an immediate ${discountOfferPercent}% reduction.`
      : "";

    const customerName = inv.customer?.name || "Valued Customer";
    const newReminder: Reminder = {
      id: `rem-${Date.now()}`,
      businessId: bizId,
      invoiceId,
      customerId: inv.customer_id || "cust_unassigned",
      customerName,
      customerEmail: inv.customer?.email || "billing@customer.com",
      invoiceNumber: inv.invoice_number,
      amountDue: Number(inv.total_cents),
      currency: inv.currency || "USD",
      dueDate: inv.due_date,
      daysOverdue,
      subject: `Payment Reminder: Invoice #${inv.invoice_number}`,
      body: `Dear ${customerName},\n\nWe hope this message finds you well. This is a gentle reminder that Invoice #${inv.invoice_number} for $${(
        Number(inv.total_cents) / 100
      ).toFixed(2)} was due on ${inv.due_date} (${daysOverdue} days ago).${discountText}\n\nPlease confirm payment at your earliest convenience.\n\nWarm regards,\nFinance & Accounts Team`,
      discountOfferPercent,
      deliveryMethod: "in_app_simulated",
      deliveryStatus: "draft",
      deliveryNotes: "Personalized reminder generated and queued for dispatch.",
      createdAt: new Date().toISOString(),
    };

    const existing = await this.getReminders();
    const updated = [newReminder, ...existing];

    await sb.from("system_settings").upsert(
      {
        key: `reminders_${bizId}`,
        value: JSON.stringify(updated),
        description: "Customer invoice payment reminders",
      },
      { onConflict: "key" }
    );

    return newReminder;
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();
    const reminders = await this.getReminders();

    const idx = reminders.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Reminder not found");

    reminders[idx] = { ...reminders[idx], ...updates };

    await sb.from("system_settings").upsert(
      {
        key: `reminders_${bizId}`,
        value: JSON.stringify(reminders),
      },
      { onConflict: "key" }
    );

    return reminders[idx];
  }

  async sendReminderSimulated(id: string): Promise<Reminder> {
    const sb = await this.getClient();
    const bizId = await this.getActiveBusinessId();
    const { data: { user } } = await sb.auth.getUser();

    const reminders = await this.getReminders();
    const idx = reminders.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Reminder not found");

    reminders[idx] = {
      ...reminders[idx],
      deliveryStatus: "sent_simulated",
      deliveryNotes: `Dispatched to ${reminders[idx].customerEmail} on ${new Date().toLocaleDateString()}.`,
      sentAt: new Date().toISOString(),
    };

    await sb.from("system_settings").upsert(
      {
        key: `reminders_${bizId}`,
        value: JSON.stringify(reminders),
      },
      { onConflict: "key" }
    );

    // Audit log
    await sb.from("audit_logs").insert({
      business_id: bizId,
      user_id: user?.id || null,
      actor_name: "Shop Owner",
      actor_type: "user",
      action: "SENT_PAYMENT_REMINDER",
      entity_type: "Reminder",
      entity_id: id,
      details: `Sent payment reminder for Invoice #${reminders[idx].invoiceNumber} to ${reminders[idx].customerName}.`,
    });

    return reminders[idx];
  }
}
