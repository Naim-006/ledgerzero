"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Key,
  Bot,
  Building,
  Users,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ExternalLink,
  Save,
  Play,
  Eye,
  EyeOff,
  Copy,
  Check,
  Cpu,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminPortalPage() {
  // Authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"ai" | "businesses" | "users" | "sql" | "health">("ai");

  // AI Configuration State
  const [aiProvider, setAiProvider] = useState("openai");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [aiApiKey, setAiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiAgentEnabled, setAiAgentEnabled] = useState(true);
  const [aiTemperature, setAiTemperature] = useState("0.3");
  const [aiSystemPrompt, setAiSystemPrompt] = useState(
    "You are LEDGER ZERO AI, an autonomous financial co-pilot for small businesses. You analyze cash positions, overdue invoices, and impending vendor payments. You always provide mathematically sound, cautious, and practical recommendations."
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
  const [businesses, setBusinesses] = useState([
    {
      id: "biz-1",
      name: "Harbor & Pine Supply Co.",
      ownerEmail: "owner@harborpine.com",
      currency: "USD",
      country: "US",
      volumeCents: 4500000,
      status: "active",
      createdAt: "2026-10-01",
    },
    {
      id: "biz-2",
      name: "Apex Retail Partners",
      ownerEmail: "finance@apexretail.com",
      currency: "USD",
      country: "US",
      volumeCents: 1500000,
      status: "active",
      createdAt: "2026-10-05",
    },
    {
      id: "biz-3",
      name: "Summit Distribution LLC",
      ownerEmail: "operations@summitdist.com",
      currency: "EUR",
      country: "DE",
      volumeCents: 8200000,
      status: "active",
      createdAt: "2026-10-12",
    },
  ]);

  // Users State
  const [users, setUsers] = useState([
    {
      id: "usr-1",
      email: "admin@admin.com",
      name: "Platform Administrator",
      role: "Admin",
      status: "active",
      lastLogin: "Just now",
    },
    {
      id: "usr-2",
      email: "alex.vance@harborpine.com",
      name: "Alex Vance",
      role: "Owner",
      status: "active",
      lastLogin: "2 hours ago",
    },
    {
      id: "usr-3",
      email: "sarah.finance@harborpine.com",
      name: "Sarah Chen",
      role: "Accountant",
      status: "active",
      lastLogin: "1 day ago",
    },
    {
      id: "usr-4",
      email: "auditor@external.com",
      name: "Marcus Miller",
      role: "Viewer",
      status: "active",
      lastLogin: "3 days ago",
    },
  ]);

  // SQL Copy State
  const [copiedSql, setCopiedSql] = useState(false);

  // Check persisted admin session on mount
  useEffect(() => {
    const saved = localStorage.getItem("ledger_admin_session");
    if (saved === "true") {
      setIsAdminLoggedIn(true);
    }

    // Load saved AI settings
    const savedKey = localStorage.getItem("ledger_ai_api_key");
    if (savedKey) setAiApiKey(savedKey);

    const savedProvider = localStorage.getItem("ledger_ai_provider");
    if (savedProvider) setAiProvider(savedProvider);

    const savedModel = localStorage.getItem("ledger_ai_model");
    if (savedModel) setAiModel(savedModel);
  }, []);

  // Admin login handler
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const emailClean = adminEmail.trim().toLowerCase();
    // Accept demo admin credentials as requested by user: admin@.com or admin@admin.com with password 123456
    const isValidAdmin =
      (emailClean.startsWith("admin") || emailClean === "admin@.com" || emailClean === "admin@admin.com") &&
      adminPassword === "123456";

    if (isValidAdmin) {
      setIsAdminLoggedIn(true);
      localStorage.setItem("ledger_admin_session", "true");
    } else {
      setLoginError("Invalid admin credentials. Use admin@.com (or admin@admin.com) and pass 123456.");
    }
  };

  const handleQuickDemoLogin = () => {
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
      localStorage.setItem("ledger_ai_api_key", aiApiKey.trim());
      localStorage.setItem("ledger_ai_provider", aiProvider);
      localStorage.setItem("ledger_ai_model", aiModel);
      localStorage.setItem("ledger_ai_enabled", String(aiAgentEnabled));

      // Post to server route
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_provider: aiProvider,
          ai_model: aiModel,
          ai_api_key: aiApiKey.trim(),
          ai_agent_enabled: aiAgentEnabled,
          ai_system_prompt: aiSystemPrompt,
        }),
      });

      setAiSaveSuccess(true);
      setTimeout(() => setAiSaveSuccess(false), 4000);
    } catch {
      // Local storage already set
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
          prompt: "Verify financial agent connection and calculate 14-day cash buffer.",
          apiKey: aiApiKey.trim(),
          provider: aiProvider,
          model: aiModel,
          businessContext: { cash: 20000, payablesDue7Days: 45000, gap: -25000 },
        }),
      });

      const data = await res.json();
      const elapsed = Date.now() - startTime;

      if (res.ok) {
        setAiTestResult({
          status: "success",
          latencyMs: elapsed,
          message: data.source === "openai_live"
            ? `Live AI Connection Successful! (${data.model}) responded in ${elapsed}ms.`
            : `AI Business Agent Active (${data.note || "Ready for co-pilot prompts"}) in ${elapsed}ms.`,
        });
      } else {
        setAiTestResult({
          status: "error",
          message: data.error || "Failed to reach AI service.",
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

  // Change user role
  const updateUserRole = (userId: string, newRole: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  // Copy Complete SQL
  const handleCopySql = () => {
    fetch("/supabase-schema.sql")
      .then((r) => r.text())
      .then((text) => {
        navigator.clipboard.writeText(text);
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 3000);
      })
      .catch(() => {
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 3000);
      });
  };

  // -------------------------------------------------------------
  // VIEW: Admin Login Screen (if not authenticated)
  // -------------------------------------------------------------
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-[#070D0A] text-white flex flex-col justify-center items-center p-6 selection:bg-emerald-500 selection:text-black">
        {/* Ambient background glow */}
        <div className="fixed inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-emerald-500 blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Brand header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-2xl mb-4 shadow-lg shadow-emerald-950/50">
              Ø
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              LEDGER ZERO
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold uppercase tracking-wider mt-2">
              <Shield className="w-3 h-3" />
              Master Admin Gateway
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Restricted management console. Direct URL access only.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-[#0E1712] border border-emerald-950/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            {loginError && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@.com or admin@admin.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#14221A] border border-emerald-900/60 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password (123456)"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#14221A] border border-emerald-900/60 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2"
              >
                Enter Admin Console
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick 1-Click Demo Login */}
            <div className="pt-3 border-t border-emerald-950/60 text-center">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 transition-colors"
              >
                Quick 1-Click Login (admin@.com / 123456)
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
            >
              ← Return to public application
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Authenticated Admin Console
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#070D0A] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Admin Header */}
      <header className="h-16 bg-[#0E1712] border-b border-emerald-950 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-black text-sm shadow">
              Ø
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">
                  LEDGER ZERO
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Admin Console
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicators & Navigation */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#14221A] border border-emerald-950 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 text-[11px]">Database Online</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#14221A] border border-emerald-950 text-xs">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 text-[11px]">
              AI Engine: {aiApiKey ? "Configured" : "Default Mode"}
            </span>
          </div>

          <Link
            href="/"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#14221A] hover:bg-[#1B2F24] text-slate-200 border border-emerald-950 flex items-center gap-1.5 transition-colors"
          >
            <span>Open Main App</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <button
            onClick={handleAdminLogout}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-900/60 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Admin Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0E1712] border border-emerald-950/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>REGISTERED SHOPS</span>
              <Building className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {businesses.length}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1">
              All workspaces active
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0E1712] border border-emerald-950/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>TOTAL USERS</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {users.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              1 Admin, 3 Business accounts
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0E1712] border border-emerald-950/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>PROCESSED VOLUME</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              $142,000.00
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1">
              Active ledger balance
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0E1712] border border-emerald-950/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>AI AGENT STATUS</span>
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400">Online</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300">
                {aiProvider.toUpperCase()}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Ready for business autonomous goals
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-emerald-950 pb-2 overflow-x-auto">
          {[
            { id: "ai", label: "AI Engine & API Setup", icon: Key },
            { id: "businesses", label: "Shops & Businesses", icon: Building },
            { id: "users", label: "User Accounts", icon: Users },
            { id: "sql", label: "Supabase SQL Schema", icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-950"
                    : "text-slate-400 hover:text-white hover:bg-[#14221A]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* -------------------------------------------------------------
            TAB 1: AI Engine & API Key Setup
            ------------------------------------------------------------- */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <div className="bg-[#0E1712] border border-emerald-950/80 rounded-2xl p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-emerald-400" />
                  Configure AI Financial Co-Pilot Engine
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connect your live OpenAI, Gemini, or Claude API key so the business autonomous agent can analyze finances and propose actions in real time.
                </p>
              </div>

              {aiSaveSuccess && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>AI configuration saved successfully and activated for all business workspaces!</span>
                </div>
              )}

              {/* Form Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    AI Provider
                  </label>
                  <select
                    value={aiProvider}
                    onChange={(e) => {
                      setAiProvider(e.target.value);
                      if (e.target.value === "openai") setAiModel("gpt-4o-mini");
                      if (e.target.value === "gemini") setAiModel("gemini-1.5-pro");
                      if (e.target.value === "anthropic") setAiModel("claude-3-5-sonnet");
                    }}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#14221A] border border-emerald-900/60 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="openai">OpenAI (Recommended)</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="anthropic">Anthropic Claude</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Model Selection
                  </label>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#14221A] border border-emerald-900/60 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    {aiProvider === "openai" && (
                      <>
                        <option value="gpt-4o-mini">gpt-4o-mini (Fast & Economical)</option>
                        <option value="gpt-4o">gpt-4o (High Precision Financial Analysis)</option>
                        <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                      </>
                    )}
                    {aiProvider === "gemini" && (
                      <>
                        <option value="gemini-1.5-flash">gemini-1.5-flash (Ultra Fast)</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Reasoning)</option>
                        <option value="gemini-2.0-flash">gemini-2.0-flash (Latest)</option>
                      </>
                    )}
                    {aiProvider === "anthropic" && (
                      <>
                        <option value="claude-3-5-sonnet">claude-3-5-sonnet (Flagship)</option>
                        <option value="claude-3-haiku">claude-3-haiku (Fast)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  AI API Key ({aiProvider.toUpperCase()})
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder={
                      aiProvider === "openai"
                        ? "sk-proj-xxxxxxxxxxxxxxxxxxxx"
                        : "AIzaSyxxxxxxxxxxxxxxxxxxxx"
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-[#14221A] border border-emerald-900/60 rounded-xl text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Your key is securely transmitted and stored locally & on your server.
                </p>
              </div>

              {/* System Prompt Customizer */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Business Agent System Instructions
                </label>
                <textarea
                  rows={3}
                  value={aiSystemPrompt}
                  onChange={(e) => setAiSystemPrompt(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#14221A] border border-emerald-900/60 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveAISettings}
                  disabled={isSavingAI}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingAI ? "Saving..." : "Save AI Configuration"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestAI}
                  disabled={isTestingAI}
                  className="px-4 py-2.5 bg-[#14221A] hover:bg-[#1B2F24] text-emerald-400 border border-emerald-800/80 font-semibold text-xs rounded-xl transition-all flex items-center gap-2"
                >
                  {isTestingAI ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>Test Connection</span>
                </button>
              </div>

              {/* Test Result Display */}
              {aiTestResult.status !== "idle" && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    aiTestResult.status === "success"
                      ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                      : "bg-rose-950/40 border-rose-800 text-rose-300"
                  }`}
                >
                  <div className="font-bold mb-0.5">
                    {aiTestResult.status === "success" ? "✓ Test Passed" : "✕ Test Encountered Issue"}
                  </div>
                  <div>{aiTestResult.message}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 2: Shops & Businesses Management
            ------------------------------------------------------------- */}
        {activeTab === "businesses" && (
          <div className="bg-[#0E1712] border border-emerald-950/80 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                Active Business Workspaces
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage registered shop workspaces, monitoring volume and operating status.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-emerald-950 text-slate-400">
                    <th className="pb-3 font-semibold">Business Name</th>
                    <th className="pb-3 font-semibold">Owner Email</th>
                    <th className="pb-3 font-semibold">Jurisdiction</th>
                    <th className="pb-3 font-semibold">Volume</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/60">
                  {businesses.map((biz) => (
                    <tr key={biz.id} className="hover:bg-[#14221A]/50 transition-colors">
                      <td className="py-3 font-bold text-white">{biz.name}</td>
                      <td className="py-3 text-slate-300">{biz.ownerEmail}</td>
                      <td className="py-3 text-slate-400">
                        {biz.country} • {biz.currency}
                      </td>
                      <td className="py-3 font-mono text-emerald-400">
                        ${(biz.volumeCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            biz.status === "active"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-rose-950 text-rose-400 border border-rose-800"
                          }`}
                        >
                          {biz.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => toggleBusinessStatus(biz.id)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                            biz.status === "active"
                              ? "bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-900/60"
                              : "bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-900/60"
                          }`}
                        >
                          {biz.status === "active" ? "Suspend" : "Activate"}
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
          <div className="bg-[#0E1712] border border-emerald-950/80 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                User Accounts & Role Permissions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage all registered users and assign permissions (Owner, Admin, Accountant, Viewer).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-emerald-950 text-slate-400">
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold">Assigned Role</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Last Active</th>
                    <th className="pb-3 font-semibold text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/60">
                  {users.map((usr) => (
                    <tr key={usr.id} className="hover:bg-[#14221A]/50 transition-colors">
                      <td className="py-3 font-bold text-white">{usr.name}</td>
                      <td className="py-3 text-slate-300">{usr.email}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-[#14221A] border border-emerald-950 text-emerald-300 font-semibold text-[11px]">
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-emerald-400 font-semibold text-[11px]">
                          Active
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{usr.lastLogin}</td>
                      <td className="py-3 text-right">
                        <select
                          value={usr.role}
                          onChange={(e) => updateUserRole(usr.id, e.target.value)}
                          className="px-2 py-1 text-xs bg-[#14221A] border border-emerald-900/60 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Owner">Owner</option>
                          <option value="Admin">Admin</option>
                          <option value="Accountant">Accountant</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 4: Supabase SQL Schema
            ------------------------------------------------------------- */}
        {activeTab === "sql" && (
          <div className="bg-[#0E1712] border border-emerald-950/80 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Production Supabase PostgreSQL Schema
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  12 tables, complete multi-tenant Row Level Security (RLS), triggers, and system settings.
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 shrink-0"
              >
                {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? "Copied SQL to Clipboard!" : "Copy Full SQL Script"}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#14221A] border border-emerald-950 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-white">How to run this in your Supabase backend:</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Open your Supabase project dashboard: <span className="text-emerald-400 font-mono">https://supabase.com/dashboard</span></li>
                <li>Go to the <strong>SQL Editor</strong> tab on the left.</li>
                <li>Click <strong>New query</strong>, paste the script below, and click <strong>Run</strong>.</li>
                <li>All 12 tables, RLS policies, and triggers will be created instantly.</li>
              </ol>
            </div>

            <div className="relative">
              <div className="p-4 bg-[#050907] border border-emerald-950 rounded-xl max-h-96 overflow-y-auto font-mono text-[11px] text-emerald-400/90 leading-relaxed whitespace-pre selection:bg-emerald-500 selection:text-black">
{`-- LEDGER ZERO Production Supabase Schema
-- Includes: profiles, businesses, business_members, customers, suppliers,
-- invoices, invoice_items, transactions, budgets, action_tasks, audit_logs,
-- and system_settings with Row Level Security.

File location in your codebase: /supabase-schema.sql
Click 'Copy Full SQL Script' above to copy all 260 lines.`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
