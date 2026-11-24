// Outils communs aux tests de fumée : serveur statique local, navigateur,
// son de test, préparation d'un board avec un média.
//
// Les tests tournent toujours sur une copie locale (127.0.0.1), jamais sur
// la version en ligne chez Free.

import { createServer } from "node:http";
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

export const root = fileURLToPath(new URL("..", import.meta.url));

const MIME = {
  ".html": "text/html;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".js": "text/javascript;charset=utf-8",
  ".mjs": "text/javascript;charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".txt": "text/plain;charset=utf-8",
  ".woff2": "font/woff2",
  ".wav": "audio/wav",
};

// Serveur statique sur un port libre choisi par le système.
export async function startServer() {
  const server = createServer((req, res) => {
    let route = decodeURIComponent(req.url.split("?")[0]);
    if (route === "/") route = "/index.html";
    const file = normalize(join(root, route));
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    readFile(file)
      .then((data) => {
        res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
        res.end(data);
      })
      .catch(() => {
        res.writeHead(404);
        res.end();
      });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return { server, url: `http://127.0.0.1:${port}/index.html` };
}

// Chromium de Playwright (npx playwright install chromium, une fois), ou un
// autre Chrome via CHROME_PATH=/chemin/vers/chrome.
export function launchBrowser() {
  return chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
}

// Contexte isolé : localStorage vide, service worker bloqué (sinon son cache
// fausserait le rechargement), export forcé en téléchargement classique
// (ni sélecteur de fichier ni feuille de partage, qui bloqueraient le test).
export async function newContext(browser) {
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    serviceWorkers: "block",
    acceptDownloads: true,
  });
  await context.addInitScript(() => {
    try { delete window.showSaveFilePicker; } catch {}
    window.showSaveFilePicker = undefined;
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  });
  return context;
}

// Une page qui accepte les boîtes natives (beforeunload de la garde de scène)
// et remonte les erreurs JavaScript de l'app.
export async function openApp(context, url) {
  const page = await context.newPage();
  page.errors = [];
  page.on("pageerror", (error) => page.errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept().catch(() => {}));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector(".board-mode-selector", { state: "visible" });
  return page;
}

// Son de test : sinusoïde douce de `seconds` secondes, en WAV 16 bits mono.
// Assez long pour que la lecture soit encore en cours quand on la vérifie.
export async function makeToneFile(seconds = 8) {
  const rate = 22050;
  const frames = Math.round(rate * seconds);
  const buffer = Buffer.alloc(44 + frames * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + frames * 2, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(frames * 2, 40);
  for (let i = 0; i < frames; i += 1) {
    buffer.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 3000), 44 + i * 2);
  }
  const dir = await mkdtemp(join(tmpdir(), "soundboard-test-"));
  const file = join(dir, "test-tone.wav");
  await writeFile(file, buffer);
  return file;
}

export const boardMode = (page) => page.evaluate(() => document.body.dataset.boardMode);

// Passe dans un mode et attend qu'il soit effectif. Garage <-> Scène est
// bloqué dans les deux sens : on transite par Studio, comme dans l'app.
export async function goToMode(page, target) {
  const current = await boardMode(page);
  if (current === target) return;
  if (current !== "studio" && target !== "studio") await goToMode(page, "studio");
  await page.click(`.board-mode-button[data-board-mode-target="${target}"]`);
  await page.waitForFunction((t) => document.body.dataset.boardMode === t, target, { timeout: 5000 });
  await page.waitForTimeout(300);
}

// Charge le son de test dans le premier pad (en Garage), puis revient en Studio.
// Le mode Scène refuse de s'activer sur un board sans aucun média.
export async function loadToneIntoFirstPad(page, toneFile) {
  await goToMode(page, "garage");
  const pad = page.locator(".pad").first();
  await pad.locator("input[data-file]").setInputFiles(toneFile);
  await page.waitForFunction(
    () => /test.tone/i.test(document.querySelector(".pad")?.textContent || ""),
    null,
    { timeout: 10000 },
  );
  await goToMode(page, "studio");
  return pad;
}

export const isPlaying = (pad) => pad.evaluate((node) => node.classList.contains("is-playing"));
