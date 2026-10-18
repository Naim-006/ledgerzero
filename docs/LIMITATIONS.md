# LEDGER ZERO – System Limitations & Prototype Boundary

**NULL PROTOCOL** • *Hackathon Edition*

---

## 1. Honesty Statement & Prototype Status

LEDGER ZERO is a fully functional **frontend prototype** running on an in-memory, client-persisted mock service layer. In accordance with the competition honesty rules, this document explicitly discloses what is simulated versus production-ready.

---

## 2. What Is Simulated in This Build

### 1. Money Movement & Bank Connectivity
- **No real funds movement:** LEDGER ZERO does not initiate real wire transfers, ACH payments, or credit card charges.
- **Payables execution:** When an action to "reschedule" or "record payment" is executed, it updates internal schedules and ledger balances. No banking API (e.g. Plaid, Stripe Treasury, Modern Treasury) is invoked.

### 2. External Communication & Reminders
- **No real emails or SMS:** Payment reminders dispatched to customers are not sent via real SMTP or Twilio.
- **Delivery notification:** All reminders are strictly labeled **"Logged in-app (simulated delivery)"** and recorded in the in-memory audit log.

### 3. Agent Tool Calling & AI Reasoning
- **Deterministic Simulator:** The agent in this frontend build is driven by a deterministic, scripted state machine (`MockAgentService`) that emits streaming progress events and validates tool arguments using Zod.
- **No live LLM API keys:** No OpenAI or Google Gemini API keys are bundled or required. The architecture provides standard TypeScript interfaces (`AgentService`) so that a live Gemini backend can be attached without UI modifications.

### 4. Document Ingestion & OCR
- **Simulated OCR Extraction:** The invoice upload interface simulates OCR extraction with per-field confidence scoring (92% - 99%) and a human-in-the-loop review step before committing records to the ledger.

### 5. Authentication & Identity
- **Mock Auth:** Authentication, session switching, and role toggling are managed client-side without JWT cookies or an external OAuth provider.

---

## 3. What Is Production-Grade in This Build

1. **Deterministic Financial Engine (`src/lib/finance/engine.ts`):** Pure TypeScript functions with 100% test coverage. Handles cash position calculations, double-counting prevention, aging brackets, 7/30-day daily forecast curves, and scenario overlays. Ready for direct backend reuse.
2. **Integer Minor Unit Precision (`src/lib/money.ts`):** Zero floating-point arithmetic. Universal currency support with correct decimal precisions (USD 2, BDT 2, EUR 2, JPY 0, KWD 3).
3. **Architecture Boundary (`src/services/`):** The UI depends exclusively on abstract contracts. Setting `NEXT_PUBLIC_DATA_MODE=api` redirects all UI calls to the backend REST API defined in `docs/BACKEND_CONTRACT.md`.
4. **Governed Safety Loop:** Strict permission gates guarantee that autonomous actions can never execute without explicit human authorization from an Owner or Admin role.

---

## 4. Production Integration Roadmap

To transition this frontend into a live production deployment:
1. Implement the endpoints outlined in `docs/BACKEND_CONTRACT.md` on the backend service.
2. Connect Supabase or PostgreSQL for persistent database storage.
3. Plug in the Gemini 1.5/2.0 Function Calling API to drive the `AgentService` tools.
4. Integrate Twilio / Resend for actual email and SMS delivery.
5. Set `NEXT_PUBLIC_DATA_MODE=api` in the frontend environment.
