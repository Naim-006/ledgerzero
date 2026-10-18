"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { dataService } from "@/services";
import {
  Bot,
  X,
  Send,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Boxes,
  Users,
  ChevronDown,
  RefreshCw,
  Key,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { executeAgenticAction } from "@/lib/ai/agent-executor";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedActions?: string[];
  timestamp: string;
  showKeyPrompt?: boolean;
}

export function FloatingCopilot() {
  const router = useRouter();
  const { business, activeCurrency } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickApiKey, setQuickApiKey] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const [contextData, setContextData] = useState<{
    cash: number;
    payablesDue7Days: number;
    receivables: number;
    lowStockCount: number;
  }>({
    cash: 0,
    payablesDue7Days: 0,
    receivables: 0,
    lowStockCount: 0,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check API key presence & business context
  const refreshContext = async () => {
    try {
      const [pos, rec, pay, prods, adminSettings] = await Promise.all([
        dataService.getCashPosition(),
        dataService.getReceivablesSummary(),
        dataService.getPayablesSummary(),
        dataService.getProducts(),
        fetch("/api/admin/settings").then((r) => r.json()).catch(() => null),
      ]);

      const lowStock = (prods || []).filter(
        (p) => p.stockQuantity <= (p.minStockAlert || 5)
      ).length;

      setContextData({
        cash: pos.currentCash,
        payablesDue7Days: pay.dueWithin7Days,
        receivables: rec.totalReceivables,
        lowStockCount: lowStock,
      });

      const keyPresent =
        Boolean(adminSettings?.settings?.raw_key_present) ||
        Boolean(localStorage.getItem("ledger_ai_api_key"));

      setHasApiKey(keyPresent);

      if (messages.length === 0) {
        if (keyPresent) {
          setMessages([
            {
              id: "welcome-live",
              role: "assistant",
              content: `Hello! I am your **AI Business Co-Pilot** powered by live AI. 
I monitor your shop's cash position, inventory stock levels, customer debts, and upcoming vendor bills.

Ask me any business question in plain English or Bengali, or tap a quick question below:`,
              suggestedActions: [
                "Will I have enough cash next week?",
                "Check low stock products",
                "Who owes me money?",
              ],
              timestamp: "Just now",
            },
          ]);
        } else {
          setMessages([
            {
              id: "welcome-prompt-key",
              role: "assistant",
              content: `Hello! I am your **AI Business Co-Pilot**. 

⚠️ **No AI API key is connected yet.**
To enable live AI answers and recommendations, paste your API key (OpenAI, Gemini, Groq, or Claude) below or configure it in the [Admin Portal](/admin).`,
              showKeyPrompt: true,
              timestamp: "Just now",
            },
          ]);
        }
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    refreshContext();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSaveQuickKey = async () => {
    if (!quickApiKey.trim()) return;
    setIsSavingKey(true);

    try {
      const keyTrimmed = quickApiKey.trim();
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_api_key: keyTrimmed }),
      });

      localStorage.setItem("ledger_ai_api_key", keyTrimmed);
      setHasApiKey(true);
      setQuickApiKey("");

      setMessages((prev) => [
        ...prev,
        {
          id: `saved-${Date.now()}`,
          role: "assistant",
          content: `🟢 **AI API Connected Successfully!**
Your AI assistant is now active and querying with live business context. How can I assist your business today?`,
          suggestedActions: [
            "Will I have enough cash next week?",
            "Check low stock products",
            "Who owes money?",
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (e) {
      alert("Failed saving API key. You can also configure it in /admin.");
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // 1. Check for Agentic Action Execution (Add stock, create invoice, record sale, send reminder)
    try {
      const actionResult = await executeAgenticAction(text, business?.id, activeCurrency);
      if (actionResult && actionResult.isAction) {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `action-${Date.now()}`,
            role: "assistant",
            content: actionResult.successMessage || "Task completed successfully.",
            suggestedActions: actionResult.navigateHref ? [`View ${actionResult.navigateHref.replace("/", "")}`] : [],
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        await refreshContext();
        return;
      }
    } catch (e) {
      console.warn("Agentic execution error:", e);
    }

    try {
      const storedKey = localStorage.getItem("ledger_ai_api_key") || "";
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          apiKey: storedKey,
          businessContext: contextData,
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer || "No response received.",
        suggestedActions: data.suggestedActions || [],
        showKeyPrompt: data.connected === false,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      if (data.connected === false) {
        setHasApiKey(false);
      }

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content:
            "I could not connect to the AI service. Please ensure your network is active or check AI settings in the Admin portal (/admin).",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("admin") || act.includes("connect api")) {
      router.push("/admin");
      setIsOpen(false);
    } else if (act.includes("stock") || act.includes("item") || act.includes("মাল")) {
      router.push("/inventory");
      setIsOpen(false);
    } else if (act.includes("pos") || act.includes("sell") || act.includes("বিক্রি")) {
      router.push("/pos");
      setIsOpen(false);
    } else if (act.includes("forecast") || act.includes("cash flow") || act.includes("simulate")) {
      router.push("/cash-flow");
      setIsOpen(false);
    } else if (act.includes("reminder") || act.includes("unpaid") || act.includes("owe") || act.includes("বাকি")) {
      router.push("/invoices");
      setIsOpen(false);
    } else if (act.includes("bill") || act.includes("বিল") || act.includes("supplier")) {
      router.push("/invoices");
      setIsOpen(false);
    } else {
      handleSendMessage(action);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-forest text-lime-accent hover:bg-forest-action font-bold text-xs shadow-xl shadow-forest/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border border-lime-accent/20"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-lime-accent" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <span className="tracking-wide">Ask AI Assistant</span>
          </button>
        </div>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[430px] h-[570px] max-h-[85vh] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="px-4 py-3.5 bg-forest text-white flex items-center justify-between border-b border-forest-action/20 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-lime-accent/20 border border-lime-accent/30 flex items-center justify-center text-lime-accent font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs flex items-center gap-2 text-white">
                  LEDGER ZERO AI
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${
                      hasApiKey
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-400/30"
                    }`}
                  >
                    {hasApiKey ? "AI CONNECTED" : "KEY REQUIRED"}
                  </span>
                </div>
                <div className="text-[10px] text-white/70">
                  {hasApiKey ? "Live Conversational Co-Pilot" : "Connect API Key to Activate"}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Context Summary Bar */}
          <div className="px-3.5 py-2 bg-surface-subtle border-b border-border text-[11px] flex items-center justify-between text-text-dim shrink-0">
            <div className="flex items-center gap-3">
              <span>
                Cash:{" "}
                <strong className="text-foreground">
                  ¥{(contextData.cash / 100).toFixed(2)}
                </strong>
              </span>
              <span>
                7d Bills:{" "}
                <strong className="text-foreground">
                  ¥{(contextData.payablesDue7Days / 100).toFixed(2)}
                </strong>
              </span>
            </div>
            {contextData.lowStockCount > 0 && (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                ⚠️ {contextData.lowStockCount} Low Stock
              </span>
            )}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-forest text-white rounded-br-xs shadow-xs font-medium"
                      : "bg-surface-subtle text-foreground border border-border/80 rounded-bl-xs"
                  }`}
                >
                  {msg.content}

                  {/* Inline Quick Connect Key Box if Key is Missing */}
                  {msg.showKeyPrompt && (
                    <div className="mt-3 p-3 bg-surface border border-border rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-foreground text-[11px]">
                        <Key className="w-3.5 h-3.5 text-forest-action" />
                        Quick Connect API Key
                      </div>
                      <input
                        type="password"
                        placeholder="Paste OpenAI, Gemini, or Groq Key"
                        value={quickApiKey}
                        onChange={(e) => setQuickApiKey(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-surface-subtle border border-border rounded-lg text-xs font-mono focus:outline-none focus:border-forest-action"
                      />
                      <div className="flex items-center justify-between">
                        <button
                          onClick={handleSaveQuickKey}
                          disabled={!quickApiKey.trim() || isSavingKey}
                          className="px-3 py-1 bg-forest text-lime-accent rounded-lg font-bold text-[11px] disabled:opacity-40 transition-colors"
                        >
                          {isSavingKey ? "Saving..." : "Save & Connect"}
                        </button>
                        <button
                          onClick={() => {
                            router.push("/admin");
                            setIsOpen(false);
                          }}
                          className="text-[10px] text-forest-action hover:underline"
                        >
                          Open Admin Portal →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggested Action Chips */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {msg.suggestedActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleActionClick(action)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-surface border border-border hover:border-forest-action hover:text-forest-action transition-colors flex items-center gap-1 text-foreground/80 shadow-2xs"
                      >
                        <span>{action}</span>
                        <ArrowRight className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[9px] text-text-dim mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-surface-subtle border border-border rounded-2xl w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-forest-action" />
                <span className="text-[11px] text-text-dim">
                  Querying live AI model...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Question Chips */}
          <div className="px-3 py-1.5 border-t border-border/60 bg-surface flex items-center gap-1.5 overflow-x-auto shrink-0">
            <button
              onClick={() => handleSendMessage("Will I have enough cash for next week's bills?")}
              className="px-2.5 py-1 text-[10px] rounded-full bg-surface-subtle hover:bg-forest-action/10 hover:text-forest-action transition-colors border border-border shrink-0 text-text-dim font-medium"
            >
              Cash vs Bills?
            </button>
            <button
              onClick={() => handleSendMessage("Check low stock products in inventory")}
              className="px-2.5 py-1 text-[10px] rounded-full bg-surface-subtle hover:bg-forest-action/10 hover:text-forest-action transition-colors border border-border shrink-0 text-text-dim font-medium"
            >
              Low Stock Items?
            </button>
            <button
              onClick={() => handleSendMessage("Which customers have overdue invoices?")}
              className="px-2.5 py-1 text-[10px] rounded-full bg-surface-subtle hover:bg-forest-action/10 hover:text-forest-action transition-colors border border-border shrink-0 text-text-dim font-medium"
            >
              Who Owes Money?
            </button>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-surface border-t border-border flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about cash, stock, bills..."
              className="flex-1 px-3 py-2 text-xs bg-surface-subtle border border-border rounded-xl text-foreground focus:outline-none focus:border-forest-action placeholder:text-text-dim"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-forest text-lime-accent hover:bg-forest-action disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
