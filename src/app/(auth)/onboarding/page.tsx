"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { COUNTRY_CONFIGS } from "@/domain/countries";
import { ArrowRight, CheckCircle2, Building2, DollarSign } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { switchCountryPreset, supabaseUser } = useApp();

  const [bizName, setBizName] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [openingCashStr, setOpeningCashStr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await switchCountryPreset(selectedCountry);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-forest dark:bg-forest-action text-lime-accent font-black text-2xl flex items-center justify-center mx-auto shadow">
            Ø
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-900 tracking-tight">
              Set Up Your Workspace
            </h1>
            <p className="text-sm text-brand-700/60 mt-1">
              {supabaseUser?.name ? `Welcome, ${supabaseUser.name.split(" ")[0]}!` : "Welcome!"} Let&apos;s get your business configured.
            </p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2">
          {["Business Info", "Region & Currency", "Opening Balance"].map((step, i) => (
            <React.Fragment key={step}>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-forest dark:bg-forest-action text-white dark:text-forest flex items-center justify-center text-[11px] font-bold shrink-0">
                  {i + 1}
                </div>
                <span className="text-xs font-medium text-brand-700 hidden sm:block">{step}</span>
              </div>
              {i < 2 && <div className="flex-1 h-px bg-slateSurface-200 max-w-[40px]" />}
            </React.Fragment>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-brand-900 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-brand-700/50" />
                Business Name
              </label>
              <Input
                placeholder="e.g. Harbor & Pine Supply Co."
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-900 mb-1.5">
                Country & Currency
              </label>
              <Select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                options={Object.values(COUNTRY_CONFIGS).map((c) => ({
                  value: c.code,
                  label: `${c.name} — ${c.defaultCurrency} (${c.currencySymbol})`,
                }))}
              />
              <p className="text-[11px] text-brand-700/50 mt-1.5">
                Sets your default currency and number formatting.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-900 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-brand-700/50" />
                Starting Cash Balance (Optional)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 20000.00"
                value={openingCashStr}
                onChange={(e) => setOpeningCashStr(e.target.value)}
              />
              <p className="text-[11px] text-brand-700/50 mt-1.5">
                Your current bank account balance. You can update this later.
              </p>
            </div>

            <div className="pt-2 border-t border-slateSurface-100 flex items-center justify-between">
              <button
                onClick={() => router.push("/sign-in")}
                className="text-xs text-brand-700/50 hover:text-brand-700 transition-colors"
              >
                Back
              </button>

              <Button
                variant="primary"
                size="md"
                onClick={handleComplete}
                isLoading={loading}
                disabled={loading || !bizName.trim()}
              >
                {loading ? "Setting up..." : "Go to Dashboard"}
                {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-brand-700/30">
          You can change all of these settings later from your account settings.
        </p>
      </div>
    </div>
  );
}
