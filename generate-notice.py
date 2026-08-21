#!/usr/bin/env python3
"""Régénère soundboard-vl-notice.pdf à partir de la source éditable notice.md.

La notice se maintient dans notice.md (Markdown lisible). Après édition, relancer :

    python3 generate-notice.py

Prérequis : reportlab + svglib  (pip3 install reportlab svglib)

Le script gère un sous-ensemble Markdown suffisant pour la notice :
  #, ##, ###   titres        |  - …          listes à puces
  > …          encadré/note  |  | a | b |    tableaux
  **gras**     _italique_    |  ligne vide   séparation
  ![alt](chemin.png)         image de capture, PLEINE PAGE, légendée par alt
                             (ignorée avec un avertissement si le fichier manque)

Puces avec icône : `- ![#idBouton] **Titre** : …` remplace le tiret par
l'icône SVG du bouton correspondant d'index.html (`#id` ou `action:data-action`,
plusieurs séparées par `|`). Un saut de page est inséré avant chaque titre
`## Mode …` sauf s'il tombe déjà en haut de page (CondPageBreak).
"""

import os
import re
import sys
import tempfile
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    CondPageBreak, PageBreak, Image as RLImage,
)

SRC = "notice.md"
OUT = "soundboard-vl-notice.pdf"
INDEX = "index.html"

ACCENT = colors.HexColor("#2b7a5b")   # vert logo (rappel de l'app)
INK = colors.HexColor("#1c1f27")
MUTED = colors.HexColor("#5a6270")
LINE = colors.HexColor("#d5dae1")
QUOTE_BG = colors.HexColor("#eef4f1")

FRAME_W = A4[0] - 40 * mm
FRAME_H = A4[1] - 36 * mm

ICON_REF = re.compile(r"^!\[([^\]]+)\]\s*")
IMG_LINE = re.compile(r"^!\[([^\]]*)\]\(([^)]+)\)$")


def inline(text):
    """Convertit le markup inline Markdown en balises reportlab."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<![\w])_(.+?)_(?![\w])", r"<i>\1</i>", text)
    return text


# ---------------------------------------------------------------- icônes


def extract_icon_symbols(html):
    """Symboles du sprite #iconSprite d'index.html, indexés par id (sans `#`)."""
    m = re.search(r'<svg id="iconSprite".*?</svg>', html, re.S)
    if not m:
        return {}
    return {
        sym_id: content
        for sym_id, content in re.findall(
            r'<symbol id="([^"]+)"[^>]*>(.*?)</symbol>', m.group(0), re.S
        )
    }


def extract_button_svgs():
    """Icônes des boutons d'index.html, indexées par `#id` et `action:x`.

    Les icônes de boutons sont des <svg><use href="#ic-…"></svg> pointant vers
    le sprite #iconSprite (voir index.html) : le <use> est résolu ici en
    réinjectant le contenu du <symbol> correspondant, car un SVG extrait/écrit
    isolément (svg2rlg) n'a pas accès au sprite du document source.
    """
    try:
        with open(INDEX, encoding="utf-8") as f:
            html = f.read()
    except FileNotFoundError:
        return {}
    symbols = extract_icon_symbols(html)
    svgs = {}
    for m in re.finditer(r"<button\b[^>]*>.*?</button>", html, re.S):
        tag = m.group(0)
        open_tag = tag[: tag.index(">") + 1]
        svg = re.search(r"<svg\b[^>]*>(.*?)</svg>", tag, re.S)
        if not svg:
            continue
        markup = svg.group(0)
        use_m = re.search(r'<use href="#([^"]+)"', svg.group(1))
        if use_m:
            symbol_content = symbols.get(use_m.group(1), "")
            markup = markup.replace(svg.group(1), symbol_content)
        id_m = re.search(r'id="([^"]+)"', open_tag)
        action_m = re.search(r'data-action="([^"]+)"', open_tag)
        if id_m:
            svgs.setdefault("#" + id_m.group(1), markup)
        if action_m:
            svgs.setdefault("action:" + action_m.group(1), markup)
    return svgs


_icon_cache = {}
ICON_PT = 10          # taille de rendu de l'icône dans le PDF
ICON_COL = 16         # largeur de colonne par icône (aligne le texte sur les puces)


def icon_drawing(key, svgs):
    """Icône SVG du bouton `key` en Drawing reportlab (vectoriel) ; None si absente.

    Pas de rasterisation (renderPM exigerait cairo) : le Drawing s'insère tel
    quel dans une cellule de tableau et reste net à toute échelle.
    """
    if key in _icon_cache:
        markup = _icon_cache[key]
    else:
        markup = svgs.get(key)
        if not markup:
            print(f"  (icône {key} introuvable dans {INDEX})")
        _icon_cache[key] = markup
    if not markup:
        return None
    try:
        from svglib.svglib import svg2rlg
        svg = markup.replace("currentColor", "#1c1f27")
        if "xmlns" not in svg:
            svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"', 1)
        if "width=" not in svg.split(">", 1)[0]:
            svg = svg.replace("<svg", '<svg width="24" height="24"', 1)
        path = os.path.join(tempfile.gettempdir(),
                            "notice-icon-" + re.sub(r"\W", "_", key) + ".svg")
        with open(path, "w", encoding="utf-8") as f:
            f.write(svg)
        drawing = svg2rlg(path)
        scale = ICON_PT / max(drawing.width, drawing.height, 1)
        drawing.scale(scale, scale)
        drawing.width *= scale
        drawing.height *= scale
        return drawing
    except Exception as exc:  # svglib manquant ou SVG non supporté → puce simple
        print(f"  (icône {key} ignorée : {exc})")
        return None


def bullet_flowable(raw, st, svgs):
    """Une entrée de liste : icône(s) de bouton à la place du tiret si annotée,
    sinon puce ronde."""
    m = ICON_REF.match(raw)
    icons = []
    if m:
        raw = raw[m.end():]
        icons = [d for d in (icon_drawing(k.strip(), svgs)
                             for k in m.group(1).split("|")) if d]
    text = Paragraph(inline(raw), st["bulletText"])
    if not icons:
        return Paragraph('<font color="#2b7a5b">•</font>&nbsp; ' + inline(raw),
                         st["bullet"])
    widths = [ICON_COL] * len(icons) + [FRAME_W - ICON_COL * len(icons)]
    t = Table([icons + [text]], colWidths=widths, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t


# ---------------------------------------------------------------- captures


def screenshot_flowables(path, caption, st):
    """Capture d'écran en pleine page, légende dessous. [] si fichier absent."""
    if not os.path.exists(path):
        print(f"  (capture absente, ignorée : {path})")
        return []
    img = RLImage(path)
    iw, ih = img.imageWidth, img.imageHeight
    max_h = FRAME_H - 18 * mm  # place pour la légende
    scale = min(FRAME_W / iw, max_h / ih)
    img.drawWidth = iw * scale
    img.drawHeight = ih * scale
    img.hAlign = "CENTER"
    out = [PageBreak(), img]
    if caption:
        out += [Spacer(1, 6), Paragraph(inline(caption), st["caption"])]
    out.append(PageBreak())
    return out


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
                                 fontSize=9.5, leading=13.5, textColor=INK,
                                 leftIndent=16, firstLineIndent=-16, spaceAfter=2.5),
        "bulletText": ParagraphStyle("bulletText", parent=ss["Normal"],
                                     fontName="Helvetica", fontSize=9.5,
                                     leading=13.5, textColor=INK),
        "quote": ParagraphStyle("quote", parent=ss["Normal"], fontName="Helvetica-Oblique",
                                fontSize=9.5, leading=13.5, textColor=MUTED,
                                leftIndent=8, spaceBefore=4, spaceAfter=8),
        "caption": ParagraphStyle("caption", parent=ss["Normal"], fontName="Helvetica-Oblique",
                                  fontSize=9, leading=12, textColor=MUTED,
                                  alignment=1),
        "th": ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8.5,
                             leading=11, textColor=colors.white),
        "td": ParagraphStyle("td", fontName="Helvetica", fontSize=8.5,
                             leading=11, textColor=INK),
    }


def make_table(rows, st):
    header = [Paragraph(inline(c), st["th"]) for c in rows[0]]
    body = [[Paragraph(inline(c), st["td"]) for c in r] for r in rows[1:]]
    ncols = len(rows[0])
    avail = FRAME_W
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


def parse(md, st, svgs):
    story = []
    lines = md.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        stripped = line.strip()

        if not stripped:
            i += 1
            continue

        # Capture d'écran pleine page : ![légende](chemin)
        img_m = IMG_LINE.match(stripped)
        if img_m:
            story += screenshot_flowables(img_m.group(2), img_m.group(1), st)
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
            while i < len(lines) and lines[i].strip().startswith("- "):
                story.append(bullet_flowable(lines[i].strip()[2:], st, svgs))
                i += 1
            story.append(Spacer(1, 5))
            continue

        if stripped.startswith("### "):
            story.append(Paragraph(inline(stripped[4:]), st["h2"]))
        elif stripped.startswith("## "):
            # Chaque mode (Garage / Studio / Scène) démarre sur une page neuve,
            # sauf si le fil tombe déjà en haut de page (CondPageBreak : saute
            # seulement s'il reste moins d'une quasi-pleine page).
            if stripped.startswith("## Mode "):
                story.append(CondPageBreak(FRAME_H - 8 * mm))
            story.append(Paragraph(inline(stripped[3:]), st["h1"]))
        elif stripped.startswith("# "):
            story.append(Paragraph(inline(stripped[2:]), st["title"]))
        elif stripped.startswith("> "):
            q = Paragraph(inline(stripped[2:]), st["quote"])
            story.append(Table([[q]], colWidths=[FRAME_W],
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
    svgs = extract_button_svgs()
    doc = SimpleDocTemplate(
        OUT, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=18 * mm, bottomMargin=18 * mm,
        title="Soundboard VL — Notice de fonctionnement",
        author="Vincent Lainé",
    )
    doc.build(parse(md, st, svgs))
    print(f"OK → {OUT}")


if __name__ == "__main__":
    main()
