import { AuthService } from "../contracts";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Member, Business, Role } from "@/domain/types";

export class SupabaseAuthService implements AuthService {
  private activeBusinessId: string | null = null;
  private currentRole: Role = "Owner";

  private async getClient() {
    return getSupabaseClient();
  }

  async getCurrentMember(): Promise<Member> {
    const sb = await this.getClient();
    const { data: { user } } = await sb.auth.getUser();

    if (!user) {
      return {
        id: "mem_unauth",
        businessId: "biz_default",
        name: "Guest",
        email: "guest@ledgerzero.internal",
        role: this.currentRole,
        createdAt: new Date().toISOString(),
      };
    }

    const { data: profile } = await sb
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const roleName = profile?.role
      ? ((profile.role.charAt(0).toUpperCase() + profile.role.slice(1)) as Role)
      : this.currentRole;

    return {
      id: user.id,
      businessId: this.activeBusinessId || "biz_default",
      name: profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Owner",
      email: user.email || "owner@business.com",
      role: roleName,
      createdAt: user.created_at || new Date().toISOString(),
    };
  }

  async switchRole(role: Role): Promise<Member> {
    this.currentRole = role;
    return this.getCurrentMember();
  }

  async switchBusiness(businessId: string): Promise<Business> {
    this.activeBusinessId = businessId;
    const sb = await this.getClient();
    const { data } = await sb.from("businesses").select("*").eq("id", businessId).single();

    return {
      id: data.id,
      name: data.name,
      legalName: data.legal_name || `${data.name} LLC`,
      countryCode: data.country_code || "US",
      currency: data.currency || "USD",
      timeZone: "America/New_York",
      fiscalYearStartMonth: 1,
      taxIdentifier: data.tax_identifier || "",
      taxRatePercent: Number(data.tax_rate_percent) || 0,
      taxLabel: data.tax_label || "Sales Tax",
      openingCashBalance: 0,
      createdAt: data.created_at,
    };
  }
}
