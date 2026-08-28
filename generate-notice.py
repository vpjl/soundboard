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
l'icône SVG du bouton (ou du label de réglage) correspondant d'index.html
(`#id` ou `action:data-action`, plusieurs séparées par `|`).

Aucun saut de page n'est inséré automatiquement, SAUF quand un titre (`##`
ou `###`) est immédiatement suivi d'une image : le titre sert alors de
légende à l'illustration, les deux sont gardés ensemble en haut d'une page
neuve (CondPageBreak + KeepTogether). Une image peut être réduite avec un
préfixe `0.5x|` dans son texte alt : `![0.5x|légende](chemin.png)`.
"""

import datetime
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
    CondPageBreak, Image as RLImage, KeepTogether, HRFlowable,
)

SRC = "notice.md"
OUT = "soundboard-vl-notice.pdf"
INDEX = "index.html"
BUILD_STAMP = ".notice-build"                                   # version pour laquelle le PDF a été bâti
CAPTURES_STAMP = os.path.join("docs", "notice-captures", ".captured-version")


def read_app_version():
    """Version courante de l'app = le ?v=NNN du <script app.js> dans index.html."""
    try:
        with open(INDEX, encoding="utf-8") as f:
            m = re.search(r"app\.js\?v=(\d+)", f.read())
        return m.group(1) if m else "?"
    except OSError:
        return "?"

ACCENT = colors.HexColor("#2b7a5b")   # vert logo (rappel de l'app)
INK = colors.HexColor("#1c1f27")
MUTED = colors.HexColor("#5a6270")
LINE = colors.HexColor("#d5dae1")
QUOTE_BG = colors.HexColor("#eef4f1")

FRAME_W = A4[0] - 40 * mm
FRAME_H = A4[1] - 36 * mm

ICON_REF = re.compile(r"^!\[([^\]]+)\]\s*")
IMG_LINE = re.compile(r"^!\[([^\]]*)\]\(([^)]+)\)$")
SCALE_PREFIX = re.compile(r"^(\d*\.\d+|\d+)x\|")


def split_image_caption(raw_caption):
    """Sépare un éventuel préfixe d'échelle (`0.5x|légende`) de la légende."""
    m = SCALE_PREFIX.match(raw_caption)
    if not m:
        return raw_caption, 1.0
    return raw_caption[m.end():], float(m.group(1))


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
    """Icônes des boutons/réglages d'index.html, indexées par `#id` et `action:x`.

    Les icônes sont des <svg><use href="#ic-…"></svg> pointant vers le sprite
    #iconSprite (voir index.html) : le <use> est résolu ici en réinjectant le
    contenu du <symbol> correspondant, car un SVG extrait/écrit isolément
    (svg2rlg) n'a pas accès au sprite du document source.

    Deux familles de balises portent une icône dans ce document : les
    <button id=… data-action=…> classiques, et les <label> de réglage qui
    enveloppent une <svg> + un <input id=…>/<select id=…> (ex. Reverse, Fade
    in/out dans les réglages audio du pad) — l'id à utiliser est alors celui
    du champ, pas du label (qui n'en a généralement pas).
    """
    try:
        with open(INDEX, encoding="utf-8") as f:
            html = f.read()
    except FileNotFoundError:
        return {}
    symbols = extract_icon_symbols(html)
    svgs = {}

    def harvest(tag_name):
        for m in re.finditer(rf"<{tag_name}\b[^>]*>.*?</{tag_name}>", html, re.S):
            block = m.group(0)
            open_tag = block[: block.index(">") + 1]
            svg = re.search(r"<svg\b[^>]*>(.*?)</svg>", block, re.S)
            if not svg:
                continue
            markup = svg.group(0)
            use_m = re.search(r'<use href="#([^"]+)"', svg.group(1))
            if use_m:
                symbol_content = symbols.get(use_m.group(1), "")
                markup = markup.replace(svg.group(1), symbol_content)
            id_m = re.search(r'id="([^"]+)"', open_tag)
            if not id_m:
                id_m = re.search(r'<(?:input|select)\b[^>]*\bid="([^"]+)"', block)
            action_m = re.search(r'data-action="([^"]+)"', open_tag)
            if id_m:
                svgs.setdefault("#" + id_m.group(1), markup)
            if action_m:
                svgs.setdefault("action:" + action_m.group(1), markup)

    harvest("button")
    harvest("label")
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


def screenshot_flowables(path, caption, st, extra_scale=1.0, reserved_h=0):
    """Capture d'écran, légende dessous. [] si fichier absent.

    Toujours insérée dans le fil du texte (KeepTogether : image+légende ne se
    coupent jamais entre deux pages), sans saut de page forcé — sauf quand
    l'appelant détecte qu'un titre la précède immédiatement, auquel cas le
    saut est ajouté en amont, autour du couple titre+image (`reserved_h`
    laisse alors la place au titre dans la même page, sans quoi l'image
    pleine page + le titre ne tiendraient plus ensemble et KeepTogether les
    séparerait faute de place). `extra_scale` réduit/agrandit l'image au-delà
    de l'ajustement automatique à la page (ex. 0.5 pour une capture affichée
    deux fois plus petite).
    """
    if not os.path.exists(path):
        print(f"  (capture absente, ignorée : {path})")
        return []
    img = RLImage(path)
    iw, ih = img.imageWidth, img.imageHeight
    max_h = FRAME_H - 18 * mm - reserved_h
    scale = min(FRAME_W / iw, max_h / ih) * extra_scale
    img.drawWidth = iw * scale
    img.drawHeight = ih * scale
    img.hAlign = "CENTER"
    block = [img]
    if caption:
        block += [Spacer(1, 6), Paragraph(inline(caption), st["caption"])]
    return [Spacer(1, 6), KeepTogether(block), Spacer(1, 10)]


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

        # Capture d'écran : ![légende](chemin), avec ![0.5x|légende](chemin)
        # pour une taille d'affichage réduite/agrandie.
        img_m = IMG_LINE.match(stripped)
        if img_m:
            caption, extra_scale = split_image_caption(img_m.group(1))
            story += screenshot_flowables(img_m.group(2), caption, st, extra_scale)
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

        if stripped.startswith("### ") or stripped.startswith("## "):
            is_chapter = stripped.startswith("## ")
            style = st["h1"] if is_chapter else st["h2"]
            text = stripped[3:] if is_chapter else stripped[4:]
            heading_block = [Paragraph(inline(text), style)]
            if is_chapter:
                # Trait fin d'un bord à l'autre : rend le titre de chapitre
                # plus visible, seul repère visuel de rupture maintenant que
                # les chapitres ne forcent plus systématiquement une page neuve.
                heading_block.append(
                    HRFlowable(width="100%", thickness=0.75, color=ACCENT,
                               spaceBefore=2, spaceAfter=10, lineCap="butt")
                )

            # Titre immédiatement suivi d'une image (lignes vides ignorées) :
            # le titre sert de légende à l'illustration — on les garde
            # ensemble en haut d'une page neuve plutôt que de les laisser
            # séparer par la pagination naturelle.
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            next_img = IMG_LINE.match(lines[j].strip()) if j < len(lines) else None
            if next_img:
                caption, extra_scale = split_image_caption(next_img.group(1))
                # Place réservée pour le bloc titre (+ trait fin s'il y en a
                # un) au-dessus de l'image, sinon les deux ne tiennent plus
                # ensemble sur une page et KeepTogether les sépare.
                reserved_h = (30 * mm) if is_chapter else (18 * mm)
                img_block = screenshot_flowables(next_img.group(2), caption, st,
                                                  extra_scale, reserved_h)
                story.append(CondPageBreak(FRAME_H - 8 * mm))
                story.append(KeepTogether(heading_block + img_block))
                i = j + 1
                continue
            story += heading_block
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

    version = read_app_version()

    # Captures périmées ? (docs/notice-captures/.captured-version, écrit par capture-notice.mjs)
    try:
        with open(CAPTURES_STAMP, encoding="utf-8") as f:
            captured = f.read().strip()
    except OSError:
        captured = None
    if captured and captured != version:
        print(f"  ⚠ captures faites pour v{captured}, app en v{version} — "
              f"relance d'abord : npm run capture-notice")

    st = build_styles()
    svgs = extract_button_svgs()
    today = datetime.date.today().isoformat()

    def footer(canvas, doc_):
        canvas.saveState()
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(MUTED)
        canvas.drawString(20 * mm, 10 * mm,
                          f"Soundboard VL — notice pour l'application v{version} ({today})")
        canvas.drawRightString(A4[0] - 20 * mm, 10 * mm, f"page {doc_.page}")
        canvas.restoreState()

    doc = SimpleDocTemplate(
        OUT, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=18 * mm, bottomMargin=18 * mm,
        title=f"Soundboard VL — Notice de fonctionnement (v{version})",
        author="Vincent Lainé",
    )
    doc.build(parse(md, st, svgs), onFirstPage=footer, onLaterPages=footer)

    with open(BUILD_STAMP, "w", encoding="utf-8") as f:
        f.write(version + "\n")
    print(f"OK → {OUT}  (v{version})")


if __name__ == "__main__":
    main()
