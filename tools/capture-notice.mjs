#!/usr/bin/env node
// Régénère les 3 captures de la notice (docs/notice-captures/mode-*.png) à partir
// du vrai index.html/styles.css/app.js, en Chromium headless, avec le skin
// "print" (jamais proposé dans l'UI, réservé à cet usage — voir styles.css).
//
// Ne dépend d'aucune donnée de board réelle : le board est vide au lancement
// (pas de localStorage pré-rempli). Les captures montrent donc la structure et
// les 3 modes, pas un contenu de démonstration.
//
//   npm run capture-notice

import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(root, "docs", "notice-captures");
const demoAudioPath = join(root, "tools", "assets", "demo-beep.wav");
const port = 5175;

const MIME = {
  ".html": "text/html;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".js": "text/javascript;charset=utf-8",
  ".mjs": "text/javascript;charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
};

function startServer() {
  const server = createServer((req, res) => {
    let route = decodeURIComponent(req.url.split("?")[0]);
    if (route === "/") route = "/index.html";
    const file = normalize(join(root, route));
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    readFile(file)
      .then((data) => {
        res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
        res.end(data);
      })
      .catch(() => {
        res.writeHead(404);
        res.end("Not found");
      });
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

// data-board-mode-target (clic) -> nom de fichier existant dans notice.md
// ("stage" en interne, "scene" dans le nom de fichier historique). Garage<->Scène
// direct est bloqué dans les deux sens (bouton désactivé) : Studio est le seul
// mode par lequel on peut toujours transiter, voir clic "studio" systématique
// avant chaque cible dans la boucle plus bas.
//
// callouts : pastilles numérotées incrustées dans l'image, dans l'ordre attendu
// par les légendes de notice.md (ex. mode-studio.png — "1 Board · 2 Master ·
// 3 Cues/Crossfade · 4 Pads"). Garage n'a ni Master ni Cues/Crossfade (masqués
// en édition), d'où seulement 2 pastilles pour ce mode.
const MODES = [
  {
    target: "studio", file: "mode-studio.png",
    callouts: [".board-strip", ".master-strip", ".live-tools", "#pads"],
  },
  {
    target: "garage", file: "mode-garage.png",
    callouts: [".board-strip", "#pads"],
  },
  {
    target: "stage", file: "mode-scene.png",
    callouts: [".board-strip", ".master-strip", ".live-tools", "#pads"],
  },
];

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "networkidle" });
    await page.waitForSelector(".board-mode-selector", { state: "visible" });

    // Board dédié à 6 pads (au lieu des 12 de DEFAULT_PAD_COUNT, voir app.js)
    // pour des captures plus compactes — ne touche pas au défaut réel de l'app,
    // juste un board de plus créé via le vrai flux "Ajouter un board".
    await page.click('.board-mode-button[data-board-mode-target="garage"]');
    await page.waitForTimeout(300);
    await page.click("#boardManageSectionToggle");
    await page.click("#addBoard");
    await page.waitForSelector("#newBoardDialog", { state: "visible" });
    await page.fill("#newBoardPadCount", "6");
    await page.fill("#newBoardName", "Notice");
    await page.click("#createNewBoard");
    await page.waitForFunction(() => document.querySelectorAll(".pad").length === 6, { timeout: 5000 });

    // Le mode Scène refuse de s'activer si aucun pad n'a de média réel
    // ("Mode scène impossible : aucun média sur ce board") — on assigne un
    // court bip synthétique (tools/assets/demo-beep.wav) au pad 1 pour lever
    // ce blocage avant de tenter les 3 modes.
    await page.locator(".pad").first().locator('input[data-file]').setInputFiles(demoAudioPath);
    await page.waitForTimeout(500);

    const placeCallouts = async (selectors) => {
      await page.evaluate((sels) => {
        document.querySelectorAll(".notice-callout").forEach((el) => el.remove());
        sels.forEach((sel, i) => {
          const el = document.querySelector(sel);
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return; // masqué dans ce mode
          // Taille x3 (66px / police 36px) pour rester lisible une fois la
          // capture réduite à la largeur de page dans le PDF.
          const badge = document.createElement("div");
          badge.className = "notice-callout";
          badge.textContent = String(i + 1);
          Object.assign(badge.style, {
            position: "absolute",
            left: `${r.left + window.scrollX - 33}px`,
            top: `${r.top + window.scrollY - 33}px`,
            width: "66px",
            height: "66px",
            borderRadius: "50%",
            background: "#000000",
            color: "#ffffff",
            font: "700 36px/66px sans-serif",
            textAlign: "center",
            zIndex: "99999",
            pointerEvents: "none",
          });
          document.body.appendChild(badge);
        });
      }, selectors);
    };

    const goToMode = async (target) => {
      await page.click(`.board-mode-button[data-board-mode-target="${target}"]`);
      await page.waitForFunction(
        (t) => document.body.dataset.boardMode === t,
        target,
        { timeout: 5000 }
      ).catch(() => {});
      // Laisse le temps aux transitions CSS/JS de layout de se stabiliser.
      await page.waitForTimeout(400);
    };

    for (const mode of MODES) {
      if (mode.target !== "studio") await goToMode("studio");
      await goToMode(mode.target);

      // Skin "print" : jamais exposé dans l'UI, on le force directement (voir
      // styles.css body[data-skin="print"]) — réappliqué à chaque mode car le
      // changement de mode semble re-déclencher applySkin() depuis le stockage.
      await page.evaluate(() => { document.body.dataset.skin = "print"; });
      await page.waitForTimeout(100);

      // screenshot({fullPage:true}) scrolle et recolle plusieurs captures pour
      // une page plus haute que le viewport : sur cette page, le résultat
      // recollé revient au rendu AVANT le changement de skin (bug de rendu
      // Chromium headless constaté empiriquement, pas un problème CSS — une
      // capture simple du seul viewport était correcte). Contournement : agrandir
      // le viewport à la hauteur réelle de la page, puis capture simple.
      const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.setViewportSize({ width: 1600, height: fullHeight });
      await page.waitForTimeout(150);
      // Placées après le resize (positions en coordonnées de page finales).
      await placeCallouts(mode.callouts);
      const outPath = join(outDir, mode.file);
      await page.screenshot({ path: outPath });
      console.log(`✓ ${mode.file}`);
    }

    // Fenêtres (dialogues), cadrées individuellement plutôt que la page entière.
    await page.setViewportSize({ width: 1600, height: 1000 });
    await goToMode("studio");
    // Pastilles numérotées de la dernière capture de mode (placeCallouts) :
    // en position absolute figée, elles peuvent se retrouver visuellement
    // dans le cadre d'un dialogue capturé plus loin si leurs coordonnées de
    // page se recoupent. Elles ne servent qu'aux 3 vues d'ensemble, inutiles
    // ici.
    await page.evaluate(() => {
      document.querySelectorAll(".notice-callout").forEach((el) => el.remove());
    });

    const reapplyPrintSkin = () => page.evaluate(() => { document.body.dataset.skin = "print"; });

    // Ces dialogues défilent en interne (max-height: calc(100dvh - 28px) +
    // overflow-y: scroll, voir .audio-dialog/.audio-editor-dialog dans
    // styles.css) : une capture directe ne montrerait que la partie visible
    // sans scroll. On neutralise temporairement max-height/overflow (comme le
    // contournement fullPage plus haut), on élargit le viewport à la hauteur
    // réelle du contenu, on capture, puis on restaure — sans quoi le dialogue
    // resterait "déscrollé" pour la suite du script.
    const screenshotFullDialog = async (selector, outPath) => {
      const dialog = page.locator(selector);
      await dialog.evaluate((el) => {
        el.dataset.noticeOrigMaxHeight = el.style.maxHeight;
        el.dataset.noticeOrigOverflowY = el.style.overflowY;
        el.style.maxHeight = "none";
        el.style.overflowY = "visible";
      });
      const contentHeight = await dialog.evaluate((el) => el.scrollHeight);
      await page.setViewportSize({ width: 1600, height: contentHeight + 100 });
      await page.waitForTimeout(150);
      await dialog.screenshot({ path: outPath });
      await dialog.evaluate((el) => {
        el.style.maxHeight = el.dataset.noticeOrigMaxHeight;
        el.style.overflowY = el.dataset.noticeOrigOverflowY;
        delete el.dataset.noticeOrigMaxHeight;
        delete el.dataset.noticeOrigOverflowY;
      });
      await page.setViewportSize({ width: 1600, height: 1000 });
      await page.waitForTimeout(100);
    };

    // Réglages du pad -> #audioDialog
    await page.locator(".pad").first().locator('[data-action="audio"]').click();
    await page.waitForSelector("#audioDialog[open]");
    await reapplyPrintSkin();
    await page.waitForTimeout(300);
    await screenshotFullDialog("#audioDialog", join(outDir, "dialog-audio-pad.png"));
    console.log("✓ dialog-audio-pad.png");

    // Éditeur audio (régions/trim), ouvert depuis le dialogue ci-dessus -> #audioEditorDialog
    await page.click("#audioRegionsEdit");
    await page.waitForSelector("#audioEditorDialog[open]");
    await reapplyPrintSkin();
    await page.waitForTimeout(300);
    await screenshotFullDialog("#audioEditorDialog", join(outDir, "dialog-audio-editor.png"));
    console.log("✓ dialog-audio-editor.png");
    await page.click("#aeCancel");
    await page.click("#cancelAudio");
    await page.waitForTimeout(200);

    // Audio master -> #masterAudioDialog
    await page.click("#masterAudio");
    await page.waitForSelector("#masterAudioDialog[open]");
    await reapplyPrintSkin();
    await page.waitForTimeout(300);
    await screenshotFullDialog("#masterAudioDialog", join(outDir, "dialog-audio-master.png"));
    console.log("✓ dialog-audio-master.png");
    await page.click("#cancelMasterAudio");
    await page.waitForTimeout(200);

    // Contrôle à distance -> #remoteControlDialog (rôle Façade affiché, code visible)
    await page.click("#remoteControlButton");
    await page.waitForSelector("#remoteControlDialog[open]");
    await page.click("#remoteRoleDisplay");
    await reapplyPrintSkin();
    await page.waitForTimeout(300);
    await screenshotFullDialog("#remoteControlDialog", join(outDir, "dialog-remote-control.png"));
    console.log("✓ dialog-remote-control.png");
    await page.click("#closeRemoteControl");
    await page.waitForTimeout(200);

    // Export du board -> #exportBoardDialog (action de gestion du board,
    // repliée dans le panneau "Gestion du board et des pads", Garage only)
    await goToMode("garage");
    await page.click("#boardManageSectionToggle");
    await page.waitForSelector("#exportBoard", { state: "visible" });
    await page.click("#exportBoard");
    await page.waitForSelector("#exportBoardDialog[open]");
    await reapplyPrintSkin();
    await page.waitForTimeout(300);
    await screenshotFullDialog("#exportBoardDialog", join(outDir, "dialog-export-board.png"));
    console.log("✓ dialog-export-board.png");
    await page.click("#cancelExportBoard");
    await page.waitForTimeout(200);

    // Notes de version -> #versionNotesDialog (nécessite une version existante ;
    // le bloc Versions, comme "Gestion du board", n'est déplié qu'en Garage)
    await page.click("#versionsSectionToggle");
    await page.waitForSelector("#saveVersion", { state: "visible" });
    await page.click("#saveVersion");
    await page.waitForTimeout(300);
    await page.click("#versionNotes");
    await page.waitForSelector("#versionNotesDialog[open]");
    await page.fill("#versionNotesEditor", "Filage 14 juin, avant modif éclairage.");
    await reapplyPrintSkin();
    await page.waitForTimeout(300);
    await screenshotFullDialog("#versionNotesDialog", join(outDir, "dialog-version-notes.png"));
    console.log("✓ dialog-version-notes.png");
    await page.click("#cancelVersionNotes");
    await page.waitForTimeout(200);
    await goToMode("studio");

    // Patch bay crossfade -> #patchBayDialog (avec un câble configuré : pad 1 -> pad 2)
    const firstPad = page.locator(".pad").first();
    await firstPad.locator('[data-action="audio"]').click();
    await page.waitForSelector("#audioDialog[open]");
    await page.selectOption("#audioStartStopMode", "play");
    await page.waitForTimeout(150);
    const targetValue = await page.locator("#audioStartStopTarget option").nth(1).getAttribute("value");
    if (targetValue) await page.selectOption("#audioStartStopTarget", targetValue);
    await page.click("#applyAudio");
    await page.waitForTimeout(200);
    await page.click("#patchBay");
    await page.waitForSelector("#patchBayDialog[open]");
    await reapplyPrintSkin();
    await page.waitForTimeout(300);
    await screenshotFullDialog("#patchBayDialog", join(outDir, "dialog-patch-bay.png"));
    console.log("✓ dialog-patch-bay.png");
    await page.click("#closePatchBay");
    await page.waitForTimeout(200);

    // NB : #liveFxPanel (effets live par pad) n'est volontairement pas capturé
    // ici. Ce panneau n'apparaît qu'une fois un pad réellement en lecture, et
    // en Chromium headless (Playwright) même avec --autoplay-policy=no-user-
    // gesture-required, playPad() ne démarre jamais la lecture (aucune ligne
    // .live-fx-row, aucune erreur JS) : la lecture WebAudio y reste bloquée
    // pour une raison propre à l'environnement headless, pas au code de l'app.
    // Capture à faire manuellement (voir README/notice.md).
    // Estampille : version de l'app pour laquelle ces captures ont été faites
    // (lue par generate-notice.py pour avertir si elles sont périmées).
    const indexHtml = await readFile(join(root, "index.html"), "utf8");
    const version = (indexHtml.match(/app\.js\?v=(\d+)/) || [])[1] || "?";
    await writeFile(join(outDir, ".captured-version"), version + "\n");
    console.log(`✓ .captured-version → v${version}`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
