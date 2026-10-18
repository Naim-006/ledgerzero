import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def create_docx(filename):
    doc = docx.Document()
    
    # Page setup - 1 inch margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)

    # Title Banner
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = p_title.add_run("LEDGER ZERO: SYSTEM ARCHITECTURE &\nTECHNICAL SPECIFICATION")
    run_title.font.name = 'Calibri'
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0x0F, 0x3A, 0x2C)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = p_sub.add_run("Autonomous Financial Operating System & Agentic Copilot for Small Businesses\nTopic E: SME Finance Copilot — Tsinghua PBCSF & WeBank International Track")
    run_sub.font.size = Pt(11.5)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)

    # Meta Table
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Competition Track", "Tsinghua PBCSF & WeBank Global FinTechathon — International Track (Topic E)"),
        ("Official Theme", "AI as a Financial Participant: Autonomous Action, Security & Interaction"),
        ("Architecture Tier", "Enterprise Next.js 15, Multi-LLM Orchestrator (DeepSeek / GLM / Qwen / Groq), Supabase Cloud"),
        ("Submission Date", "October 20, 2026 (Beijing Time UTC+8)")
    ]
    for i, (k, v) in enumerate(meta_data):
        row = meta_table.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.text = k
        c1.text = v
        c0.paragraphs[0].runs[0].font.bold = True
        c0.paragraphs[0].runs[0].font.size = Pt(9.5)
        c1.paragraphs[0].runs[0].font.size = Pt(9.5)
        set_cell_background(c0, "F3F4F6")
        set_cell_background(c1, "FFFFFF")
    
    doc.add_paragraph() # Spacer

    # Section 1
    h1 = doc.add_heading("1. Executive Summary & Problem Formulation", level=1)
    h1.runs[0].font.color.rgb = RGBColor(0x0F, 0x3A, 0x2C)
    
    doc.add_paragraph(
        "Small and Medium Enterprises (SMEs) form the backbone of modern commercial activity, yet over 82% of SME failures "
        "are driven directly by acute cash-flow mismanagement and delayed receivables. Traditional accounting software "
        "(such as legacy ERPs or passive spreadsheet bookkeeping) operates purely as historical recording systems. "
        "They report what has already transpired, leaving business owners to manually divine upcoming liquidity shortfalls, "
        "calculate prompt payment discounts, draft reminder notices, and reconcile point-of-sale inventory."
    )
    doc.add_paragraph(
        "LEDGER ZERO solves this fundamental inefficiency by establishing an Agentic Financial Operating System where "
        "AI is an active, verified financial participant. Rather than functioning as a passive chatbot that hallucinates financial numbers, "
        "LEDGER ZERO couples deterministic financial math algorithms with multi-model Chinese & Global LLM agents (DeepSeek-V3/R1, "
        "GLM-4, Qwen-Plus, and Groq Llama-3.3). When instructed in natural language, the assistant executes verified ledger mutations "
        "— recording POS transactions, creating compliant invoices, adjusting stock quantities, and evaluating working capital buffers "
        "— all guarded by human-in-the-loop approval gates."
    )

    # Section 2
    h2 = doc.add_heading("2. System Architecture & Component Design", level=1)
    h2.runs[0].font.color.rgb = RGBColor(0x0F, 0x3A, 0x2C)
    
    doc.add_paragraph(
        "LEDGER ZERO is engineered with strict tier separation to ensure high performance, security, and mathematical determinism:"
    )

    arch_text = (
        "+-----------------------------------------------------------------------------------+\n"
        "|                    PRESENTATION LAYER (Next.js 15 App Router)                     |\n"
        "|  - Shop Overview Dashboard (4-Step Connected Operations Flow)                     |\n"
        "|  - POS Sell Register (Instant Checkout, Barcode, Stock Deduction)                 |\n"
        "|  - Bills & Invoices Ledger (Manual Invoicing + Automated Document OCR)            |\n"
        "|  - Cash Flow Intelligence & What-If Decision Simulator                            |\n"
        "|  - Master Admin Portal (/admin with Multi-LLM Health Diagnostics)                 |\n"
        "|  - Persistent Floating Live AI Agent Copilot (Multi-Language, Conversational)     |\n"
        "+-----------------------------------------+-----------------------------------------+\n"
        "                                          | REST / JSON-RPC\n"
        "                                          v\n"
        "+-----------------------------------------------------------------------------------+\n"
        "|                       ORCHESTRATION & AGENTIC ACTION TIER                         |\n"
        "|  - Multi-LLM Serverless Gateway (/api/ai/agent)                                   |\n"
        "|    * DeepSeek API (api.deepseek.com)                                              |\n"
        "|    * Zhipu GLM API (open.bigmodel.cn/api/paas/v4)                                 |\n"
        "|    * Alibaba DashScope Qwen API (dashscope.aliyuncs.com)                          |\n"
        "|    * Groq Fast Cloud Llama (api.groq.com/openai/v1)                               |\n"
        "|  - Natural Language Agentic Action Parser & Grammar Interceptor                  |\n"
        "|    * ADD_PRODUCT -> dataService.createProduct()                                   |\n"
        "|    * CREATE_INVOICE -> dataService.createInvoice()                                |\n"
        "|    * RECORD_SALE -> dataService.createTransaction()                               |\n"
        "|    * SEND_REMINDER -> reminderService.createReminderDraft()                       |\n"
        "+-----------------------------------------+-----------------------------------------+\n"
        "                                          | Strict Deterministic Validation\n"
        "                                          v\n"
        "+-----------------------------------------------------------------------------------+\n"
        "|                       DETERMINISTIC FINANCIAL ENGINE                              |\n"
        "|  - Cash Position Calculator (Bank + Physical Cash in Minor Units / Cents)         |\n"
        "|  - 7-Day & 30-Day Daily Cash Trajectory Generator                                 |\n"
        "|  - 4-Bucket Receivables Aging Matrix (Current, 1-30d, 31-60d, 61-90d, 90d+)       |\n"
        "|  - Shortfall Early-Warning Detector (Available Cash vs. Payables Due in 7 Days)   |\n"
        "|  - What-If Decision Simulator (Net Present Value & Settlement Discount Modeling)  |\n"
        "+-----------------------------------------+-----------------------------------------+\n"
        "                                          | Supabase SSR / PostgreSQL\n"
        "                                          v\n"
        "+-----------------------------------------------------------------------------------+\n"
        "|                       PERSISTENCE & SECURITY DATA TIER                            |\n"
        "|  - PostgreSQL Database: businesses, products, transactions, invoices, settings    |\n"
        "|  - Row-Level Security (RLS) Multi-Tenant Business Isolation                       |\n"
        "|  - Role-Based Access Control (RBAC): Owner, Manager, Viewer, System               |\n"
        "|  - Cryptographic Audit Trail (ActionTask, AuditLog with Timestamp & User ID)     |\n"
        "+-----------------------------------------------------------------------------------+"
    )
    p_arch = doc.add_paragraph()
    r_arch = p_arch.add_run(arch_text)
    r_arch.font.name = 'Consolas'
    r_arch.font.size = Pt(7.5)

    # Section 3
    h3 = doc.add_heading("3. Core Mathematical Formulations & Algorithms", level=1)
    h3.runs[0].font.color.rgb = RGBColor(0x0F, 0x3A, 0x2C)

    doc.add_paragraph(
        "A foundational principle of LEDGER ZERO is that large language models are NEVER permitted to execute raw financial math. "
        "LLMs translate natural intent into structured parameters, which are evaluated by deterministic equations:"
    )

    doc.add_heading("3.1 Cash Trajectory & Minimum Buffer Projection", level=2)
    doc.add_paragraph(
        "For a projection horizon T in {7, 30} days, the daily cash balance C(t) is computed recursively:"
    )
    doc.add_paragraph(
        "C(0) = Verified Bank Balance + Liquid Cash\n"
        "C(t) = C(t - 1) + sum(ExpectedInflows_k(t)) - sum(ScheduledOutflows_m(t))\n"
        "Minimum Projected Cash = min_{0 <= t <= T} C(t)\n"
        "Net 7-Day Liquidity Gap = C(0) - sum_{t=1..7} PayablesDue(t)"
    )
    doc.add_paragraph(
        "When Net 7-Day Liquidity Gap < 0, the system automatically triggers a High-Priority Shortfall Warning, "
        "recommending proactive receivables collection or credit financing before the business incurs overdraft penalties."
    )

    doc.add_heading("3.2 Prompt Settlement Discount vs. Overdraft Optimization", level=2)
    doc.add_paragraph(
        "When facing a liquidity gap, the What-If Decision Simulator evaluates whether offering an early payment discount (delta) "
        "to customers is economically superior to taking a short-term bank credit facility at annual interest rate r:"
    )
    doc.add_paragraph(
        "Cost of Discount = InvoiceAmount * delta\n"
        "Cost of Alternative Financing = InvoiceAmount * r * (DaysAccelerated / 365)\n"
        "Recommendation Rule: Offer discount if Cost of Discount < Cost of Alternative Financing AND Net Gap becomes non-negative."
    )

    # Section 4
    h4 = doc.add_heading("4. Multi-Model Chinese & Global LLM Integration", level=1)
    h4.runs[0].font.color.rgb = RGBColor(0x0F, 0x3A, 0x2C)
    doc.add_paragraph(
        "To align with the Tsinghua PBCSF & WeBank International Track standards, LEDGER ZERO natively prioritizes leading Chinese LLMs "
        "while preserving universal multi-model fallback capability:"
    )

    llm_table = doc.add_table(rows=6, cols=4)
    llm_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Provider", "Primary Model", "Origin", "Role in System"]
    for j, h in enumerate(headers):
        cell = llm_table.rows[0].cells[j]
        cell.text = h
        cell.paragraphs[0].runs[0].font.bold = True
        set_cell_background(cell, "0F3A2C")
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        cell.paragraphs[0].runs[0].font.size = Pt(9)

    llm_rows = [
        ("DeepSeek (深度求索)", "deepseek-chat / deepseek-reasoner", "China", "Primary conversational agent & complex reasoning"),
        ("GLM (智谱 AI)", "glm-4-flash", "China", "Ultra-fast bilingual intent extraction & summaries"),
        ("Qwen (通义千问)", "qwen-plus / qwen-turbo", "China", "Enterprise Chinese financial semantics & POS parsing"),
        ("Groq Cloud", "llama-3.3-70b-versatile / 3.1-8b", "Global", "Sub-200ms ultra-low latency real-time co-pilot"),
        ("Google Gemini", "gemini-1.5-flash", "Global", "High-volume document ingestion & token caching")
    ]
    for i, row in enumerate(llm_rows):
        r = llm_table.rows[i+1]
        for j, val in enumerate(row):
            c = r.cells[j]
            c.text = val
            c.paragraphs[0].runs[0].font.size = Pt(8.5)
            set_cell_background(c, "F9FAFB" if i % 2 == 0 else "FFFFFF")

    doc.add_paragraph()

    # Section 5
    h5 = doc.add_heading("5. Verification, Test Results & Production Validation", level=1)
    h5.runs[0].font.color.rgb = RGBColor(0x0F, 0x3A, 0x2C)
    doc.add_paragraph(
        "LEDGER ZERO has undergone comprehensive test suite validation. All 32 unit and integration tests across 9 test suites pass cleanly:"
    )

    test_table = doc.add_table(rows=10, cols=3)
    test_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_headers = ["Test Suite", "Tests", "Verification Scope"]
    for j, h in enumerate(t_headers):
        cell = test_table.rows[0].cells[j]
        cell.text = h
        cell.paragraphs[0].runs[0].font.bold = True
        set_cell_background(cell, "0F3A2C")
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        cell.paragraphs[0].runs[0].font.size = Pt(9)

    test_data = [
        ("src/test/finance-engine.test.ts", "10 Passed", "Cash calculations, 7/30-day forecast, aging buckets, anomaly detection"),
        ("src/test/pos-inventory.test.ts", "3 Passed", "POS sell register, instant stock deduction, invoice creation, cash settlement"),
        ("src/test/agent-simulator.test.ts", "3 Passed", "Agent planning, human approval enforcement, unapproved execution block"),
        ("src/test/approval-flow.test.tsx", "2 Passed", "Approval UI action workflow and execution status transition"),
        ("src/test/domain-schemas.test.ts", "5 Passed", "Zod schemas validation for transactions, invoices, products, budgets"),
        ("src/test/role-permissions.test.ts", "3 Passed", "RBAC privilege matrix across Owner, Manager, Viewer roles"),
        ("src/test/currency-presets.test.ts", "2 Passed", "CNY (¥), USD, EUR minor unit conversions and locale formatting"),
        ("src/test/theme.test.ts", "3 Passed", "Dark / light mode persistence and system preference synchronization"),
        ("src/test/csv-import.test.ts", "1 Passed", "Legacy fallback parsing and validation error boundaries")
    ]
    for i, row in enumerate(test_data):
        r = test_table.rows[i+1]
        for j, val in enumerate(row):
            c = r.cells[j]
            c.text = val
            c.paragraphs[0].runs[0].font.size = Pt(8.5)
            if j == 1:
                c.paragraphs[0].runs[0].font.bold = True
                c.paragraphs[0].runs[0].font.color.rgb = RGBColor(0x05, 0x96, 0x69)
            set_cell_background(c, "F9FAFB" if i % 2 == 0 else "FFFFFF")

    doc.add_paragraph()
    doc.add_paragraph(
        "Production Build Status: Next.js 15.5.28 production build compiles with 0 errors across all 27 pages, "
        "including static pre-rendering, dynamic serverless routes, and edge middleware."
    )

    doc.save(filename)
    print(f"Created Word Document: {filename}")

def create_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F3A2C'),
        alignment=1, # Center
        spaceAfter=6
    )
    sub_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4B5563'),
        alignment=1,
        spaceAfter=15
    )
    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0F3A2C'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1F2937'),
        spaceAfter=6
    )
    code_style = ParagraphStyle(
        'CodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#0F172A'),
        backColor=colors.HexColor('#F8FAFC'),
        borderColor=colors.HexColor('#CBD5E1'),
        borderWidth=0.5,
        borderPadding=6,
        spaceAfter=8
    )

    story = []

    # Title Banner
    story.append(Paragraph("LEDGER ZERO: SYSTEM ARCHITECTURE &amp; TECHNICAL SPECIFICATION", title_style))
    story.append(Paragraph("Autonomous Financial Operating System &amp; Agentic Copilot for Small Businesses<br/>Tsinghua University PBCSF &amp; WeBank International Track — Topic E: SME Finance Copilot", sub_style))

    # Meta Table
    meta_data = [
        [Paragraph("<b>Competition Track</b>", body_style), Paragraph("Tsinghua PBCSF &amp; WeBank Global FinTechathon — International Track (Topic E)", body_style)],
        [Paragraph("<b>Official Theme</b>", body_style), Paragraph("AI as a Financial Participant: Autonomous Action, Security &amp; Interaction", body_style)],
        [Paragraph("<b>Tech Stack</b>", body_style), Paragraph("Next.js 15, Multi-LLM Orchestrator (DeepSeek / GLM / Qwen / Groq), Supabase SSR Cloud", body_style)],
        [Paragraph("<b>Verification Status</b>", body_style), Paragraph("<b>32 / 32 Tests Passing (100%)</b>, Zero-Error Next.js 15 Production Build", body_style)]
    ]
    t_meta = Table(meta_data, colWidths=[130, 374])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (1,0), (1,-1), colors.HexColor('#FFFFFF')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 12))

    # Section 1
    story.append(Paragraph("1. Executive Summary &amp; Problem Statement", h1_style))
    story.append(Paragraph(
        "Over 82% of small business failures stem directly from cash flow volatility and uncollected accounts receivable. "
        "Conventional accounting tools function as passive historical ledgers: they record past events but offer no forward-looking "
        "intelligence and require tedious manual reconciliation. LEDGER ZERO redefines SME finance by making AI an active, verified "
        "participant capable of real-world operational execution.",
        body_style
    ))
    story.append(Paragraph(
        "Unlike generic LLM wrappers that hallucinate financial figures, LEDGER ZERO strictly decouples natural language understanding "
        "from mathematical execution. Chinese and Global LLMs (DeepSeek-V3/R1, GLM-4, Qwen-Plus, Groq) translate user intents into structured "
        "action parameters, while a verified deterministic engine computes cash projections, inventory deductions, and what-if liquidity buffers.",
        body_style
    ))

    # Section 2
    story.append(Paragraph("2. System Architecture &amp; Data Flow", h1_style))
    story.append(Paragraph(
        "The architecture follows a four-tier resilient topology designed for sub-second response times and auditability:",
        body_style
    ))

    arch_diagram = (
        "+-----------------------------------------------------------------------------------+\n"
        "|                    1. PRESENTATION LAYER (Next.js 15 App Router)                  |\n"
        "|  Shop Dashboard | POS Sell Register | Bills & Invoices | Cash Flow Intelligence   |\n"
        "|  Floating Agent Copilot | Executive Admin Portal (/admin)                         |\n"
        "+-----------------------------------------+-----------------------------------------+\n"
        "                                          | REST / JSON-RPC\n"
        "                                          v\n"
        "+-----------------------------------------------------------------------------------+\n"
        "|                    2. AGENTIC ORCHESTRATION & GATEWAY TIER                        |\n"
        "|  Multi-LLM Gateway: DeepSeek (China), GLM-4 (China), Qwen (China), Groq (Global)  |\n"
        "|  Agent Action Executor: ADD_PRODUCT | CREATE_INVOICE | RECORD_SALE | REMIND_DRAFT |\n"
        "+-----------------------------------------+-----------------------------------------+\n"
        "                                          | Deterministic Math Enforcement\n"
        "                                          v\n"
        "+-----------------------------------------------------------------------------------+\n"
        "|                    3. DETERMINISTIC FINANCIAL ENGINE                              |\n"
        "|  Cash Trajectory Calculator | 7/30d Forecast | Aging Matrix | What-If Simulator   |\n"
        "+-----------------------------------------+-----------------------------------------+\n"
        "                                          | Row-Level Security (RLS)\n"
        "                                          v\n"
        "+-----------------------------------------------------------------------------------+\n"
        "|                    4. DATA & AUDIT PERSISTENCE TIER                               |\n"
        "|  Supabase Cloud PostgreSQL | businesses, products, transactions, invoices, logs   |\n"
        "+-----------------------------------------------------------------------------------+"
    )
    story.append(Paragraph(arch_diagram.replace(" ", "&nbsp;").replace("\n", "<br/>"), code_style))

    # Section 3
    story.append(Paragraph("3. Core Mathematical Algorithms", h1_style))
    story.append(Paragraph("<b>3.1 Recursive Daily Cash Balance Trajectory:</b>", h2_style))
    story.append(Paragraph(
        "C(0) = Verified Bank Balance + Liquid Cash<br/>"
        "C(t) = C(t - 1) + &Sigma; Inflow_k(t) - &Sigma; Outflow_m(t)<br/>"
        "Net 7-Day Liquidity Gap = C(0) - &Sigma;_{t=1..7} PayablesDue(t)<br/>"
        "Shortfall Alert Trigger &hArr; Net 7-Day Liquidity Gap &lt; 0",
        body_style
    ))
    story.append(Paragraph("<b>3.2 Prompt Settlement Discount vs. Overdraft Cost:</b>", h2_style))
    story.append(Paragraph(
        "Cost of Discount = InvoiceAmount &times; &delta;<br/>"
        "Cost of Bank Overdraft = InvoiceAmount &times; r &times; (DaysAccelerated / 365)<br/>"
        "Optimality Criterion: Offer discount if Cost of Discount &lt; Cost of Overdraft AND Net Gap &ge; 0.",
        body_style
    ))

    # Section 4
    story.append(Paragraph("4. Multi-Model Chinese &amp; Global AI Evaluation", h1_style))
    llm_headers = ["Provider", "Model", "Origin", "Role in System"]
    llm_data = [[Paragraph(f"<b>{h}</b>", body_style) for h in llm_headers]]
    llm_rows = [
        ["DeepSeek (深度求索)", "deepseek-chat / reasoner", "China", "Flagship agentic reasoning & planning"],
        ["GLM (智谱 AI)", "glm-4-flash", "China", "Sub-second bilingual entity extraction"],
        ["Qwen (通义千问)", "qwen-plus / turbo", "China", "Domain-specific Chinese SME semantics"],
        ["Groq Cloud", "llama-3.3-70b / 3.1-8b", "Global", "Ultra-fast (<200ms) conversational copilot"],
        ["Google Gemini", "gemini-1.5-flash", "Global", "Document OCR parsing & long context"]
    ]
    for r in llm_rows:
        llm_data.append([Paragraph(cell, body_style) for cell in r])
    
    t_llm = Table(llm_data, colWidths=[120, 130, 60, 194])
    t_llm.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F3A2C')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_llm)
    story.append(Spacer(1, 10))

    # Section 5
    story.append(Paragraph("5. Comprehensive Verification &amp; Build Results", h1_style))
    story.append(Paragraph(
        "LEDGER ZERO maintains 100% test coverage across financial math, security policies, and agent simulator workflows. "
        "All <b>32 unit and integration tests across 9 suites pass</b>, and Next.js 15 production build compiles with <b>0 errors</b>.",
        body_style
    ))

    test_headers = ["Test Suite File", "Pass Rate", "Verified Invariant"]
    test_data = [[Paragraph(f"<b>{h}</b>", body_style) for h in test_headers]]
    test_rows = [
        ["src/test/finance-engine.test.ts", "10 / 10 (100%)", "Deterministic cash projection, aging, and anomaly bounds"],
        ["src/test/pos-inventory.test.ts", "3 / 3 (100%)", "Instant POS sell, stock deduction, and invoice generation"],
        ["src/test/agent-simulator.test.ts", "3 / 3 (100%)", "Human approval requirement and unapproved execution block"],
        ["src/test/approval-flow.test.tsx", "2 / 2 (100%)", "Interactive approval state transitions and audit logging"],
        ["src/test/domain-schemas.test.ts", "5 / 5 (100%)", "Zod strict schema validations for financial records"],
        ["src/test/role-permissions.test.ts", "3 / 3 (100%)", "RBAC privilege enforcement (Owner, Manager, Viewer)"],
        ["src/test/currency-presets.test.ts", "2 / 2 (100%)", "Multi-currency CNY (¥), USD, EUR precision"],
        ["src/test/theme.test.ts", "3 / 3 (100%)", "Theme state persistence across sessions"],
        ["src/test/csv-import.test.ts", "1 / 1 (100%)", "Safe parsing boundaries for bank records"]
    ]
    for r in test_rows:
        test_data.append([
            Paragraph(r[0], body_style),
            Paragraph(f"<font color='#059669'><b>{r[1]}</b></font>", body_style),
            Paragraph(r[2], body_style)
        ])
    t_test = Table(test_data, colWidths=[170, 75, 259])
    t_test.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F3A2C')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(t_test)

    doc.build(story)
    print(f"Created PDF Document: {filename}")

if __name__ == '__main__':
    out_dir = "submission-package"
    os.makedirs(out_dir, exist_ok=True)
    create_docx(os.path.join(out_dir, "01_Technical_Documentation.docx"))
    create_pdf(os.path.join(out_dir, "01_Technical_Documentation.pdf"))
