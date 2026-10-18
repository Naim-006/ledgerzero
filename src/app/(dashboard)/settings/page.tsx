"use client";

import React, { useState } from "react";
import { useApp } from "@/context/app-context";
import { dataService } from "@/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { COUNTRY_CONFIGS } from "@/domain/countries";
import { Settings, RotateCcw, CheckCircle2, Globe, Sun, Moon, Laptop } from "lucide-react";

export default function SettingsPage() {
  const {
    business,
    countryConfig,
    theme,
    setTheme,
    switchCountryPreset,
    resetDemo,
    permissions,
  } = useApp();

  const [isSaved, setIsSaved] = useState(false);
  const [businessName, setBusinessName] = useState(business?.name || "Harbor & Pine Supply Co.");
  const [legalName, setLegalName] = useState(business?.legalName || "Harbor & Pine Supply Company LLC");
  const [taxIdentifier, setTaxIdentifier] = useState(business?.taxIdentifier || "US-849201948");
  const [taxRate, setTaxRate] = useState(business?.taxRatePercent.toString() || "8.5");
  const [taxLabel, setTaxLabel] = useState(business?.taxLabel || "Sales Tax");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.updateBusiness({
        name: businessName,
        legalName,
        taxIdentifier,
        taxRatePercent: parseFloat(taxRate) || 0,
        taxLabel,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Save profile failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slateSurface-200">
        <div>
          <h1 className="text-2xl font-bold text-forest tracking-tight flex items-center gap-2">
            System Settings & Profile
          </h1>
          <p className="text-xs text-brand-700/70 mt-1">
            Configure business entity profile, tax identifiers, jurisdictional rules, and display preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Business Entity Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <Input
                label="Display Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />

              <Input
                label="Legal Registered Name"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Tax ID / VAT Registration"
                  value={taxIdentifier}
                  onChange={(e) => setTaxIdentifier(e.target.value)}
                />

                <Input
                  label="Configurable Tax Label"
                  value={taxLabel}
                  onChange={(e) => setTaxLabel(e.target.value)}
                />
              </div>

              <Input
                label="Default Tax Rate (%)"
                type="number"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />

              <div className="pt-2 flex items-center justify-between">
                {isSaved ? (
                  <span className="text-success-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Changes Saved
                  </span>
                ) : <span />}

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!permissions.canMutateFinancialRecords}
                >
                  Save Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Theme & Localization Settings Card */}
        <div className="space-y-6">
          {/* Appearance & Theme Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sun className="w-4 h-4 text-forest-action" />
                Appearance & Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-brand-700/70">
                Choose your preferred interface theme. Setting will be stored in your browser.
              </p>
              <div className="grid grid-cols-3 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-2 transition-all ${
                    theme === "light"
                      ? "border-forest-action bg-brand-50 font-bold text-forest"
                      : "border-slateSurface-200 hover:bg-slateSurface-100 text-brand-800"
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-2 transition-all ${
                    theme === "dark"
                      ? "border-forest-action bg-brand-50 font-bold text-forest"
                      : "border-slateSurface-200 hover:bg-slateSurface-100 text-brand-800"
                  }`}
                >
                  <Moon className="w-5 h-5 text-lime-accent" />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-2 transition-all ${
                    theme === "system"
                      ? "border-forest-action bg-brand-50 font-bold text-forest"
                      : "border-slateSurface-200 hover:bg-slateSurface-100 text-brand-800"
                  }`}
                >
                  <Laptop className="w-5 h-5 text-brand-700" />
                  <span>System</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Localization & Country Config Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-forest-action" />
                Country & Jurisdiction Pack
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-brand-900 block mb-1.5">
                  Active Country Configuration Pack
                </label>
                <Select
                  value={countryConfig.code}
                  onChange={(e) => switchCountryPreset(e.target.value)}
                  options={Object.values(COUNTRY_CONFIGS).map((c) => ({
                    value: c.code,
                    label: `${c.name} (${c.defaultCurrency} - ${c.currencySymbol})`,
                  }))}
                />
                <p className="text-[11px] text-brand-700/60 mt-1">
                  Universal architecture: Adding support for a new country only requires adding a single typed config pack.
                </p>
              </div>

              <div className="p-3.5 bg-slateSurface-50 rounded-xl space-y-2 text-brand-800">
                <div className="flex justify-between">
                  <span className="text-brand-700/60">Currency Code:</span>
                  <span className="font-mono font-bold">{countryConfig.defaultCurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-700/60">Minor Unit Precision:</span>
                  <span className="font-mono font-bold">{countryConfig.minorUnitDecimals} Decimals</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-700/60">Default Time Zone:</span>
                  <span className="font-semibold">{countryConfig.timeZone}</span>
                </div>
              </div>

              {/* Architecture Data Mode Indicator */}
              <div className="pt-2 border-t border-slateSurface-100">
                <span className="font-bold text-brand-900 block mb-1">
                  Backend Connection Status
                </span>
                <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-forest">Supabase Cloud Backend</div>
                    <div className="text-[11px] text-brand-700/70">
                      Live authentication, PostgreSQL database persistence, and sessions active.
                    </div>
                  </div>
                  <Badge variant="lime" size="md">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
