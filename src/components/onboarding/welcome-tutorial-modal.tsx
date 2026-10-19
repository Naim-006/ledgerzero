"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  FileText,
  TrendingUp,
  Banknote,
  Bot,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface TutorialStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  highlights: { title: string; desc: string }[];
  routeHref?: string;
  routeLabel?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "intro",
    badge: "Welcome to LEDGER ZERO",
    title: "SME Autonomous Financial Operating System",
    subtitle:
      "Everything your small business needs to track cash, run daily store checkout, prevent cash shortages, and unlock credit.",
    icon: Sparkles,
    highlights: [
      {
        title: "Predictive Cash Flow & 7-Day Safety",
        desc: "Never run out of cash. Real-time net liquidity calculations forecast if your money covers next week's bills.",
      },
      {
        title: "Touch POS & Automatic Stock Deduction",
        desc: "Lightning-fast cashier register. Cash, WeChat, Alipay, and card sales instantly update inventory and accounting ledger.",
      },
      {
        title: "Customer Invoices & Supplier Bills",
        desc: "Track receivables and payables with authentic paper-style invoices, 13% VAT, and automated 2% discount reminders.",
      },
      {
        title: "Autonomous 24/7 AI Co-Pilot",
        desc: "An intelligent AI agent that can autonomously execute sales, generate invoices, record supplier bills, and suggest actions with one tap.",
      },
      {
        title: "Topic E: SME Business Financing",
        desc: "Pre-qualified invoice factoring, inventory credit, and working capital loans with zero paperwork.",
      },
    ],
    routeHref: "/",
    routeLabel: "Go to Shop Overview",
  },
  {
    id: "dashboard",
    badge: "Step 1 of 7",
    title: "Shop Overview & Financial Health",
    subtitle: "Your daily morning command center. Review live cash runway and business vitals before opening.",
    icon: LayoutDashboard,
    highlights: [
      {
        title: "Live Cash on Hand & Bank Balance",
        desc: "View current cash reserves compared directly against bills due within 7 days.",
      },
      {
        title: "Financial Health Score (0-100)",
        desc: "Instant algorithmic credit and liquidity rating reflecting overdue debt and profit margins.",
      },
      {
        title: "Quick Action Center",
        desc: "Proactive alert banners notify you of urgent inventory shortages and uncollected customer accounts.",
      },
    ],
    routeHref: "/",
    routeLabel: "Explore Shop Overview",
  },
  {
    id: "pos",
    badge: "Step 2 of 7",
    title: "Touch POS Register & Fast Checkout",
    subtitle: "Clean, touch-optimized register for mobile, tablet, and desktop cashiers.",
    icon: ShoppingCart,
    highlights: [
      {
        title: "Instant One-Tap Cart",
        desc: "Tap product cards to add to the cart. Filter by category (Beverages, Electronics, Stationery, Snacks).",
      },
      {
        title: "Multi-Method Settlement",
        desc: "Accept Cash, WeChat Pay, Alipay, Bank Card, or Transfer with custom tax and discounts.",
      },
      {
        title: "Automatic Inventory & Cash Settlement",
        desc: "Checking out automatically deducts item stock, deposits cash to shop balance, and issues a printable receipt.",
      },
    ],
    routeHref: "/pos",
    routeLabel: "Open POS Register",
  },
  {
    id: "inventory",
    badge: "Step 3 of 7",
    title: "Stock Inventory & Low-Stock Alerts",
    subtitle: "Keep your store stocked with automated SKU tracking, margins, and threshold warnings.",
    icon: Boxes,
    highlights: [
      {
        title: "Real-Time Stock Quantities",
        desc: "Track exact units on hand, cost price, retail price, and profit margin per SKU.",
      },
      {
        title: "Low-Stock Warning Badges",
        desc: "Amber alert badges flag items running below minimum safety threshold (e.g., < 5 pcs).",
      },
      {
        title: "One-Click Restocking",
        desc: "Add new product batches directly to inventory so they are instantly sellable in the POS register.",
      },
    ],
    routeHref: "/inventory",
    routeLabel: "Manage Inventory",
  },
  {
    id: "invoices",
    badge: "Step 4 of 7",
    title: "Bills, Invoices & Collections",
    subtitle: "Manage customer receivables and supplier payables with authentic paper-style invoices.",
    icon: FileText,
    highlights: [
      {
        title: "Authentic Paper Invoice View",
        desc: "Click any invoice to view a paper-style document with itemized lines, 13% VAT, and print button.",
      },
      {
        title: "Payment Settlement",
        desc: "Mark client invoices paid or settle supplier bills directly to keep your ledger balanced.",
      },
      {
        title: "Automated 2% Discount Reminders",
        desc: "Send automated payment reminders offering customers a 2% early settlement discount to accelerate cash recovery.",
      },
    ],
    routeHref: "/invoices",
    routeLabel: "View Bills & Invoices",
  },
  {
    id: "cash-flow",
    badge: "Step 5 of 7",
    title: "Predictive Cash Flow & Simulations",
    subtitle: "Forecast your cash balance 7 and 30 days ahead and run 'what-if' business scenarios.",
    icon: TrendingUp,
    highlights: [
      {
        title: "7-Day & 30-Day Liquidity Projections",
        desc: "Combines settled transactions, expected receivables, and scheduled supplier bills into an interactive curve.",
      },
      {
        title: "Early Shortfall Warnings",
        desc: "Identifies the exact day your cash will drop below zero so you can take corrective action early.",
      },
      {
        title: "What-If Scenario Simulation",
        desc: "Simulate what happens if a customer pays 14 days late or if operating costs decrease by 10%.",
      },
    ],
    routeHref: "/cash-flow",
    routeLabel: "Inspect Cash Flow",
  },
  {
    id: "financing",
    badge: "Step 6 of 7",
    title: "SME Business Financing & Loans",
    subtitle: "Pre-qualified institutional funding tailored for micro & small enterprises.",
    icon: Banknote,
    highlights: [
      {
        title: "Customer Invoice Factoring",
        desc: "Advance up to 80% of unpaid customer invoices in cash within 24-48 hours to bridge payroll or inventory gaps.",
      },
      {
        title: "Inventory & Working Capital Credit",
        desc: "Access revolving store credit with clear annual interest rates and transparent weekly or monthly payback.",
      },
      {
        title: "100% Online & Paperless",
        desc: "Uses your verified transaction history for instant approval without physical collateral.",
      },
    ],
    routeHref: "/financing",
    routeLabel: "Explore Financing Options",
  },
  {
    id: "ai-copilot",
    badge: "Step 7 of 7",
    title: "Autonomous AI Financial Co-Pilot",
    subtitle: "Your 24/7 intelligent partner floating in the bottom-right corner of every screen.",
    icon: Bot,
    highlights: [
      {
        title: "Hands-Free Store Execution",
        desc: "Ask the AI to 'Sell an item', 'Generate a random invoice', or 'Record a supplier bill' — it executes the task immediately without requiring tedious form entry.",
      },
      {
        title: "Smart Recommendations",
        desc: "Ask 'Suggest something to do' to get proactive, personalized recommendations for your shop.",
      },
      {
        title: "Global AI Providers",
        desc: "Connect DeepSeek, Groq, OpenAI, GLM, Qwen, or Gemini in Admin (/admin) for custom open-ended advisory.",
      },
    ],
    routeHref: "/",
    routeLabel: "Open Shop Overview & Try AI",
  },
];

const TUTORIAL_STORAGE_KEY = "ledger_zero_tutorial_seen_v1";

export function WelcomeTutorialModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has already seen or skipped the tutorial on this device
    try {
      const seen = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (!seen) {
        // Small delay so layout loads smoothly before presenting the walkthrough
        const timer = setTimeout(() => setIsOpen(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage fallback
    }
  }, []);

  // Listen for custom trigger to re-open tutorial anytime from topbar or settings
  useEffect(() => {
    const handleOpenTutorial = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    window.addEventListener("open-ledger-tutorial", handleOpenTutorial);
    return () => window.removeEventListener("open-ledger-tutorial", handleOpenTutorial);
  }, []);

  const handleClose = () => {
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    } catch {}
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleNavigateAndClose = (href?: string) => {
    handleClose();
    if (href) {
      router.push(href);
    }
  };

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const StepIcon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-border bg-surface-subtle/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-action/10 border border-forest-action/20 flex items-center justify-center text-forest-action">
              <StepIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-forest-action">
                {step.badge}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-tight">
                {step.title}
              </h2>
            </div>
          </div>

          {/* Skip Button */}
          <button
            onClick={handleClose}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg text-text-dim hover:text-foreground hover:bg-surface-subtle transition-colors flex items-center gap-1"
            title="Skip Tutorial"
          >
            <span>Skip</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <p className="text-xs sm:text-sm text-text-dim leading-relaxed">
            {step.subtitle}
          </p>

          {/* Highlights / Features List */}
          <div className="space-y-2.5">
            {step.highlights.map((item, idx) => (
              <div
                key={idx}
                className="p-3 sm:p-3.5 rounded-xl bg-surface border border-border/80 hover:border-forest-action/40 transition-colors flex items-start gap-3 shadow-2xs"
              >
                <div className="w-5 h-5 rounded-full bg-forest-action/10 text-forest-action flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-text-dim leading-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick jump to page link */}
          {step.routeHref && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => handleNavigateAndClose(step.routeHref)}
                className="text-xs font-semibold text-forest-action hover:underline inline-flex items-center gap-1.5"
              >
                <span>{step.routeLabel || "Open Page"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer / Stepper Controls */}
        <div className="px-5 py-3.5 border-t border-border bg-surface-subtle/50 flex items-center justify-between shrink-0">
          {/* Step Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {TUTORIAL_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                aria-label={`Jump to step ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep === i
                    ? "w-6 bg-forest-action"
                    : "w-2 bg-border hover:bg-forest-action/40"
                }`}
              />
            ))}
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-surface-subtle text-foreground transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-forest-action hover:bg-forest-action/90 text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>{isLast ? "Get Started" : "Next"}</span>
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
