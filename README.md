# LEDGER ZERO

> **From financial insight to real-world action.**  
> An autonomous AI financial operating system for small businesses, by **NULL PROTOCOL**.  
> Hackathon Direction: *AI as a Financial Participant – Small-business Finance Assistant*.

---

## 🌟 Overview

**LEDGER ZERO** is an agentic AI financial operating system designed for small business operators. Rather than acting as a passive chatbot that merely outputs conversational advice, LEDGER ZERO executes an auditable, governed autonomy loop:

$$\text{Observe} \longrightarrow \text{Investigate} \longrightarrow \text{Plan} \longrightarrow \text{Validate} \longrightarrow \text{Request Approval} \longrightarrow \text{Execute} \longrightarrow \text{Verify}$$

All financial calculations are computed deterministically using integer minor units (no floating-point totals) through a pure TypeScript financial engine. The frontend operates fully on an in-memory, client-persisted mock service layer today and can toggle to a live backend with a single setting.

---

## 📸 Screenshots & UI Showcase

LEDGER ZERO features an original design system built on CSS variable tokens supporting **Light, Dark, and System theme modes** with full WCAG AA contrast.

### 1. Financial Command Center (Overview)
- **Top Metrics:** Confirmed Cash Position ($20,000.00), Customer Receivables ($25,000.00), 7-Day Payables Due ($45,000.00), and 7-Day Net Liquidity Gap (-$25,000.00).
- **Critical Alert Banner:** Informs operator of the Oct 21 liquidity deficit with a one-click *"Investigate with AI"* action.
- **Interactive Projections:** 7-day and 30-day cash curves with zero-reserve reference line and shortfall zone highlights.

### 2. Autonomous Financial Workspace (AI Workspace)
- **Investigation Stream:** Live timeline showing tool arguments, outputs, verified ledger facts, and assumptions.
- **Action Approval Card:** Dynamic prompt-settlement discount assumption (editable percentage field) that recomputes expected net inflow and shortfall reduction live.
- **Simulated Execution Receipt:** Honest labeling displaying `"Logged in-app (simulated delivery)"`.

### 3. Cash Flow & Scenario Simulator
- **Scenario Curve Overlay:** Side-by-side comparison of baseline forecast against modified scenario with customer acceleration and supplier deferral.
- **Non-Mutating Levers:** Toggleable assumptions that test resilience without altering live ledger records.

### 4. Transactions Ledger & Invoices (Simulated OCR)
- **CSV Import Engine:** Automatic duplicate detection, column mapping, and preview.
- **Invoice Upload:** Simulated OCR parsing with per-field confidence badges (92% - 99%) and human-in-the-loop verification.

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated Tests
```bash
npm run test
```

### 4. Build for Production
```bash
npm run build
```

---

## 🎯 Key Architectural Features

1. **Swap-Ready Service Layer (`src/services/`):**
   - The UI communicates strictly through abstract contracts (`DataService`, `AgentService`, `ActionService`, `ReminderService`, `AuthService`).
   - Run fully on the mock layer (`NEXT_PUBLIC_DATA_MODE=mock`) or point to your teammate's backend (`NEXT_PUBLIC_DATA_MODE=api`) without changing a single line of UI code.
2. **Deterministic Financial Engine (`src/lib/finance/engine.ts`):**
   - Pure, standalone calculation functions with zero UI imports, ready for direct backend reuse.
   - Calculates confirmed cash position, accounts receivable/payable summaries, aging brackets, 7/30-day forecast curves, and non-mutating scenario overlays.
   - Strict double-counting prevention: invoice payments automatically generate matching cash transactions and decrement receivable balances.
3. **Universal-by-Design Localization & Multi-Currency:**
   - Integer minor units everywhere (USD 2, BDT 2, EUR 2, JPY 0, KWD 3).
   - Typed `CountryConfig` packs for United States, United Kingdom, European Union, India, Singapore, Nigeria, Brazil, and Bangladesh.
   - Instant currency and locale switcher in the top bar.
4. **Governed Action Safety:**
   - Autonomous actions strictly require explicit human approval from an **Owner** or **Admin** role before execution.
   - Role switcher in the top navigation allows judges to test role permission boundaries live (e.g. Viewer cannot approve).
   - All simulated communications are honestly labeled **"Logged in-app (simulated delivery)"**.
5. **Light / Dark / System Theme:**
   - Persistent theme toggle in Topbar and Settings with zero flash on initial load.

---

## 🚀 Judge Demo Walkthrough (3 - 5 min)

The pre-seeded demo business **Harbor & Pine Supply Co.** is configured with exact reconciling headline numbers:
- **Confirmed Cash:** $20,000.00
- **7-Day Upcoming Payables:** $45,000.00
- **Customer Receivables:** $25,000.00
- **Net 7-Day Liquidity Gap:** -$25,000.00 (Shortfall on Oct 21)

For step-by-step click instructions, read [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

---

## 📚 Deliverables & Documentation

- **[`docs/BACKEND_CONTRACT.md`](docs/BACKEND_CONTRACT.md):** Complete OpenAPI/REST specification of all backend endpoints (methods, paths, request/response JSON, errors, roles) for your backend teammate.
- **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md):** Architectural design, service contracts, data flow, and Mermaid diagram of the Observe-to-Verify loop.
- **[`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md):** 3-5 minute judge walkthrough guide.
- **[`docs/LIMITATIONS.md`](docs/LIMITATIONS.md):** Honest disclosure of mock implementations, prototype boundaries, and production roadmap.

---

## 👥 NULL PROTOCOL Team Split

- **Frontend Engineer (This Build):** Complete user experience, design system, App Router shell, pure financial engine, deterministic agent simulator, mock store, and full suite of tests.
- **Backend Engineer (Teammate):** Implements `docs/BACKEND_CONTRACT.md` (database, auth backend, Gemini function calling agent, and payment rail adapters), reusing `src/lib/finance/`.
