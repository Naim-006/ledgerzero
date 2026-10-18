# LEDGER ZERO – Backend API Contract Specification

**Version:** 1.0.0  
**Target Consumer:** Teammate Backend Services (FastAPI / Node / Go / Python)  
**Base URL:** `http://localhost:8000/api/v1` (Configured via `NEXT_PUBLIC_API_URL`)  
**Data Mode Switch:** Setting `NEXT_PUBLIC_DATA_MODE=api` in frontend swaps the service client from `MockDataService` to `ApiDataService`.

---

## 1. Global Conventions

### Currency & Minor Units
- All monetary amounts in requests and responses MUST be expressed in **integer minor units** (e.g. cents for USD/BDT/EUR, units for JPY, milliunits for KWD).
- Pair amounts with standard 3-letter ISO 4217 currency strings (`USD`, `EUR`, `BDT`, `GBP`, `INR`, etc.).
- Never send floating-point currency totals.

### Timestamps & Dates
- Dates without time: `YYYY-MM-DD` (e.g., `"2026-10-18"`).
- ISO-8601 UTC timestamps: `YYYY-MM-DDTHH:mm:ssZ` (e.g., `"2026-10-18T08:30:00Z"`).

### Standard Error Response Shape
All HTTP 4xx and 5xx responses must return this JSON structure:
```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Action execution requires Owner or Admin role.",
    "details": {
      "requiredRole": "Owner",
      "currentRole": "Viewer"
    }
  }
}
```

---

## 2. Authentication & Session Endpoints

### `GET /auth/me`
- **Description:** Retrieve current authenticated member session and business context.
- **Required Role:** Any active member.
- **Response `200 OK`:**
```json
{
  "id": "mem-1",
  "businessId": "biz_harbor_pine",
  "name": "Alex Vance",
  "email": "alex@harborandpine.com",
  "role": "Owner",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

### `POST /auth/switch-role` (Demo/Testing Only)
- **Description:** Switch active role in development or test environments.
- **Request Body:**
```json
{
  "role": "Admin"
}
```
- **Response `200 OK`:** Returns updated Member object.

---

## 3. Financial Intelligence & Forecasting Endpoints

### `GET /finance/cash-position`
- **Description:** Retrieve confirmed cash position calculated from settled transactions.
- **Required Role:** Viewer, Accountant, Admin, Owner.
- **Response `200 OK`:**
```json
{
  "openingBalance": 1500000,
  "totalIncome": 1000000,
  "totalExpense": 500000,
  "currentCash": 2000000
}
```

### `GET /finance/forecast?days=7`
- **Description:** Deterministic daily liquidity forecast. Combines confirmed cash with upcoming unsettled invoice receivables and payables due on each calendar day.
- **Query Params:** `days` (7 or 30, integer).
- **Required Role:** Viewer, Accountant, Admin, Owner.
- **Response `200 OK`:**
```json
{
  "days": 7,
  "startDate": "2026-10-18",
  "endDate": "2026-10-25",
  "minimumCash": -2500000,
  "minimumCashDate": "2026-10-23",
  "firstShortfallDate": "2026-10-21",
  "totalExpectedInflows": 2500000,
  "totalScheduledOutflows": 4500000,
  "netProjectedChange": -2000000,
  "dailyProjections": [
    {
      "date": "2026-10-18",
      "dayIndex": 0,
      "openingCash": 2000000,
      "expectedInflows": 0,
      "scheduledOutflows": 0,
      "netCashFlow": 0,
      "closingCash": 2000000,
      "isShortfall": false,
      "notes": []
    },
    {
      "date": "2026-10-21",
      "dayIndex": 3,
      "openingCash": 2000000,
      "expectedInflows": 0,
      "scheduledOutflows": 2500000,
      "netCashFlow": -2500000,
      "closingCash": -500000,
      "isShortfall": true,
      "notes": ["Payable: Cascade Lumber & Millworks (BILL-2026-7821)"]
    }
  ]
}
```

### `GET /finance/receivables-summary` & `GET /finance/payables-summary`
- **Description:** Aggregated summary of open and overdue balances.
- **Response `200 OK`:**
```json
{
  "totalReceivables": 2500000,
  "overdueAmount": 1500000,
  "dueWithin7Days": 1000000,
  "dueWithin30Days": 2500000,
  "count": 2,
  "overdueCount": 1
}
```

### `GET /finance/receivables-aging`
- **Description:** Overdue aging breakdown across standardized time brackets.
- **Response `200 OK`:**
```json
[
  { "label": "Current", "minDays": 0, "maxDays": 0, "amount": 1000000, "count": 1, "invoiceIds": ["inv-rec-094"] },
  { "label": "1-30 Days", "minDays": 1, "maxDays": 30, "amount": 1500000, "count": 1, "invoiceIds": ["inv-rec-089"] },
  { "label": "31-60 Days", "minDays": 31, "maxDays": 60, "amount": 0, "count": 0, "invoiceIds": [] },
  { "label": "61-90 Days", "minDays": 61, "maxDays": 90, "amount": 0, "count": 0, "invoiceIds": [] },
  { "label": "90+ Days", "minDays": 91, "maxDays": null, "amount": 0, "count": 0, "invoiceIds": [] }
]
```

### `POST /finance/simulate-scenario`
- **Description:** Runs hypothetical cash flow simulation without mutating base records.
- **Request Body:**
```json
{
  "days": 30,
  "assumptions": [
    {
      "type": "accelerate_customer_payment",
      "targetInvoiceId": "inv-rec-089",
      "shiftDays": 0,
      "percentageDelta": -2
    },
    {
      "type": "defer_supplier_payment",
      "targetInvoiceId": "inv-pay-7834",
      "shiftDays": 7
    }
  ]
}
```
- **Response `200 OK`:** Returns `ScenarioSimulationResult` comparing baseline forecast and modified forecast.

---

## 4. Ledger & Transaction Endpoints

### `GET /transactions`
- **Query Params:** `search`, `type` (`income` | `expense`), `category`, `startDate`, `endDate`, `page`, `limit`.
- **Response `200 OK`:** `{ "transactions": [...], "total": 12 }`.

### `POST /transactions`
- **Required Role:** Accountant, Admin, Owner.
- **Request Body:**
```json
{
  "date": "2026-10-18",
  "description": "Retail Floor Direct Counter Sales Batch",
  "type": "income",
  "category": "revenue_sales",
  "amount": 200000,
  "currency": "USD",
  "counterpartyName": "Direct Counter Customers",
  "isSettled": true
}
```
- **Response `201 Created`:** Returns created Transaction object.

### `POST /transactions/import-csv`
- **Description:** Batch imports transactions with duplicate checking.
- **Required Role:** Accountant, Admin, Owner.
- **Request Body:** Array of transaction objects.
- **Response `200 OK`:** `{ "importedCount": 8, "duplicateCount": 2 }`.

---

## 5. Invoices & OCR Ingestion Endpoints

### `GET /invoices`
- **Query Params:** `direction` (`receivable` | `payable`), `status`.
- **Response `200 OK`:** Array of Invoice objects.

### `POST /invoices`
- **Required Role:** Accountant, Admin, Owner.
- **Request Body:** Complete Invoice model with lineItems.

### `POST /invoices/:id/pay`
- **Description:** Record settlement payment on invoice. Creates a matching cash transaction to prevent double counting.
- **Request Body:**
```json
{
  "amount": 500000,
  "date": "2026-10-18",
  "notes": "Wire payment confirmation #9921"
}
```
- **Response `200 OK`:** Returns updated Invoice with updated `amountPaid` and `status`.

---

## 6. Action Center & Approval Lifecycle Endpoints

### `GET /actions`
- **Query Params:** `status` (`pending_approval`, `approved`, `executing`, `completed`, `rejected`, `cancelled`).
- **Response `200 OK`:** Array of ActionTask objects.

### `POST /actions/:id/approve`
- **Description:** Formally approve a pending intervention task.
- **Required Role:** Admin, Owner (Enforced on backend!).
- **Request Body:**
```json
{
  "memberId": "mem-1",
  "memberName": "Alex Vance",
  "reason": "Authorized prompt collection reminder to avert cash shortfall"
}
```
- **Response `200 OK`:** Updated ActionTask with `status: "approved"` and `approvalId`.

### `POST /actions/:id/execute`
- **Description:** Execute an approved action task. Must fail with HTTP 400 if status is not `approved`.
- **Required Role:** Admin, Owner.
- **Response `200 OK`:**
```json
{
  "id": "task-seed-01",
  "status": "completed",
  "verificationResult": {
    "verifiedAt": "2026-10-18T08:35:00Z",
    "status": "success",
    "message": "Logged in-app (simulated delivery). Customer reminder dispatched and recorded in audit log."
  }
}
```

---

## 7. Autonomous Agent Tool-Calling Endpoints (Real AI Backend)

When the backend attaches a real Gemini / LLM agent, it should implement the following agent tools matching `src/domain/types.ts`:

1. `get_business_summary`
2. `list_transactions(limit)`
3. `list_overdue_receivables`
4. `list_upcoming_payables(withinDays)`
5. `calculate_cash_flow_forecast(days)`
6. `simulate_cash_flow_scenario(assumptions, days)`
7. `create_reminder_draft(invoiceId, discountPercent)`
8. `request_action_approval(taskTitle, taskType, parameters)`
9. `schedule_follow_up(targetDate, note)`
10. `execute_approved_reminder(taskId)`
11. `verify_action_result(taskId)`

### Streaming Event Protocol (`POST /agent/run`)
- Returns a Server-Sent Events (SSE) stream or WebSocket of `AgentEvent` objects:
  `goal_received` → `plan_created` → `tool_call_start` → `tool_call_result` → `evidence_found` → `draft_produced` → `approval_requested`.
- Agent MUST suspend execution and yield control after emitting `approval_requested`.
