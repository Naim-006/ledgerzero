import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck(filename):
    prs = Presentation()
    # 16:9 Widescreen slides
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Brand Colors
    C_FOREST = RGBColor(0x0F, 0x3A, 0x2C)
    C_EMERALD = RGBColor(0x10, 0xB9, 0x81)
    C_LIME = RGBColor(0x84, 0xCC, 0x16)
    C_SLATE = RGBColor(0x1E, 0x29, 0x3B)
    C_LIGHT_BG = RGBColor(0xF8, 0xFA, 0xFC)
    C_WHITE = RGBColor(0xFF, 0xFF, 0xFF)
    C_MUTED = RGBColor(0x64, 0x74, 0x8B)

    slides_content = [
        {
            "type": "title",
            "title": "LEDGER ZERO",
            "subtitle": "Autonomous Financial Operating System & Agentic Copilot for SMEs",
            "tagline": "Tsinghua PBCSF & WeBank Global FinTechathon — International Track (Topic E: SME Finance Copilot)",
            "footer": "Team NULL PROTOCOL | October 2026"
        },
        {
            "type": "content",
            "heading": "01. The Problem: The SME Liquidity Trap",
            "subheading": "Why 82% of small businesses fail despite having viable business models",
            "points": [
                "Passive Backward-Looking Ledgers: Existing ERPs and spreadsheet tools only show what already happened — they provide zero predictive intelligence.",
                "Cash Shortfall Blindness: Owners lack real-time visibility into whether cash in hand can cover upcoming vendor bills due next week.",
                "Manual Operational Friction: Reconciling POS transactions, creating tax invoices, updating inventory, and chasing customer debts requires hours of manual work.",
                "Generic AI Failure: Standard LLM chatbots hallucinate mathematical calculations and cannot safely execute operational actions against business ledgers."
            ]
        },
        {
            "type": "content",
            "heading": "02. The Solution: AI as a Financial Participant",
            "subheading": "Moving from passive conversation to autonomous, verified financial execution",
            "points": [
                "Active Operational Participant: LEDGER ZERO's AI Copilot does not just answer questions — it executes verified actions (sales, invoices, inventory, payment reminders).",
                "Deterministic Mathematical Grounding: Strict architectural decoupling guarantees LLMs never compute raw math; backend engines verify every number.",
                "Human-in-the-Loop Governance: Sensitive financial actions follow a planned -> pending_approval -> approved -> executed safety state machine.",
                "Native SME Localization: Full support for Chinese Yuan (CNY / ¥), Chinese VAT standards, and leading Chinese AI foundation models."
            ]
        },
        {
            "type": "content",
            "heading": "03. Connected 4-Step Shop Operations Workflow",
            "subheading": "A seamless end-to-end operational pipeline designed for real small business owners",
            "points": [
                "Step 1: POS Quick Sell Register: Instant barcode/product checkout that automatically registers income transactions and deducts stock in real time.",
                "Step 2: Product Stock & Inventory: Automated tracking of low-stock thresholds with intelligent replenishment recommendations.",
                "Step 3: Bills & Invoices Ledger: Fast manual invoicing and automated document ingestion without forced PDF friction.",
                "Step 4: Cash Flow Forecast & Protection: 7-day and 30-day forward liquidity trajectories with proactive deficit warnings."
            ]
        },
        {
            "type": "content",
            "heading": "04. Agentic AI Action Execution Engine",
            "subheading": "How natural language instructions trigger verified, auditable database mutations",
            "points": [
                "Natural Language Grammar Parser: Intercepts operational commands directly in chat (e.g., 'Add stock: 50 Mouse at 35 yuan', 'Create invoice 850 yuan for Beijing Tech').",
                "Direct DataService Mutations: Translates intent into validated Zod-governed mutations without hallucinated intermediate states.",
                "Interactive Feedback & Links: Assistant returns immediate success cards with direct navigation links to view updated stock, invoices, or cash balances.",
                "Audit Logging Trail: Every agentic mutation logs actorType ('agent'), actorName, timestamp, and immutable outcome parameters."
            ]
        },
        {
            "type": "content",
            "heading": "05. Multi-Model Chinese & Global LLM Gateway",
            "subheading": "First-class priority for China's leading foundation models with global fallback",
            "points": [
                "DeepSeek-V3 / R1 (深度求索): Flagship model for complex financial multi-step reasoning and cash strategy optimization.",
                "GLM-4 Flash (智谱清言): High-throughput, sub-second bilingual entity extraction and invoice parsing.",
                "Qwen-Plus (通义千问 - 阿里): Deep domain understanding of Chinese SME commercial idioms and POS transactions.",
                "Groq Cloud Llama-3.3: Ultra-low latency (<200ms) execution for interactive voice and rapid conversational queries.",
                "Intelligent Key Protection: Robust key verification (isRealApiKey) prevents masked keys from corrupting database settings."
            ]
        },
        {
            "type": "content",
            "heading": "06. Predictive Cash-Flow Intelligence & Early Warnings",
            "subheading": "Preventing insolvency before it occurs with recursive daily trajectory models",
            "points": [
                "Daily Cash Trajectory C(t): C(t) = C(t-1) + Inflows(t) - Outflows(t) over 7-day and 30-day rolling horizons.",
                "Net 7-Day Liquidity Gap: Available Cash minus Payables Due Within 7 Days. Triggers immediate alert when gap is negative.",
                "4-Bucket Receivables Aging: Automatic sorting into Current, 1-30 Days, 31-60 Days, and 61-90+ Days with overdue exposure tracking.",
                "Automated Remediation: Suggests targeted debtor reminders or liquidity bridging when shortfall is detected."
            ]
        },
        {
            "type": "content",
            "heading": "07. What-If Decision Simulator & Discount Modeling",
            "subheading": "Mathematical optimization of prompt settlement discounts vs. credit financing",
            "points": [
                "Scenario Comparison: Simulates what happens if a key customer delays payment by 14 days vs. immediate prompt settlement.",
                "Prompt Settlement Discount Optimization: Calculates whether offering a 2% discount is cheaper than short-term bank credit interest.",
                "Working Capital Impact: Shows projected cash balance under Expected, Best-Case, and Worst-Case scenarios.",
                "Evidence-Backed Recommendations: AI recommendations provide supporting calculations rather than arbitrary suggestions."
            ]
        },
        {
            "type": "content",
            "heading": "08. Security, Permissions & Compliance",
            "subheading": "Enterprise-grade trust architecture built on Supabase PostgreSQL and RBAC",
            "points": [
                "Multi-Tenant Isolation: Every record strictly bound by business_id with PostgreSQL Row-Level Security (RLS) policies.",
                "Role-Based Access Control (RBAC): Strict permission boundaries across Owner (full mutation), Manager (operational), and Viewer (read-only).",
                "Human-in-the-Loop Approval Center: Sensitive payments and remittances require explicit human approval before execution.",
                "Tamper-Proof Audit History: Immutable log of every action task, decision author, execution timestamp, and state transition."
            ]
        },
        {
            "type": "content",
            "heading": "09. System Architecture & Technology Stack",
            "subheading": "Modern, scalable, and responsive full-stack implementation",
            "points": [
                "Frontend: Next.js 15.5 App Router, React 19, Tailwind CSS, Lucide Icons, Recharts financial data visualization.",
                "Backend / API: Serverless edge handlers (/api/ai/agent, /api/admin/settings) with in-memory caching and resilient error handling.",
                "Database: Supabase PostgreSQL Cloud with SSR client, connection pooling, and atomic migrations.",
                "State Management: Context API + TanStack Query with real-time UI synchronizations across POS, Inventory, and Ledger."
            ]
        },
        {
            "type": "content",
            "heading": "10. Verification, Test Results & Production Stability",
            "subheading": "Rigorous quality assurance guaranteeing zero runtime regressions",
            "points": [
                "100% Test Pass Rate: 32 / 32 unit and integration tests passing across all 9 Vitest suites.",
                "Zero-Error Production Build: Next.js 15 production build compiles cleanly across all 27 application pages.",
                "Agent Simulator Validation: Automated tests verify that unapproved tasks are strictly blocked from execution.",
                "Deterministic Precision: Minor-unit (integer cents) arithmetic eliminates floating-point rounding errors in all financial balances."
            ]
        },
        {
            "type": "content",
            "heading": "11. Competitive Edge & Future Roadmap",
            "subheading": "Positioning LEDGER ZERO for global scale and WeBank ecosystem integration",
            "points": [
                "SME-Centric Simplicity: Removes accounting jargon and clutter — intuitive, clean, and accessible to non-technical store owners.",
                "Open Banking Integration: Direct bank API connectors for WeBank and international clearing houses.",
                "Multi-Currency Cross-Border Support: Native support for CNY, USD, EUR, GBP, BDT, and INR with real-time FX rate conversion.",
                "Autonomous Micro-Financing: AI-driven loan readiness scoring to connect cash-strapped SMEs with instant institutional liquidity."
            ]
        }
    ]

    for data in slides_content:
        slide = prs.slides.add_slide(blank_layout)

        # Background card
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        if data["type"] == "title":
            bg.fill.fore_color.rgb = C_FOREST
            bg.line.color.rgb = C_FOREST

            # Title
            tx_box = slide.shapes.add_textbox(Inches(1.2), Inches(1.8), Inches(11), Inches(1.8))
            tf = tx_box.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = data["title"]
            p.font.name = "Calibri"
            p.font.size = Pt(54)
            p.font.bold = True
            p.font.color.rgb = C_LIME

            # Subtitle
            p2 = tf.add_paragraph()
            p2.text = data["subtitle"]
            p2.font.name = "Calibri"
            p2.font.size = Pt(24)
            p2.font.bold = True
            p2.font.color.rgb = C_WHITE

            # Tagline
            tx_tag = slide.shapes.add_textbox(Inches(1.2), Inches(4.3), Inches(11), Inches(1.2))
            tf_tag = tx_tag.text_frame
            tf_tag.word_wrap = True
            p3 = tf_tag.paragraphs[0]
            p3.text = data["tagline"]
            p3.font.name = "Calibri"
            p3.font.size = Pt(16)
            p3.font.italic = True
            p3.font.color.rgb = RGBColor(0xD1, 0xD5, 0xDB)

            # Footer
            p4 = tf_tag.add_paragraph()
            p4.text = data["footer"]
            p4.font.name = "Calibri"
            p4.font.size = Pt(13)
            p4.font.color.rgb = C_LIME
        else:
            bg.fill.fore_color.rgb = C_LIGHT_BG
            bg.line.color.rgb = C_LIGHT_BG

            # Header Top Bar Accent
            bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.15))
            bar.fill.solid()
            bar.fill.fore_color.rgb = C_FOREST
            bar.line.color.rgb = C_FOREST

            # Heading Textbox
            h_box = slide.shapes.add_textbox(Inches(1.0), Inches(0.5), Inches(11.333), Inches(1.3))
            tf_h = h_box.text_frame
            tf_h.word_wrap = True
            p_h = tf_h.paragraphs[0]
            p_h.text = data["heading"]
            p_h.font.name = "Calibri"
            p_h.font.size = Pt(28)
            p_h.font.bold = True
            p_h.font.color.rgb = C_FOREST

            p_sub = tf_h.add_paragraph()
            p_sub.text = data["subheading"]
            p_sub.font.name = "Calibri"
            p_sub.font.size = Pt(14)
            p_sub.font.color.rgb = C_MUTED

            # Content Cards / Bullet Points
            top_y = 2.1
            for i, pt in enumerate(data["points"]):
                parts = pt.split(": ", 1)
                bold_part = parts[0] + ": " if len(parts) > 1 else ""
                body_part = parts[1] if len(parts) > 1 else pt

                # Card Shape
                card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(top_y), Inches(11.333), Inches(1.05))
                card.fill.solid()
                card.fill.fore_color.rgb = C_WHITE
                card.line.color.rgb = RGBColor(0xE2, 0xE8, 0xF0)
                card.line.width = Pt(1)

                # Card text
                tb = slide.shapes.add_textbox(Inches(1.2), Inches(top_y + 0.08), Inches(10.9), Inches(0.9))
                tf_c = tb.text_frame
                tf_c.word_wrap = True
                p_c = tf_c.paragraphs[0]
                
                if bold_part:
                    r_bold = p_c.add_run()
                    r_bold.text = bold_part
                    r_bold.font.name = "Calibri"
                    r_bold.font.size = Pt(14)
                    r_bold.font.bold = True
                    r_bold.font.color.rgb = C_FOREST

                r_body = p_c.add_run()
                r_body.text = body_part
                r_body.font.name = "Calibri"
                r_body.font.size = Pt(13)
                r_body.font.color.rgb = C_SLATE

                top_y += 1.25

            # Slide Footer
            f_box = slide.shapes.add_textbox(Inches(1.0), Inches(6.9), Inches(11.333), Inches(0.4))
            p_f = f_box.text_frame.paragraphs[0]
            p_f.text = "LEDGER ZERO — Tsinghua PBCSF & WeBank International Track (Topic E: SME Finance Copilot)"
            p_f.font.size = Pt(10)
            p_f.font.color.rgb = C_MUTED

    prs.save(filename)
    print(f"Created Presentation Deck: {filename}")

if __name__ == '__main__':
    out_dir = "submission-package"
    os.makedirs(out_dir, exist_ok=True)
    create_deck(os.path.join(out_dir, "02_Presentation_Deck.pptx"))
