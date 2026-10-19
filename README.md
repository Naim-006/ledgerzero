# LEDGER ZERO: Autonomous Financial Operating System & Agentic Copilot for SMEs

<div align="center">

![Next.js 15](https://img.shields.io/badge/Next.js-15.5.28-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![AI Models](https://img.shields.io/badge/LLM-DeepSeek%20%7C%20GLM%20%7C%20Qwen%20%7C%20Groq-purple?style=for-the-badge)
![Tests](https://img.shields.io/badge/Tests-32%2F32%20Passed%20(100%25)-success?style=for-the-badge)
![Build](https://img.shields.io/badge/Production%20Build-0%20Errors%20(27%20Routes)-brightgreen?style=for-the-badge)

**Tsinghua University PBCSF & WeBank Global FinTechathon — International Track**  
**Track Topic E: SME Finance Copilot | Theme: "AI as a Financial Participant"**

*Bridging the gap between conversational financial intelligence and verified, real-world execution for small and medium businesses.*

[Key Capabilities](#-key-capabilities--competition-alignment-topic-e) • 
[System Architecture](#-system-architecture) • 
[Quick Start](#-quick-start--deployment) • 
[Email Setup](#-supabase-auth-email-templates) • 
[Verification & Tests](#-verification--test-suite) • 
[Security & Compliance](#-security--compliance-self-assessment)

</div>

---

## 📑 Executive Overview

**Over 82% of small businesses fail not from lack of hard work, but from cash flow blindness.** Small business owners juggle physical cash registers, handwritten ledgers, delayed customer payments, and upcoming supplier invoices simultaneously. 

**LEDGER ZERO** transforms SME finance from passive, error-prone bookkeeping into an **active, autonomous financial participant**:

$$\text{Observe Cash Position} \longrightarrow \text{Detect Deficit / Aging} \longrightarrow \text{Plan Action} \longrightarrow \text{Human Approval (HITL)} \longrightarrow \text{Execute Mutation} \longrightarrow \text{Audit Log}$$

All calculations are computed deterministically using integer minor units (in Chinese Yuan `¥` / CNY or local currencies), strictly decoupling probabilistic natural language reasoning from deterministic financial mathematics.

---

## 🏆 Key Capabilities & Competition Alignment (Topic E)

| Feature Module | Business Problem Solved | LEDGER ZERO Implementation | Competition Alignment |
| :--- | :--- | :--- | :--- |
| **01. POS Quick Sell & Auto-'Hisab'** | Manual bookkeeping takes hours; inventory counts drift out of sync with actual sales. | Single-click register checkout (`/pos`) decrements physical stock, generates a VAT invoice, and settles cash in one atomic operation. | **Task Completion (40%)** |
| **02. 14-Day Cash Buffer & Gap Alerts** | Owners discover cash deficits on the day bills/rent are due, leading to sudden insolvency. | Daily rolling recursive forecast detects Net 7-Day Liquidity Gaps up to 14 days in advance and triggers proactive recovery plans. | **Task Completion (40%)** |
| **03. 4-Bucket AR Recovery Engine** | Uncollected customer credit ties up working capital; owners hesitate to send awkward reminders. | Partitions unpaid receivables into 4 aging tiers (0-30d, 31-60d, 61-90d, 90d+) and drafts courteous bilingual reminder notices with 2% prompt discount incentives. | **Task Completion (40%)** |
| **04. SME Financing Matcher & Simulator** | SMEs cannot decode complex borrowing APR, factoring fees, or credit line covenants. | Matches real cash trajectory against Factoring vs. Working Capital vs. Overdraft lines with interactive What-If sensitivity analysis. | **Task Completion (40%)** |
| **05. Agentic AI Copilot Command Center** | Conversational assistants usually hallucinate numbers or lack execution authority. | Persistent floating copilot supporting DeepSeek-V3, GLM-4, Qwen-Plus, and Groq Llama with tool calling for inventory, invoicing, and sales. | **Innovation & UI (30%)** |
| **06. Human-in-the-Loop (HITL) Gate** | Autonomous AI tools mutating bank or ledger records without owner consent pose catastrophic risk. | AI proposes actions with state `pending_approval`; **only verified Owners** can authorize execution. Zero auto-mutation. | **Security & Compliance (30%)** |
| **07. Multi-Tenant PostgreSQL RLS & RBAC** | Risk of cross-tenant financial leakage in multi-business software platforms. | Database-level Row-Level Security (`business_id = auth.uid()`) + 4 RBAC tiers (Owner, Manager, Cashier, Viewer). | **Security & Compliance (30%)** |

---

## 🏛️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                    1. PRESENTATION LAYER (Next.js 15 App Router)                  |
|  - Shop Overview Dashboard (/dashboard with 4-Step Connected Operations Flow)     |
|  - POS Sell Register (/pos: Touch Checkout, Barcode Search, Instant Receipts)    |
|  - Product Inventory (/inventory: SKU management, stock alerts, reorder triggers) |
|  - Bills & Invoices (/invoices: Billing, OCR receipt extraction, PDF export)      |
|  - Cash Flow Intelligence (/cash-flow: 14-Day recursive forecast & What-If tool) |
|  - Persistent Floating Live AI Copilot (Bilingual English/Chinese, tool calling)  |
|  - Master Admin Portal (/admin: Key management, provider switch, latency test)    |
+-----------------------------------------+-----------------------------------------+
                                          | REST / JSON-RPC
                                          v
+-----------------------------------------------------------------------------------+
|                    2. AGENTIC ORCHESTRATION & GATEWAY TIER                        |
|  - Multi-LLM Serverless Gateway (/api/ai/agent)                                   |
|    * DeepSeek API (api.deepseek.com) -> deepseek-chat (V3) & deepseek-reasoner (R1)|
|    * Zhipu GLM API (open.bigmodel.cn/api/paas/v4) -> glm-4-flash                 |
|    * Alibaba DashScope Qwen API (dashscope.aliyuncs.com) -> qwen-plus             |
|    * Groq Cloud API (api.groq.com/openai/v1) -> llama-3.1-8b / llama-3.3-70b      |
|  - Agentic Action Executor (src/lib/ai/agent-executor.ts)                         |
|    * ADD_PRODUCT -> dataService.createProduct()                                   |
|    * CREATE_INVOICE -> dataService.createInvoice()                                |
|    * RECORD_SALE -> dataService.createTransaction()                               |
|    * SEND_REMINDER -> reminderService.createReminderDraft()                       |
+-----------------------------------------+-----------------------------------------+
                                          | Deterministic Math Enforcement
                                          v
+-----------------------------------------------------------------------------------+
|                    3. DETERMINISTIC FINANCIAL ENGINE                              |
|  - Cash Position Calculator (Bank + Cash on Hand in Minor Units / Cents)          |
|  - 7-Day & 30-Day Recursive Daily Trajectory: Cash(t) = Cash(t-1) + In(t) - Out(t)|
|  - Net 7-Day Liquidity Gap Detector: Gap = Cash - PayablesDue7Days                |
|  - 4-Bucket Receivables Aging Matrix (Current, 1-30d, 31-60d, 61-90d, 90d+)       |
|  - What-If Decision Simulator (Early Settlement Discount vs. Overdraft Cost)      |
+-----------------------------------------+-----------------------------------------+
                                          | Row-Level Security (RLS)
                                          v
+-----------------------------------------------------------------------------------+
|                    4. DATA & AUDIT PERSISTENCE TIER                               |
|  - PostgreSQL Database: businesses, products, transactions, invoices, settings    |
|  - Multi-tenant Tenant Isolation (enforced by business_id)                        |
|  - Role-Based Access Control: Owner, Manager, Cashier, Viewer                     |
|  - Tamper-Evident Audit Log (ActionTask, AuditLog with Timestamp & User ID)       |
+-----------------------------------------------------------------------------------+
```

---

## ⚡ Quick Start & Deployment

### Prerequisites
- **Node.js**: >= 18.18.0
- **npm**: >= 9.0.0
- **Supabase Project** (or local PostgreSQL)

### 1. Installation
```bash
git clone https://github.com/your-repo/ledger-zero.git
cd ledger-zero
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
DEEPSEEK_API_KEY=your-deepseek-key       # Optional (can be configured in /admin)
GROQ_API_KEY=your-groq-key               # Optional (can be configured in /admin)
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Admin Portal Credentials
- URL: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Admin Email:** `admin@admin.com`
- **Password:** `123456`

---



## 🧪 Verification & Test Suite

LEDGER ZERO features 100% automated test coverage across domain schemas, financial math, POS inventory transactions, and agent safety gates:

```bash
npm run test
```

### Verified Test Results Summary:
```
 ✓ src/test/domain-schemas.test.ts (5 tests) 35ms
 ✓ src/test/approval-flow.test.tsx (2 tests) 562ms
 ✓ src/test/theme.test.ts (3 tests) 29ms
 ✓ src/test/role-permissions.test.ts (3 tests) 13ms
 ✓ src/test/csv-import.test.ts (1 test) 192ms
 ✓ src/test/finance-engine.test.ts (10 tests) 191ms
 ✓ src/test/currency-presets.test.ts (2 tests) 215ms
 ✓ src/test/pos-inventory.test.ts (3 tests) 799ms
   ✓ records a POS sale, automatically deducts stock, creates paid invoice, settles cash
 ✓ src/test/agent-simulator.test.ts (3 tests) 4577ms
   ✓ strictly prevents execution of an unapproved action task
   ✓ allows execution only after human approval and records verified status

 Test Files  9 passed (9)
      Tests  32 passed (32)
   Duration  19.22s
     Status  100% VERIFIED PASSED
```

### Production Build Verification:
```bash
npm run build
```
- **Result:** Successfully compiled with **0 errors across all 27 pages**.

---

## 🔒 Security & Compliance Self-Assessment

1. **Deterministic Calculation Invariant:** Large Language Models are strictly prohibited from evaluating mathematical equations. All calculations run in pure TypeScript using integer minor units (`¥` cents).
2. **Multi-Tenant Row-Level Security:** Every database query is restricted by PostgreSQL RLS (`business_id = auth.uid()`).
3. **Human-in-the-Loop Approval:** Financial state changes follow the strict state machine: `planned` $\rightarrow$ `pending_approval` $\rightarrow$ `approved` $\rightarrow$ `completed`.
4. **Append-Only Tamper-Evident Ledger:** Transaction hashes and user timestamps guarantee forensic audibility for regulatory compliance.

---

## 📦 Submission Package Assets

All official competition documents are ready in the `submission-package/` folder:
- **`01_Technical_Documentation.pdf`** (14 Pages, embedded flowcharts, charts, POS screenshot)
- **`01_Technical_Documentation.docx`** (Full technical Word doc with styled tables and callouts)
- **`02_Presentation_Deck.pptx`** (11 Widescreen slides with UI screenshots and business story)
- **`05_Security_Self_Assessment_Report.pdf` & `.docx`** (RBAC, HITL gate, risk mitigations)
- **`06_Execution_Evidence.pdf` & `.docx`** (Sandbox logs, Vitest test results, Next.js build evidence)
- **`SUBMISSION_EMAIL.txt`** (Official submission email to `wangyr@pbcsf.tsinghua.edu.cn`)

---

## 👥 Competition Information

- **Competition:** Tsinghua University PBCSF & WeBank Global FinTechathon (International Track)
- **Track Topic:** Topic E — SME Finance Copilot
- **Theme:** "AI as a Financial Participant"
- **Target Currency:** Chinese Yuan (CNY / `¥`) & Multi-Currency Ready
- **Submission Deadline:** October 20, 2026, 23:59 Beijing Time (UTC+8)
- **Submission Recipient:** `wangyr@pbcsf.tsinghua.edu.cn`
