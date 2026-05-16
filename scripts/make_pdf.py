#!/usr/bin/env python3
"""
Generate a printable Bible study guide PDF from master_outlines.json.
Usage:  python3 scripts/make_pdf.py
Output: pdf/master_outlines_study_guide.pdf
"""

import json, os, sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.flowables import Flowable

# ── paths ──────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "master_outlines.json"
OUT_DIR = ROOT / "public"
OUT_DIR.mkdir(exist_ok=True)
OUT = OUT_DIR / "master_outlines_study_guide.pdf"

doc_data = json.loads(DATA.read_text())

# ── colour palette ─────────────────────────────────────────────────────────
NAVY   = colors.HexColor("#1a2b4a")
GOLD   = colors.HexColor("#b8960c")
LTGRAY = colors.HexColor("#e8e8e8")
MGRAY  = colors.HexColor("#888888")
BLACK  = colors.black

# ── styles ─────────────────────────────────────────────────────────────────
def make_styles():
    s = {}

    def add(name, **kw):
        parent = kw.pop("parent", None)
        base = s[parent] if parent else ParagraphStyle(name)
        if parent:
            ns = ParagraphStyle(name, parent=base)
        else:
            ns = base
        for k, v in kw.items():
            setattr(ns, k, v)
        s[name] = ns
        return ns

    add("body",
        fontName="Times-Roman", fontSize=10.5, leading=15,
        spaceAfter=4, alignment=TA_JUSTIFY)

    add("body_indent", parent="body",
        leftIndent=18)

    add("subpoint", parent="body",
        leftIndent=24, firstLineIndent=0, spaceAfter=3)

    add("quote", parent="body",
        leftIndent=36, rightIndent=18, fontName="Times-Italic",
        spaceAfter=6, spaceBefore=4)

    add("blob", parent="body",
        spaceAfter=6, leading=16)

    add("blob_indent", parent="blob",
        leftIndent=24)

    # point header
    add("point_heading",
        fontName="Times-Bold", fontSize=12, leading=16,
        spaceBefore=10, spaceAfter=4, alignment=TA_LEFT,
        textColor=NAVY)

    add("point_ref",
        fontName="Times-Italic", fontSize=11, leading=14,
        spaceAfter=6, textColor=NAVY)

    add("transition",
        fontName="Times-Italic", fontSize=10, leading=14,
        spaceBefore=8, spaceAfter=4, textColor=MGRAY)

    # outline-level
    add("outline_title",
        fontName="Times-Bold", fontSize=15, leading=20,
        spaceBefore=0, spaceAfter=4, alignment=TA_CENTER,
        textColor=NAVY)

    add("outline_number",
        fontName="Times-Roman", fontSize=11, leading=14,
        spaceBefore=0, spaceAfter=2, alignment=TA_CENTER,
        textColor=GOLD)

    add("summary_body", parent="blob",
        spaceBefore=2, spaceAfter=5, leading=15)

    # front-matter
    add("fm_title",
        fontName="Times-Bold", fontSize=13, leading=18,
        spaceBefore=0, spaceAfter=8, alignment=TA_CENTER,
        textColor=NAVY)

    # section dividers
    add("notes_heading",
        fontName="Times-Bold", fontSize=11, leading=14,
        spaceBefore=14, spaceAfter=6, alignment=TA_CENTER,
        textColor=MGRAY)

    # cover
    add("cover_title",
        fontName="Times-Bold", fontSize=26, leading=34,
        spaceBefore=0, spaceAfter=10, alignment=TA_CENTER,
        textColor=NAVY)

    add("cover_subtitle",
        fontName="Times-Roman", fontSize=16, leading=22,
        spaceAfter=8, alignment=TA_CENTER,
        textColor=NAVY)

    add("cover_compiler",
        fontName="Times-Italic", fontSize=13, leading=18,
        spaceAfter=6, alignment=TA_CENTER,
        textColor=GOLD)

    add("cover_edition",
        fontName="Times-Roman", fontSize=10, leading=14,
        spaceAfter=4, alignment=TA_CENTER,
        textColor=MGRAY)

    add("cover_notice",
        fontName="Times-Roman", fontSize=8, leading=11,
        spaceAfter=4, alignment=TA_CENTER,
        textColor=MGRAY)

    return s

STYLES = make_styles()


# ── inline run → markup ────────────────────────────────────────────────────

def _esc(text):
    """Escape XML special chars for ReportLab markup."""
    return (text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;"))


def runs_to_markup(runs):
    parts = []
    for r in runs:
        t = r["t"]
        if t == "text":
            parts.append(_esc(r["v"]))
        elif t == "italic":
            parts.append(f"<i>{_esc(r['v'])}</i>")
        elif t == "smallcaps":
            # Simulate small-caps: uppercase in a slightly smaller font
            parts.append(f"<font size=9><b>{_esc(r['v'].upper())}</b></font>")
        elif t == "ref":
            parts.append(f"<i>{_esc(r['display'])}</i>")
    return "".join(parts)


def ref_to_markup(ref):
    return f"<i>{_esc(ref['display'])}</i>"


# ── flowable helpers ───────────────────────────────────────────────────────

def rule(color=LTGRAY, thickness=0.5, width="100%", space_before=4, space_after=4):
    return HRFlowable(
        width=width, thickness=thickness, color=color,
        spaceAfter=space_after, spaceBefore=space_before
    )


class NotesLines(Flowable):
    """Renders N ruled lines for handwritten notes."""
    def __init__(self, count=24, line_height=22):
        super().__init__()
        self._count = count
        self._line_height = line_height
        self._w = None
        self.height = count * line_height

    def wrap(self, avail_w, avail_h):
        self._w = avail_w
        # Reduce count to fit available height if needed
        fit = min(self._count, int(avail_h // self._line_height))
        self._drawn = fit
        return avail_w, fit * self._line_height

    def split(self, avail_w, avail_h):
        fit = int(avail_h // self._line_height)
        if fit <= 0:
            return []
        rest = self._count - fit
        parts = [NotesLines(fit, self._line_height)]
        if rest > 0:
            parts.append(NotesLines(rest, self._line_height))
        return parts

    def draw(self):
        count = getattr(self, "_drawn", self._count)
        h = count * self._line_height
        c = self.canv
        c.saveState()
        c.setStrokeColor(colors.HexColor("#cccccc"))
        c.setLineWidth(0.4)
        for i in range(count):
            y = h - (i + 1) * self._line_height
            c.line(0, y, self._w, y)
        c.restoreState()


# ── page templates ─────────────────────────────────────────────────────────
PAGE_W, PAGE_H = letter
MARGIN = 0.85 * inch

def _page_number_footer(canvas, doc):
    if doc.page == 1:
        return  # no footer on cover
    canvas.saveState()
    canvas.setFont("Times-Roman", 8)
    canvas.setFillColor(MGRAY)
    canvas.drawCentredString(PAGE_W / 2, 0.45 * inch, str(doc.page - 1))
    canvas.restoreState()


def _header_footer(canvas, doc):
    _page_number_footer(canvas, doc)
    if doc.page <= 2:
        return
    canvas.saveState()
    canvas.setFont("Times-Italic", 8)
    canvas.setFillColor(MGRAY)
    # thin rule under header area
    canvas.setStrokeColor(LTGRAY)
    canvas.setLineWidth(0.4)
    canvas.line(MARGIN, PAGE_H - MARGIN + 6, PAGE_W - MARGIN, PAGE_H - MARGIN + 6)
    canvas.drawString(MARGIN, PAGE_H - MARGIN + 10,
                      doc_data["title"])
    canvas.restoreState()


def build_doc(story):
    doc = BaseDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        title=doc_data["title"],
        author=doc_data["compiler"],
    )

    cover_frame = Frame(
        MARGIN, MARGIN,
        PAGE_W - 2 * MARGIN, PAGE_H - 2 * MARGIN,
        id="cover"
    )
    body_frame = Frame(
        MARGIN, MARGIN,
        PAGE_W - 2 * MARGIN, PAGE_H - 2 * MARGIN - 0.15 * inch,
        id="body"
    )

    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[cover_frame]),
        PageTemplate(id="Body",  frames=[body_frame], onPage=_header_footer),
    ])

    doc.build(story)
    print(f"✓ Written: {OUT}")


# ── cover page ─────────────────────────────────────────────────────────────

def make_cover():
    story = []
    story.append(Spacer(1, 1.2 * inch))

    story.append(rule(color=GOLD, thickness=2, space_before=0, space_after=14))
    story.append(Paragraph("The Christian Life<br/>New Testament", STYLES["cover_title"]))
    story.append(Paragraph("Fifteen Master Outlines", STYLES["cover_subtitle"]))
    story.append(rule(color=GOLD, thickness=2, space_before=14, space_after=20))

    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph("Bible Study Guide", STYLES["cover_subtitle"]))

    story.append(Spacer(1, 0.5 * inch))
    story.append(Paragraph(f"Compiled by {doc_data['compiler']}", STYLES["cover_compiler"]))
    story.append(Paragraph(doc_data["edition"], STYLES["cover_edition"]))

    story.append(Spacer(1, 1.8 * inch))
    story.append(rule(color=LTGRAY, space_before=0, space_after=8))
    story.append(Paragraph(
        "_" * 52 + "<br/>Name",
        STYLES["cover_edition"]
    ))

    story.append(Spacer(1, 0.6 * inch))
    story.append(Paragraph(doc_data["source_copyright_notice"], STYLES["cover_notice"]))

    story.append(PageBreak())
    return story


# ── front matter ───────────────────────────────────────────────────────────

def blob_to_paragraphs(text, style=None, strip_nav_hints=False):
    """Convert a plain-text blob (double-newline paragraphs) to flowables."""
    import re
    if style is None:
        style = STYLES["blob"]
    paras = []
    for para in text.split("\n\n"):
        lines = para.split("\n")
        if strip_nav_hints:
            lines = [l for l in lines if not re.match(r'^\s*\(Now turn to ', l, re.IGNORECASE)]
        if not any(l.strip() for l in lines):
            continue
        # Detect indented lines (leading spaces)
        if lines and lines[0].startswith("  "):
            use_style = STYLES["blob_indent"]
        else:
            use_style = style
        markup = "<br/>".join(_esc(l) for l in lines)
        if markup.strip():
            paras.append(Paragraph(markup, use_style))
    return paras


def make_front_matter():
    story = []
    for i, section in enumerate(doc_data["front_matter"]):
        story.append(Paragraph(section["title"], STYLES["fm_title"]))
        story.append(rule(color=GOLD, thickness=1, space_after=10))

        if section["kind"] == "blob":
            story.extend(blob_to_paragraphs(section["text"]))
        else:
            for block in section["body"]:
                story.extend(block_to_flowables(block))

        if i < len(doc_data["front_matter"]) - 1:
            story.append(PageBreak())

    story.append(PageBreak())
    return story


# ── point body ─────────────────────────────────────────────────────────────

def block_to_flowables(block):
    flowables = []
    t = block["type"]
    markup = runs_to_markup(block["runs"])
    if t == "paragraph":
        flowables.append(Paragraph(markup, STYLES["body"]))
    elif t == "subpoint":
        label = _esc(block["label"])
        flowables.append(Paragraph(f"<b>{label}</b> {markup}", STYLES["subpoint"]))
    elif t == "quote":
        flowables.append(Paragraph(markup, STYLES["quote"]))
    return flowables


# ── outline + notes ────────────────────────────────────────────────────────

def make_outline(outline):
    story = []
    num = outline["number"]
    title = outline["title"]

    # ── outline header banner ───────────────────────────────────────────
    header_items = [
        Paragraph(f"Master Outline {num}", STYLES["outline_number"]),
        Paragraph(title.upper(), STYLES["outline_title"]),
        rule(color=GOLD, thickness=1.5, space_before=4, space_after=10),
    ]

    # ── summary blob ────────────────────────────────────────────────────
    if outline.get("summary"):
        header_items.extend(blob_to_paragraphs(outline["summary"], STYLES["summary_body"], strip_nav_hints=True))
        header_items.append(rule(color=LTGRAY, space_before=8, space_after=8))

    story.extend(header_items)

    # ── points ──────────────────────────────────────────────────────────
    for point in outline["points"]:
        point_items = []

        ref_display = ref_to_markup(point["primary_reference"])
        point_items.append(Paragraph(
            f"<b>{_esc(point['roman'])}.</b>&nbsp;&nbsp;{ref_display}",
            STYLES["point_heading"]
        ))

        for block in point["body"]:
            point_items.extend(block_to_flowables(block))

        if point.get("transition"):
            raw = _esc(point["transition"]["raw"])
            point_items.append(Paragraph(raw, STYLES["transition"]))

        point_items.append(rule(color=LTGRAY, thickness=0.4, space_before=6, space_after=2))
        story.append(KeepTogether(point_items[:3]))  # keep heading + first block together
        story.extend(point_items[3:])

    # ── notes section ────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph(
        f"Notes — Master Outline {num}: {title}",
        STYLES["notes_heading"]
    ))
    story.append(rule(color=GOLD, thickness=1, space_before=2, space_after=14))
    story.append(NotesLines(count=28))

    # second notes page
    story.append(PageBreak())
    story.append(Paragraph("Notes (continued)", STYLES["notes_heading"]))
    story.append(rule(color=LTGRAY, thickness=0.5, space_before=2, space_after=14))
    story.append(NotesLines(count=32))

    story.append(PageBreak())
    return story


# ── assemble ───────────────────────────────────────────────────────────────

def main():
    story = []

    # Switch to body template after cover
    story.extend(make_cover())
    story.append(Paragraph("", ParagraphStyle("switch")))  # triggers frame switch

    # Manually insert template change — ReportLab way: NextPageTemplate
    from reportlab.platypus import NextPageTemplate
    story.insert(
        story.index(next(f for f in story if isinstance(f, PageBreak))),
        NextPageTemplate("Body")
    )

    story.extend(make_front_matter())
    for outline in doc_data["outlines"]:
        story.extend(make_outline(outline))

    build_doc(story)


if __name__ == "__main__":
    main()
