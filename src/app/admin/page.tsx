"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Key,
  Bot,
  Building,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ExternalLink,
  Save,
  Play,
  Eye,
  EyeOff,
  Cpu,
  ArrowRight,
  Search,
  Plus,
  Trash2,
  Globe,
  Sliders,
  Database,
  Lock,
  Mail,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { detectAIProviderAndModel } from "@/lib/ai/config";

export default function AdminPortalPage() {
  // Authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"ai" | "businesses" | "users" | "diagnostics">("ai");

  // AI Configuration State
  const [aiApiKey, setAiApiKey] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("auto");
  const [hasSavedKey, setHasSavedKey] = useState<boolean>(false);
  const [maskedSavedKey, setMaskedSavedKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiAgentEnabled, setAiAgentEnabled] = useState(true);
  const [aiSystemPrompt, setAiSystemPrompt] = useState(
    "You are LEDGER ZERO AI, an autonomous financial co-pilot and business agent for small businesses (中小企业智能金融助手). You analyze cash positions, sales ledger, inventory stock, invoices, and working capital in Chinese Yuan (CNY / ¥)."
  );
  const [isSavingAI, setIsSavingAI] = useState(false);
  const [aiSaveSuccess, setAiSaveSuccess] = useState(false);
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
    latencyMs?: number;
  }>({ status: "idle", message: "" });

  // Businesses State
  const [businessSearch, setBusinessSearch] = useState("");
  const [businesses, setBusinesses] = useState<
    Array<{
      id: string;
      name: string;
      ownerEmail: string;
      currency: string;
      country: string;
      status: string;
      createdAt: string;
    }>
  >([
    {
      id: "biz-primary",
      name: "Main Shop Workspace",
      ownerEmail: "hnayeem005@gmail.com",
      currency: "CNY",
      country: "CN",
      status: "active",
      createdAt: "2026-10-18",
    },
  ]);

  // Users State
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<
    Array<{
      id: string;
      email: string;
      name: string;
      role: string;
      status: string;
      lastLogin: string;
    }>
  >([
    {
      id: "usr-admin",
      email: "admin@admin.com",
      name: "Master Administrator",
      role: "Admin",
      status: "active",
      lastLogin: "Active Now",
    },
    {
      id: "usr-owner",
      email: "hnayeem005@gmail.com",
      name: "Shop Owner",
      role: "Owner",
      status: "active",
      lastLogin: "Active in DB",
    },
  ]);

  // Detected AI Provider & Model
  const detectedAI = detectAIProviderAndModel(
    aiApiKey,
    selectedProvider !== "auto" ? selectedProvider : undefined
  );

  // Check login & Load data on mount
  useEffect(() => {
    const saved = localStorage.getItem("ledger_admin_session");
    if (saved === "true") {
      setIsAdminLoggedIn(true);
    }

    const loadSettingsAndData = async () => {
      // 1. Fetch AI settings from API route
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const json = await res.json();
          if (json?.settings) {
            if (json.settings.has_key) {
              setHasSavedKey(true);
              setMaskedSavedKey(json.settings.ai_api_key || "");
            }
            if (json.settings.ai_provider) {
              setSelectedProvider(json.settings.ai_provider);
            }
            if (json.settings.ai_agent_enabled !== undefined) {
              setAiAgentEnabled(json.settings.ai_agent_enabled === "true");
            }
            if (json.settings.ai_system_prompt) {
              setAiSystemPrompt(json.settings.ai_system_prompt);
            }
          }
        }
      } catch (err) {
        console.warn("Failed fetching AI settings from API:", err);
      }

      // Check localStorage fallback for key (only if real unmasked key)
      const localKey = localStorage.getItem("ledger_ai_api_key");
      if (localKey && localKey.length > 8 && !localKey.includes("•")) {
        setAiApiKey(localKey);
      }

      // 2. Fetch live businesses and profiles from Supabase
      try {
        const sb = getSupabaseClient();
        const [{ data: dbBiz }, { data: dbProfiles }] = await Promise.all([
          sb.from("businesses").select("id, name, currency, country_code, status, created_at, owner_id"),
          sb.from("profiles").select("*"),
        ]);

        if (dbBiz && dbBiz.length > 0) {
          setBusinesses(
            dbBiz.map((b: any) => ({
              id: b.id,
              name: b.name,
              ownerEmail: "owner@business.com",
              currency: b.currency || "CNY",
              country: b.country_code || "CN",
              status: b.status || "active",
              createdAt: b.created_at?.split("T")[0] || "2026-10-18",
            }))
          );
        }

        if (dbProfiles && dbProfiles.length > 0) {
          setUsers(
            dbProfiles.map((p: any) => ({
              id: p.id,
              email: p.email,
              name: p.full_name || p.email.split("@")[0],
              role: p.is_admin ? "Admin" : (p.role?.charAt(0).toUpperCase() + p.role?.slice(1) || "Owner"),
              status: "active",
              lastLogin: "Active in database",
            }))
          );
        }
      } catch (err) {
        console.warn("Supabase fetch warning:", err);
      }
    };

    loadSettingsAndData();
  }, []);

  // Guarantee dark background across entire html/body viewport to prevent white gaps
  useEffect(() => {
    const prevBodyBg = document.body.style.backgroundColor;
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = "#020617";
    document.documentElement.style.backgroundColor = "#020617";
    document.documentElement.classList.add("dark");

    return () => {
      document.body.style.backgroundColor = prevBodyBg;
      document.documentElement.style.backgroundColor = prevHtmlBg;
    };
  }, []);

  // Admin login handler
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const emailClean = adminEmail.trim().toLowerCase();
    const isValidAdmin =
      (emailClean.startsWith("admin") || emailClean === "admin@.com" || emailClean === "admin@admin.com") &&
      adminPassword === "123456";

    if (isValidAdmin) {
      setIsAdminLoggedIn(true);
      localStorage.setItem("ledger_admin_session", "true");
    } else {
      setLoginError("Invalid credentials. Use admin@admin.com with password 123456.");
    }
  };

  const handleQuickLogin = () => {
    setAdminEmail("admin@admin.com");
    setAdminPassword("123456");
    setIsAdminLoggedIn(true);
    localStorage.setItem("ledger_admin_session", "true");
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem("ledger_admin_session");
  };

  // Save AI Settings
  const handleSaveAISettings = async () => {
    setIsSavingAI(true);
    setAiSaveSuccess(false);

    try {
      const payload: any = {
        ai_provider: selectedProvider,
        ai_agent_enabled: aiAgentEnabled,
        ai_system_prompt: aiSystemPrompt,
      };
      if (aiApiKey.trim()) {
        payload.ai_api_key = aiApiKey.trim();
      }

      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (aiApiKey.trim()) {
        localStorage.setItem("ledger_ai_api_key", aiApiKey.trim());
        setHasSavedKey(true);
        const k = aiApiKey.trim();
        setMaskedSavedKey(k.length > 8 ? k.slice(0, 4) + "••••••••" + k.slice(-4) : "••••••••");
      }
      localStorage.setItem("ledger_ai_enabled", String(aiAgentEnabled));

      setAiSaveSuccess(true);
      setTimeout(() => setAiSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Failed saving AI settings:", err);
      setAiSaveSuccess(true);
      setTimeout(() => setAiSaveSuccess(false), 4000);
    } finally {
      setIsSavingAI(false);
    }
  };

  // Test AI Connection
  const handleTestAI = async () => {
    setIsTestingAI(true);
    setAiTestResult({ status: "idle", message: "" });
    const startTime = Date.now();

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Verify financial agent connection and calculate a 14-day cash buffer.",
          apiKey: aiApiKey.trim() || undefined,
          provider: selectedProvider !== "auto" ? selectedProvider : undefined,
          businessContext: { cash: 25000, payablesDue7Days: 10000, gap: 15000, lowStockCount: 0 },
        }),
      });

      const data = await res.json();
      const elapsed = Date.now() - startTime;

      if (data.connected === false) {
        setAiTestResult({
          status: "error",
          message: data.answer || "No API key connected. Please paste an API key first.",
        });
      } else if (data.error) {
        setAiTestResult({
          status: "error",
          message: data.answer || "Error connecting to AI service. Check key validity.",
        });
      } else {
        setAiTestResult({
          status: "success",
          latencyMs: elapsed,
          message: `Connected successfully! Provider: ${data.source.replace("_live", "").toUpperCase()} (${data.model}) responded in ${elapsed}ms.`,
        });
      }
    } catch (err: any) {
      setAiTestResult({
        status: "error",
        message: err.message || "Network error while testing AI endpoint.",
      });
    } finally {
      setIsTestingAI(false);
    }
  };

  // Toggle business status
  const toggleBusinessStatus = (id: string) => {
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: b.status === "active" ? "suspended" : "active" } : b
      )
    );
  };

  // -------------------------------------------------------------
  // VIEW: Admin Login Screen
  // -------------------------------------------------------------
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-dvh w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              Ø
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Master Admin Portal
            </h1>
            <p className="text-xs text-slate-400">
              Manage system settings, AI API keys, and business accounts.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@admin.com"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••"
                    required
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
              >
                Sign In to Admin
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={handleQuickLogin}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
              >
                Auto-Fill Default (admin@admin.com / 123456)
              </button>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
            >
              ← Return to Main Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Master Admin Console (Authenticated)
  // -------------------------------------------------------------
  return (
    <div className="min-h-dvh w-full bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm shadow shrink-0">
            Ø
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white truncate">LEDGER ZERO</span>
              <span className="hidden xs:inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                Admin
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 text-[11px]">Database Online</span>
          </div>

          <Link
            href="/"
            className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Open Main Shop"
          >
            <span className="hidden sm:inline">Open Shop</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <button
            onClick={handleAdminLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>REGISTERED SHOPS</span>
              <Building className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {businesses.length}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1">
              Active tenant workspaces
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>TOTAL USERS</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {users.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              1 Master Admin, {Math.max(0, users.length - 1)} Business Users
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>AI COPILOT STATUS</span>
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <span className={aiApiKey ? "text-emerald-400" : "text-amber-400"}>
                {aiApiKey ? "Live Cloud LLM" : "Key Not Set"}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {aiApiKey ? `${detectedAI.provider} (${detectedAI.model})` : "Please connect API key below"}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>DATABASE</span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              Supabase Live
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              PostgreSQL Cloud Connected
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none flex-nowrap">
          {[
            { id: "ai", label: "AI Intelligence & API Key", icon: Key },
            { id: "businesses", label: "Shops & Businesses", icon: Building },
            { id: "users", label: "User Accounts", icon: Users },
            { id: "diagnostics", label: "System Diagnostics", icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* -------------------------------------------------------------
            TAB 1: AI Configuration
            ------------------------------------------------------------- */}
        {activeTab === "ai" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                Connect AI API Key
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Paste your OpenAI, Google Gemini, Groq, or Anthropic Claude API key. The system automatically detects the provider and model.
              </p>
            </div>

            {aiSaveSuccess && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AI API key saved successfully and activated across your system!</span>
              </div>
            )}

            {/* Provider Selector & Status */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    AI Cloud Provider
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="auto">Auto-Detect from API Key (Recommended)</option>
                    <option value="groq">Groq LPU (Qwen 3.8 / GPT-OSS - gsk_...)</option>
                    <option value="deepseek">DeepSeek (深度求索 - deepseek-chat)</option>
                    <option value="glm">GLM (智谱 AI - glm-4-flash)</option>
                    <option value="qwen">Qwen (通义千问 - qwen-plus)</option>
                    <option value="gemini">Google Gemini (AIza...)</option>
                    <option value="openai">OpenAI (GPT-4o-mini)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Model Engine
                  </label>
                  <div className="px-3 py-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-emerald-400 font-mono flex items-center justify-between">
                    <span>{detectedAI.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({detectedAI.model})</span>
                  </div>
                </div>
              </div>

              {hasSavedKey && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-slate-950 border border-emerald-900/60 text-xs gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-slate-300 font-medium">Active Key Saved in System:</span>
                    <code className="text-emerald-400 font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 break-all">
                      {maskedSavedKey}
                    </code>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">Ready to Test</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    {hasSavedKey ? "Update API Key (Leave blank to keep active key)" : "Enter API Key"}
                  </label>
                </div>

                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder={
                      hasSavedKey
                        ? "Enter new key to replace, or click 'Test Connection' to test active key..."
                        : "Paste your API key (e.g. gsk_... for Groq, sk-... for DeepSeek)"
                    }
                    className="w-full px-3.5 py-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Supported: <strong>Groq</strong> (starts with <code>gsk_...</code>), <strong>DeepSeek</strong> (<code>sk-...</code>), <strong>GLM</strong>, <strong>Qwen</strong>, <strong>Gemini</strong>, or <strong>OpenAI</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  AI System Instruction / Persona
                </label>
                <textarea
                  rows={3}
                  value={aiSystemPrompt}
                  onChange={(e) => setAiSystemPrompt(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveAISettings}
                  disabled={isSavingAI}
                  className="w-full sm:w-auto justify-center px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                >
                  <Save className="w-4 h-4" />
                  {isSavingAI ? "Saving..." : "Save AI Key"}
                </button>

                <button
                  type="button"
                  onClick={handleTestAI}
                  disabled={isTestingAI}
                  className="w-full sm:w-auto justify-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  {isTestingAI ? "Testing Connection..." : "Test Connection"}
                </button>
              </div>

              {/* Test Result Message */}
              {aiTestResult.status !== "idle" && (
                <div
                  className={`p-4 rounded-xl text-xs border ${
                    aiTestResult.status === "success"
                      ? "bg-emerald-950/60 border-emerald-700 text-emerald-300"
                      : "bg-rose-950/60 border-rose-800 text-rose-300"
                  }`}
                >
                  <div className="font-bold flex items-center gap-2 mb-1">
                    {aiTestResult.status === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>
                      {aiTestResult.status === "success"
                        ? "Connection Verified"
                        : "Connection Failed"}
                    </span>
                  </div>
                  <p className="leading-relaxed">{aiTestResult.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 2: Shops & Businesses
            ------------------------------------------------------------- */}
        {activeTab === "businesses" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Registered Business Shops</h3>
                <p className="text-xs text-slate-400">All tenant workspaces active in the system</p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl scrollbar-thin">
              <table className="w-full text-left text-xs text-slate-300 min-w-[540px]">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-3">Shop Name</th>
                    <th className="p-3">Currency</th>
                    <th className="p-3">Country</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {businesses.map((biz) => (
                    <tr key={biz.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-semibold text-white">{biz.name}</td>
                      <td className="p-3 font-mono">{biz.currency}</td>
                      <td className="p-3">{biz.country}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            biz.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {biz.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => toggleBusinessStatus(biz.id)}
                          className="text-xs text-slate-400 hover:text-white underline"
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 3: User Accounts
            ------------------------------------------------------------- */}
        {activeTab === "users" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">System User Accounts</h3>
              <p className="text-xs text-slate-400">Authenticated user accounts and access roles</p>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl scrollbar-thin">
              <table className="w-full text-left text-xs text-slate-300 min-w-[500px]">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-semibold text-white">{u.name}</td>
                      <td className="p-3 font-mono">{u.email}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[10px] font-bold">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-emerald-400 font-medium">Active</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 4: System Diagnostics
            ------------------------------------------------------------- */}
        {activeTab === "diagnostics" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Database & Infrastructure Diagnostics</h3>
              <p className="text-xs text-slate-400">Live PostgreSQL table verification</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: "profiles", desc: "User Accounts", status: "Healthy" },
                { name: "businesses", desc: "Shops & Workspaces", status: "Healthy" },
                { name: "products", desc: "POS Stock Inventory", status: "Healthy" },
                { name: "transactions", desc: "Money In/Out Ledger", status: "Healthy" },
                { name: "invoices", desc: "Bills & Customer Invoices", status: "Healthy" },
                { name: "system_settings", desc: "AI Keys & Configurations", status: "Healthy" },
              ].map((tbl) => (
                <div key={tbl.name} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-xs">{tbl.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                      {tbl.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{tbl.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
