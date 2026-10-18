# LEDGER ZERO – Hackathon Judge Demo Script

**Estimated Duration:** 3 to 5 minutes  
**Goal:** Demonstrate the complete **Observe → Investigate → Plan → Validate → Request Approval → Execute → Verify** autonomous loop.

---

## Step 1: The Overview & Liquidity Surveillance (0:00 – 0:45)

1. **Load Dashboard (`/`):**
   - Point to the persistent **"Demo data – simulated"** banner at the top.
   - Point out the headline metrics for **Harbor & Pine Supply Co.**:
     - Confirmed Cash: **$20,000.00**
     - Customer Receivables: **$25,000.00**
     - 7-Day Payables: **$45,000.00**
     - 7-Day Liquidity Buffer: **-$25,000.00** (Shortfall alert)
2. **Observe the Critical Shortfall Alert:**
   - Note the red alert banner: *"Projected Working Capital Shortfall Detected on Oct 21 (-$25,000.00 deficit)"*.
   - Point out the **Cash Balance Trajectory** chart: hovering over Oct 21 shows the balance dipping below the zero line when the Cascade Lumber $25k bill matures.
3. **Trigger Autonomous Investigation:**
   - Click the red **"Investigate with AI"** button in the alert banner.

---

## Step 2: Autonomous Investigation & Evidence Gathering (0:45 – 1:45)

1. **Observe the Agent Execution Stream:**
   - The AI Workspace launches with the goal: *"Help me avoid a cash shortage next week"*.
   - Watch the agent's step-by-step progress:
     - `goal_received` → Logs goal.
     - `plan_created` → Formulates 4-step investigation plan.
     - `tool_call_start` → Calls `calculate_cash_flow_forecast(days: 7)`.
     - `tool_call_start` → Calls `list_overdue_receivables()`.
     - `evidence_found` → Discovers that **Apex Retail Partners** has an uncollected invoice of **$15,000.00** (6 days overdue).
     - `draft_produced` → Drafts an expedited collection reminder offering a prompt settlement discount.
     - `approval_requested` → **Halts execution** and creates a governed Action Card.
2. **Auditable Evidence & Facts:**
   - In the right-hand panel, note the separation between **Verified Facts** (grounded in the ledger) and **Assumptions**.

---

## Step 3: Editable Assumptions & Human Authorization (1:45 – 2:30)

1. **Tweak the Editable Assumption:**
   - In the Approval Card on the right, show the **"Assumption: Prompt-Settlement Discount"** input field.
   - Change the percentage from **2%** to **3%** or **5%**.
   - Watch the **Recomputed Net Inflow** and remaining shortfall update dynamically in real time without refreshing!
2. **Demonstrate Role-Based Enforcement (Judge Favorite):**
   - In the top bar, click the **Role Switcher** and select **"Viewer"**.
   - Notice the **"Approve & Execute"** button immediately disables with a clear security notice: *"Your current role (Viewer) is read-only for approvals"*.
   - Switch role back to **"Owner"**. The button re-enables!
3. **Authorize and Execute:**
   - Click **"Approve & Execute (Simulated)"**.
   - Watch the execution animation.
   - Status updates to **"COMPLETED (SIMULATED)"** with verified receipt:  
     `"Logged in-app (simulated delivery). Customer reminder dispatched and recorded in audit log."`

---

## Step 4: Verify in Cash Flow Simulator (2:30 – 3:30)

1. **Navigate to "Cash Flow & Scenarios" (`/cash-flow`):**
   - Look at the comparative chart:
     - **Dashed gray line:** The baseline projection showing the -$25,000 shortfall.
     - **Solid green curve:** The modified scenario with accelerated collections and payment deferral.
   - Note the green banner: *"Shortfall Successfully Resolved! +$34,700 Liquidity Improvement"*.
2. **Inspect Active Scenario Levers:**
   - Toggle the assumption levers to demonstrate that calculations run purely client-side without mutating live ledger data.

---

## Step 5: Dark Mode, Multi-Currency & CSV Import (3:30 – 4:30)

1. **Toggle Dark Mode:**
   - In the top bar, click the **Theme Toggle** (Sun / Moon icon) and select **"Dark"**.
   - Point out how all cards, tables, charts (area line, zero line, tooltips), badges, and sidebars transition smoothly to a rich dark theme with WCAG AA compliant contrast.
   - The theme choice is saved in `localStorage` and persists across reloads with zero flash.
2. **Switch Currency Preset:**
   - Open the **Locale Switcher** and select **"BDT - Bangladesh (৳)"** or **"EUR - European Union (€)"**.
   - Watch all figures, charts, and tables update instantly with localized currency formatting and exact minor units while preserving identical mathematical proportions.
3. **Transactions CSV Import:**
   - Click **"Transactions"** in the sidebar.
   - Click **"Import CSV"** to demonstrate automatic duplicate detection.
4. **Audit Trail Verification:**
   - Click **"Agent Audit Logs"** to view the immutable cryptographic trail logging every step of the agent's reasoning and the user's approval.

---

## Conclusion
LEDGER ZERO delivers on the vision of **"From financial insight to real-world action"** by combining pure financial calculation, deterministic simulation, governed human approval, and complete accessibility in both light and dark modes.
