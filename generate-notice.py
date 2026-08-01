#!/usr/bin/env python3
"""Régénère soundboard-vl-notice.pdf à partir de la source éditable notice.md.

La notice se maintient dans notice.md (Markdown lisible). Après édition, relancer :

    python3 generate-notice.py

Prérequis : reportlab  (pip3 install reportlab)

Le script gère un sous-ensemble Markdown suffisant pour la notice :
  #, ##, ###   titres        |  - …          listes à puces
  > …          encadré/note  |  | a | b |    tableaux
  **gras**     _italique_    |  ligne vide   séparation
"""

import re
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem, Table, TableStyle,
)

SRC = "notice.md"
OUT = "soundboard-vl-notice.pdf"

ACCENT = colors.HexColor("#2b7a5b")   # vert logo (rappel de l'app)
INK = colors.HexColor("#1c1f27")
MUTED = colors.HexColor("#5a6270")
LINE = colors.HexColor("#d5dae1")
QUOTE_BG = colors.HexColor("#eef4f1")


def inline(text):
    """Convertit le markup inline Markdown en balises reportlab."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<![\w])_(.+?)_(?![\w])", r"<i>\1</i>", text)
    return text


def build_styles():
    ss = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("t", parent=ss["Title"], fontName="Helvetica-Bold",
                                fontSize=22, leading=26, textColor=ACCENT, spaceAfter=14),
        "h1": ParagraphStyle("h1", parent=ss["Heading1"], fontName="Helvetica-Bold",
                              fontSize=14, leading=18, textColor=ACCENT,
                              spaceBefore=16, spaceAfter=6),
        "h2": ParagraphStyle("h2", parent=ss["Heading2"], fontName="Helvetica-Bold",
                             fontSize=11, leading=15, textColor=INK,
                             spaceBefore=10, spaceAfter=4),
        "body": ParagraphStyle("body", parent=ss["Normal"], fontName="Helvetica",
                               fontSize=9.5, leading=13.5, textColor=INK, spaceAfter=4),
        "bullet": ParagraphStyle("bullet", parent=ss["Normal"], fontName="Helvetica",
                                 fontSize=9.5, leading=13.5, textColor=INK),
        "quote": ParagraphStyle("quote", parent=ss["Normal"], fontName="Helvetica-Oblique",
                                fontSize=9.5, leading=13.5, textColor=MUTED,
                                leftIndent=8, spaceBefore=4, spaceAfter=8),
        "th": ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8.5,
                             leading=11, textColor=colors.white),
        "td": ParagraphStyle("td", fontName="Helvetica", fontSize=8.5,
                             leading=11, textColor=INK),
    }


def make_table(rows, st):
    header = [Paragraph(inline(c), st["th"]) for c in rows[0]]
    body = [[Paragraph(inline(c), st["td"]) for c in r] for r in rows[1:]]
    ncols = len(rows[0])
    avail = A4[0] - 40 * mm
    first = avail * 0.40
    others = (avail - first) / (ncols - 1)
    widths = [first] + [others] * (ncols - 1)
    t = Table([header] + body, colWidths=widths, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f4f7f9")]),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def parse(md, st):
    story = []
    lines = md.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        stripped = line.strip()

        if not stripped:
            i += 1
            continue

        # Tableau : bloc de lignes consécutives commençant par |
        if stripped.startswith("|"):
            block = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                block.append(lines[i].strip())
                i += 1
            rows = []
            for row in block:
                if re.match(r"^\|[\s:|-]+\|$", row):   # ligne séparatrice |---|
                    continue
                cells = [c.strip() for c in row.strip("|").split("|")]
                rows.append(cells)
            if rows:
                story.append(make_table(rows, st))
                story.append(Spacer(1, 8))
            continue

        # Liste à puces : bloc de lignes consécutives commençant par -
        if stripped.startswith("- "):
            items = []
            while i < len(lines) and lines[i].strip().startswith("- "):
                items.append(ListItem(
                    Paragraph(inline(lines[i].strip()[2:]), st["bullet"]),
                    leftIndent=14, value="•"))
                i += 1
            story.append(ListFlowable(items, bulletType="bullet", bulletColor=ACCENT,
                                      bulletFontSize=8, spaceBefore=2, spaceAfter=6))
            continue

        if stripped.startswith("### "):
            story.append(Paragraph(inline(stripped[4:]), st["h2"]))
        elif stripped.startswith("## "):
            story.append(Paragraph(inline(stripped[3:]), st["h1"]))
        elif stripped.startswith("# "):
            story.append(Paragraph(inline(stripped[2:]), st["title"]))
        elif stripped.startswith("> "):
            q = Paragraph(inline(stripped[2:]), st["quote"])
            story.append(Table([[q]], colWidths=[A4[0] - 40 * mm],
                               style=TableStyle([
                                   ("BACKGROUND", (0, 0), (-1, -1), QUOTE_BG),
                                   ("LEFTPADDING", (0, 0), (-1, -1), 8),
                                   ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                                   ("TOPPADDING", (0, 0), (-1, -1), 5),
                                   ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                                   ("LINEBEFORE", (0, 0), (0, -1), 2, ACCENT),
                               ])))
            story.append(Spacer(1, 6))
        else:
            story.append(Paragraph(inline(stripped), st["body"]))
        i += 1
    return story


def main():
    try:
        with open(SRC, encoding="utf-8") as f:
            md = f.read()
    except FileNotFoundError:
        sys.exit(f"Source introuvable : {SRC}")

    st = build_styles()
    doc = SimpleDocTemplate(
        OUT, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=18 * mm, bottomMargin=18 * mm,
        title="Soundboard VL — Notice de fonctionnement",
        author="Vincent Lainé",
    )
    doc.build(parse(md, st))
    print(f"OK → {OUT}")


if __name__ == "__main__":
    main()
