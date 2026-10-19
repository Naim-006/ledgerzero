"""
Script to generate complete, high-quality, professional competition documentation for
LEDGER ZERO: Autonomous SME Finance Copilot & Operating System.
Competition: Tsinghua University PBCSF & WeBank Global FinTechathon (Topic E)
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable, Image as RLImage
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import pptx
from pptx.util import Inches as PptInches, Pt as PptPt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor as PptRGBColor

OUTPUT_DIR = "submission-package"
os.makedirs(OUTPUT_DIR, exist_ok=True)
ASSETS_DIR = os.path.join(OUTPUT_DIR, "assets")

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute total pages and draw professional headers/footers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover page
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        # Header
        self.drawString(54, 750, "LEDGER ZERO — Autonomous SME Finance Copilot | Topic E Technical Documentation")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 744, 558, 744)
        # Footer
        self.line(54, 45, 558, 45)
        self.drawString(54, 32, "Confidential — Tsinghua University PBCSF & WeBank Global FinTechathon")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 32, page_text)
        self.restoreState()


def build_pdf_styles():
    styles = getSampleStyleSheet()
    primary = colors.HexColor("#0f172a")
    accent = colors.HexColor("#047857")
    slate = colors.HexColor("#334155")
    
    styles.add(ParagraphStyle('DocTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=24, leading=28, textColor=primary, alignment=1))
    styles.add(ParagraphStyle('DocSubtitle', parent=styles['Normal'], fontName='Helvetica', fontSize=12, leading=16, textColor=accent, alignment=1))
    styles.add(ParagraphStyle('MetaBlock', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=13, textColor=slate, alignment=1))
    styles.add(ParagraphStyle('SecHeading', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=15, leading=19, textColor=primary, keepWithNext=True))
    styles.add(ParagraphStyle('SubSecHeading', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12, leading=15, textColor=accent, keepWithNext=True))
    styles.add(ParagraphStyle('BodyTextCustom', parent=styles['Normal'], fontName='Helvetica', fontSize=9.5, leading=13.5, textColor=slate))
    styles.add(ParagraphStyle('BodyBoldCustom', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9.5, leading=13.5, textColor=primary))
    styles.add(ParagraphStyle('BulletCustom', parent=styles['Normal'], fontName='Helvetica', fontSize=9.5, leading=13.5, textColor=slate, leftIndent=15))
    styles.add(ParagraphStyle('CodeBlock', parent=styles['Normal'], fontName='Courier', fontSize=8, leading=11, textColor=colors.HexColor("#1e293b"), backColor=colors.HexColor("#f8fafc")))
    styles.add(ParagraphStyle('CalloutText', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=9, leading=13, textColor=colors.HexColor("#065f46")))
    styles.add(ParagraphStyle('TableHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=colors.white, alignment=1))
    styles.add(ParagraphStyle('TableCell', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=11, textColor=slate))
    styles.add(ParagraphStyle('TableCellBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=primary))
    return styles

print("Base setup loaded.")
