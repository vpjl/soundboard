// Tests de fumée : les régressions qui reviennent le plus souvent.
//
//   npm test
//
// 1. Le mode (Scène, Garage) survit au rechargement, sans repasser par Studio.
// 2. Un pad se lance et s'arrête.
// 3. Un board exporté puis réimporté garde ses réglages.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  root, startServer, launchBrowser, newContext, openApp, makeToneFile,
  boardMode, goToMode, loadToneIntoFirstPad, isPlaying,
} from "./helpers.mjs";

let server;
let url;
let browser;
let toneFile;

before(async () => {
  ({ server, url } = await startServer());
  browser = await launchBrowser();
  toneFile = await makeToneFile();
});

after(async () => {
  await browser?.close();
  server?.close();
});

// Journal de tous les modes que la page a affichés depuis le début du
// chargement, pour attraper un clignotement Scène -> Studio -> Scène.
function recordModes(page) {
  return page.addInitScript(() => {
    window.__modeLog = [];
    const note = () => {
      const body = document.body;
      if (!body) return;
      const mode = body.classList.contains("stage-mode") ? "stage"
        : body.classList.contains("board-edit-mode") ? "garage"
        : body.dataset.boardMode || "";
      if (mode && window.__modeLog.at(-1) !== mode) window.__modeLog.push(mode);
    };
    new MutationObserver(note).observe(document, {
      subtree: true, attributes: true, childList: true,
      attributeFilter: ["class", "data-board-mode"],
    });
  });
}

const modeLog = (page) => page.evaluate(() => window.__modeLog);

test("le mode Scène survit au rechargement, sans repasser par Studio", async () => {
  const context = await newContext(browser);
  const page = await openApp(context, url);
  await loadToneIntoFirstPad(page, toneFile);
  await goToMode(page, "stage");

  await recordModes(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800); // laisser passer les initialisations asynchrones

  assert.equal(await boardMode(page), "stage");
  assert.deepEqual(await modeLog(page), ["stage"], "le mode a changé pendant le rechargement");
  assert.deepEqual(page.errors, []);
  await context.close();
});

test("le mode Garage survit au rechargement", async () => {
  const context = await newContext(browser);
  const page = await openApp(context, url);
  await goToMode(page, "garage");

  await recordModes(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  assert.equal(await boardMode(page), "garage");
  assert.deepEqual(await modeLog(page), ["garage"], "le mode a changé pendant le rechargement");
  assert.deepEqual(page.errors, []);
  await context.close();
});

test("un nouvel onglet démarre en Studio, même si la Scène était active", async () => {
  const context = await newContext(browser);
  const page = await openApp(context, url);
  await loadToneIntoFirstPad(page, toneFile);
  await goToMode(page, "stage");
  await page.close();

  const fresh = await openApp(context, url);
  await fresh.waitForTimeout(800);
  assert.equal(await boardMode(fresh), "studio");
  await context.close();
});

test("un pad se lance puis s'arrête", async () => {
  const context = await newContext(browser);
  const page = await openApp(context, url);
  const pad = await loadToneIntoFirstPad(page, toneFile);

  await pad.locator('[data-mode="oneshot"]').click();
  await page.waitForFunction(() => document.querySelector(".pad")?.classList.contains("is-playing"), null, { timeout: 5000 });

  await page.waitForTimeout(500);
  assert.equal(await isPlaying(pad), true, "la lecture s'est arrêtée toute seule");

  await pad.locator('[data-action="stop"]').click({ force: true });
  await page.waitForFunction(() => !document.querySelector(".pad")?.classList.contains("is-playing"), null, { timeout: 5000 });
  assert.deepEqual(page.errors, []);
  await context.close();
});

// Réglages d'un pad qui doivent survivre à l'aller-retour. Les identifiants
// (id du board, horodatages) changent forcément à l'import : on ne les compare pas.
function padSummary(pad) {
  return {
    index: pad.index,
    title: pad.title,
    volume: pad.volume,
    panValue: pad.panValue,
    loop: pad.loop,
    color: pad.color,
    audioName: pad.audio?.name ?? pad.audioName ?? "",
  };
}

// Le bouton d'export est dans la section « gestion du board », en Garage.
async function exportSettings(page) {
  return exportBoard(page, "#exportBoardSettingsOnly");
}

async function exportSettingsAndSounds(page) {
  return exportBoard(page, "#exportBoardWithAudio");
}

async function exportBoard(page, button) {
  await goToMode(page, "garage");
  if (!(await page.locator("#exportBoard").isVisible())) await page.click("#boardManageSectionToggle");
  await page.click("#exportBoard");
  await page.waitForSelector("#exportBoardDialog[open]");
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 10000 }),
    page.click(button),
  ]);
  const path = await download.path();
  return { path, json: JSON.parse(await readFile(path, "utf8")) };
}

test("export puis import d'un board : les réglages sont conservés", async () => {
  const context = await newContext(browser);
  const page = await openApp(context, url);
  const pad = await loadToneIntoFirstPad(page, toneFile);

  // Des réglages différents des valeurs par défaut, sinon une valeur perdue à
  // l'import passerait inaperçue (elle retomberait sur le défaut).
  const setRange = (selector, value) => pad.locator(selector).evaluate((input, v) => {
    input.value = String(v);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await setRange("[data-volume]", 0.42);
  await setRange("[data-pan]", -0.3);
  await page.waitForTimeout(300);

  const first = await exportSettings(page);
  assert.equal(first.json.format, "soundboard-live-board");
  const exportedPads = first.json.board.pads.map(padSummary);
  const firstPad = exportedPads.find((p) => p.index === 0);
  assert.equal(firstPad?.audioName, "test-tone.wav");
  assert.equal(firstPad?.volume, 0.42, "le volume réglé n'est pas dans l'export");
  assert.equal(firstPad?.panValue, -0.3, "le panoramique réglé n'est pas dans l'export");

  const boardsBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("soundboard-live-boards")).length);
  await page.locator("#importBoardFile").setInputFiles(first.path);
  await page.waitForFunction(
    (n) => JSON.parse(localStorage.getItem("soundboard-live-boards")).length === n + 1,
    boardsBefore,
    { timeout: 10000 },
  );
  await page.waitForTimeout(500);

  const second = await exportSettings(page);
  assert.equal(second.json.board.padCount, first.json.board.padCount);
  assert.deepEqual(second.json.board.pads.map(padSummary), exportedPads);
  assert.deepEqual(page.errors, []);
  await context.close();
});

// Les vidéos ne voyagent pas dans l'export (trop lourdes) : l'app prévient,
// puis exporte le board avec la référence de la vidéo, à relier après import.
test("export d'un board avec un pad vidéo : le fichier part, la vidéo est référencée", async () => {
  const context = await newContext(browser);
  const page = await openApp(context, url);
  const pad = page.locator(".pad").first();
  await pad.locator('[data-action="audio"]').click();
  await page.waitForSelector("#audioDialog[open]");
  await page.locator("#audioVideoFile").setInputFiles(join(root, "tools", "assets", "demo-video.mp4"));
  await page.waitForFunction(() => /demo.video/i.test(document.querySelector(".pad")?.textContent || ""), null, { timeout: 10000 });
  await page.click("#applyAudio");
  await page.waitForTimeout(300);

  const { json } = await exportSettingsAndSounds(page);
  const video = json.board.pads.find((p) => p.index === 0)?.video;
  assert.equal(video?.name, "demo-video.mp4");
  assert.ok(!video?.data, "la vidéo ne devrait pas être embarquée");
  assert.deepEqual(page.errors, []);
  await context.close();
});

test("stockage du navigateur plein : l'app continue et prévient", async () => {
  const context = await newContext(browser);
  const page = await openApp(context, url);
  const messages = [];
  page.on("dialog", (dialog) => messages.push(dialog.message()));
  await page.evaluate(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("quota", "QuotaExceededError");
    };
  });
  await goToMode(page, "garage");
  await goToMode(page, "studio");
  assert.equal(await boardMode(page), "studio");
  await page.waitForTimeout(300);
  assert.equal(messages.filter((m) => /Mémoire du navigateur pleine/.test(m)).length, 1, "un seul avertissement attendu");
  assert.deepEqual(page.errors, []);
  await context.close();
});

test("import : une illustration externe est ignorée, une image intégrée est gardée", async () => {
  const context = await newContext(browser);
  const page = await openApp(context, url);
  const pixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const board = {
    format: "soundboard-live-board",
    version: 1,
    board: {
      name: "Images",
      padCount: 2,
      pads: [
        { index: 0, title: "Externe", visualImage: "https://example.com/espion.png" },
        { index: 1, title: "Intégrée", visualImage: pixel },
      ],
    },
  };
  await page.locator("#importBoardFile").setInputFiles({
    name: "images.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(board)),
  });
  await page.waitForFunction(() => document.querySelectorAll(".pad").length === 2, null, { timeout: 10000 });
  await page.waitForTimeout(500);
  const images = await page.evaluate(() => state.pads.map((pad) => pad.visualImage || ""));
  assert.equal(images[0], "");
  assert.equal(images[1], pixel);
  assert.deepEqual(page.errors, []);
  await context.close();
});
