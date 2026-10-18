"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Business, Member, Role, ROLE_PERMISSIONS, PermissionMatrix } from "@/domain/types";
import { CountryConfig, COUNTRY_CONFIGS, getCountryConfig } from "@/domain/countries";
import { dataService, authService } from "@/services";
import { mockStore } from "@/services/mock/store";
import { getSupabaseClient } from "@/lib/supabase/client";

export type ThemeMode = "light" | "dark" | "system";

interface AppContextType {
  business: Business | null;
  currentMember: Member | null;
  currentRole: Role;
  permissions: PermissionMatrix;
  countryConfig: CountryConfig;
  activeCurrency: string;
  isSimulatedDemo: boolean;
  isAuthenticated: boolean;
  supabaseUser: { id: string; email: string; name: string } | null;
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  refreshData: () => Promise<void>;
  switchRole: (role: Role) => Promise<void>;
  switchCountryPreset: (countryCode: string) => Promise<void>;
  resetDemo: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "ledger_zero_theme";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>("Owner");
  const [countryConfig, setCountryConfig] = useState<CountryConfig>(COUNTRY_CONFIGS.CN);
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [supabaseUser, setSupabaseUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize theme from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (stored && (stored === "light" || stored === "dark" || stored === "system")) {
        setThemeState(stored);
      }
    } catch {
      // Ignore in SSR
    }
  }, []);

  // Sync theme
  useEffect(() => {
    const applyTheme = () => {
      let isDark = false;
      if (theme === "dark") {
        isDark = true;
      } else if (theme === "system") {
        isDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
      }

      setResolvedTheme(isDark ? "dark" : "light");

      if (typeof document !== "undefined") {
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    applyTheme();

    if (theme === "system" && typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore quota error
    }
  };

  const loadAppState = useCallback(async () => {
    try {
      const [biz, member] = await Promise.all([
        dataService.getBusiness(),
        authService.getCurrentMember(),
      ]);
      setBusiness(biz);
      setCurrentMember(member);
      setCurrentRole(member.role);
      setCountryConfig(getCountryConfig(biz.countryCode));
    } catch (err) {
      console.error("Failed to load initial app context:", err);
    }
  }, []);

  // Listen to Supabase auth state
  useEffect(() => {
    const supabase = getSupabaseClient();

    const syncUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const u = {
          id: user.id,
          email: user.email ?? "",
          name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
        };
        setSupabaseUser(u);
        setIsAuthenticated(true);

        const currentState = mockStore.getState();
        if (
          currentState.business.name.includes("Harbor & Pine") ||
          currentState.currentMemberId !== user.id ||
          currentState.business.openingCashBalance === 1500000 ||
          currentState.transactions.some((t: any) => t.id === "tx-seed-1")
        ) {
          mockStore.initializeFreshUserWorkspace(u);
          loadAppState();
        }
      } else {
        setSupabaseUser(null);
        setIsAuthenticated(false);
      }
    };

    syncUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        const u = {
          id: session.user.id,
          email: session.user.email ?? "",
          name: session.user.user_metadata?.full_name ?? session.user.email?.split("@")[0] ?? "User",
        };
        setSupabaseUser(u);
        setIsAuthenticated(true);

        const currentState = mockStore.getState();
        if (
          currentState.business.name.includes("Harbor & Pine") ||
          currentState.currentMemberId !== session.user.id ||
          currentState.business.openingCashBalance === 1500000 ||
          currentState.transactions.some((t: any) => t.id === "tx-seed-1")
        ) {
          mockStore.initializeFreshUserWorkspace(u);
          loadAppState();
        }
      } else {
        setSupabaseUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadAppState]);

  useEffect(() => {
    loadAppState();
  }, [loadAppState]);

  const switchRole = async (newRole: Role) => {
    try {
      const updated = await authService.switchRole(newRole);
      setCurrentRole(updated.role);
      setCurrentMember(updated);
    } catch (err) {
      console.error("Error switching role:", err);
    }
  };

  const switchCountryPreset = async (countryCode: string) => {
    const config = getCountryConfig(countryCode);
    setCountryConfig(config);
    if (business) {
      const updatedBiz = await dataService.updateBusiness({
        countryCode: config.code,
        currency: config.defaultCurrency,
        taxLabel: config.taxLabel,
        taxRatePercent: config.defaultTaxRatePercent,
        timeZone: config.timeZone,
      });
      setBusiness(updatedBiz);
    }
  };

  const resetDemo = async () => {
    await dataService.resetDemoData();
    await loadAppState();
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setSupabaseUser(null);
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
  };

  const permissions = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.Viewer;

  // isSimulatedDemo = true when no real Supabase session
  const isSimulatedDemo = !isAuthenticated;

  return (
    <AppContext.Provider
      value={{
        business,
        currentMember: supabaseUser
          ? {
              ...(currentMember || {
                id: supabaseUser.id,
                businessId: business?.id || "biz-1",
                role: currentRole,
                createdAt: new Date().toISOString(),
              }),
              name: supabaseUser.name,
              email: supabaseUser.email,
            }
          : currentMember,
        currentRole,
        permissions,
        countryConfig,
        activeCurrency: countryConfig.defaultCurrency,
        isSimulatedDemo,
        isAuthenticated,
        supabaseUser,
        theme,
        resolvedTheme,
        setTheme,
        refreshData: loadAppState,
        switchRole,
        switchCountryPreset,
        resetDemo,
        signOut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
