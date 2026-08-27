#!/usr/bin/env node
// Génère un lien de partage pour UN board, en local, sans rien exposer en ligne.
//
//   1. Dans l'app : Réglages → Exporter le board (avec audio) → fichier .json
//   2. node tools/make-share.mjs chemin/vers/le-board.json
//   3. Répondre aux questions (id, mot de passe, libellé, expiration)
//   4. Envoyer par FTP le dossier prive/ vers Free
//
// Le script : copie le board dans prive/boards/, calcule le hash PBKDF2 du mot de
// passe, ajoute/remplace la ligne dans prive/partages.php, affiche l'URL finale.
//
// Révoquer : relancer avec le même id et répondre « r », ou éditer partages.php.

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import {
  readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync,
} from "node:fs";
import { basename, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRIVE = join(ROOT, "prive");
const BOARDS = join(PRIVE, "boards");
const PARTAGES = join(PRIVE, "partages.php");
const CONFIG = join(ROOT, "tools", ".make-share.json");
const ITER = 210000;

// readline/promises perd les lignes bufferisées sur une entrée non-TTY (quirk Node) :
// en mode « piped » on lit tout stdin d'un coup et on répond dans l'ordre.
const piped = !stdin.isTTY;
let pipedLines = [];
if (piped) {
  const chunks = [];
  for await (const c of stdin) chunks.push(c);
  pipedLines = Buffer.concat(chunks).toString("utf8").split(/\r?\n/);
}
const rl = piped ? null : createInterface({ input: stdin, output: stdout });
const ask = async (q, def) => {
  if (piped) {
    const a = (pipedLines.shift() ?? "").trim();
    return a || def || "";
  }
  const a = await rl.question(def ? `${q} [${def}] ` : `${q} `);
  return a.trim() || def || "";
};

function die(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = pbkdf2Sync(password, salt, ITER, 32, "sha256");
  return `pbkdf2_sha256$${ITER}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

// partages.php ⇆ objet JS. On garde un format déterministe et relisible par PHP.
function readPartages() {
  if (!existsSync(PARTAGES)) return {};
  const src = readFileSync(PARTAGES, "utf8");
  const m = src.match(/\/\* make-share:begin\n([\s\S]*?)\nmake-share:end \*\//);
  if (!m) return {};
  try { return JSON.parse(m[1]); } catch { return {}; }
}

// Chaîne PHP en apostrophes simples (pas d'interpolation de $ — le hash en contient).
const phpq = (s) => `'${String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

function writePartages(data) {
  const json = JSON.stringify(data, null, 2);
  const lines = Object.entries(data).map(([id, e]) =>
    `  ${phpq(id)} => [\n` +
    `    'file'   => ${phpq(e.file)},\n` +
    `    'hash'   => ${phpq(e.hash)},\n` +
    `    'label'  => ${phpq(e.label ?? "")},\n` +
    `    'expire' => ${e.expire ? phpq(e.expire) : "null"},\n` +
    `  ],`).join("\n");
  const out =
`<?php
// Généré par tools/make-share.mjs — ne pas éditer à la main.
// Révoquer un partage : relancer make-share.mjs (option « r ») puis ré-uploader ce fichier.
/* make-share:begin
${json}
make-share:end */
return [
${lines}
];
`;
  writeFileSync(PARTAGES, out);
}

const main = async () => {
  const boardArg = process.argv[2];
  if (!boardArg) die("Usage : node tools/make-share.mjs <board-exporté.json>");
  const boardSrc = resolve(boardArg);
  if (!existsSync(boardSrc)) die(`Introuvable : ${boardSrc}`);

  let payload;
  try { payload = JSON.parse(readFileSync(boardSrc, "utf8")); } catch { die("JSON illisible"); }
  if (payload?.format !== "soundboard-live-board") {
    die("Ce n'est pas un export de board (format « soundboard-live-board » attendu).");
  }
  if (!payload.includesAudio) {
    const go = await ask("⚠ Export SANS audio embarqué. Continuer quand même ? (o/N)", "N");
    if (!/^o/i.test(go)) die("Annulé — réexporter « avec audio ».");
  }

  const cfg = existsSync(CONFIG) ? JSON.parse(readFileSync(CONFIG, "utf8")) : {};
  const baseUrl = (await ask(
    "URL de base de l'app (sans #)",
    cfg.baseUrl || "https://<login>.pages-perso.free.fr/soundboard/",
  )).replace(/\/*$/, "/");
  writeFileSync(CONFIG, JSON.stringify({ baseUrl }, null, 2));

  const boardName = payload.board?.name || basename(boardSrc);
  const suggestedId = `${slug(boardName)}-${randomBytes(3).toString("hex")}`;
  const id = await ask("Identifiant du partage (un par invité)", suggestedId);
  if (!/^[A-Za-z0-9_-]{4,40}$/.test(id)) die("Id : 4 à 40 caractères A-Z a-z 0-9 _ -");

  const data = readPartages();
  if (data[id]) {
    const act = await ask(`« ${id} » existe déjà. (m)odifier / (r)évoquer / (a)nnuler`, "a");
    if (/^r/i.test(act)) {
      delete data[id];
      writePartages(data);
      console.log(`\n✔ Partage « ${id} » révoqué. Ré-uploader prive/partages.php.\n`);
      return;
    }
    if (!/^m/i.test(act)) die("Annulé.");
  }

  const password = await ask("Mot de passe à communiquer à l'invité");
  if (password.length < 4) die("Mot de passe trop court.");
  const label = await ask("Libellé affiché à l'invité", boardName);
  const expire = await ask("Expiration AAAA-MM-JJ (vide = jamais)", "");
  if (expire && Number.isNaN(Date.parse(expire))) die("Date invalide.");

  mkdirSync(BOARDS, { recursive: true });
  const fileName = `${slug(boardName)}.${stamp()}.json`;
  copyFileSync(boardSrc, join(BOARDS, fileName));

  data[id] = { file: fileName, hash: hashPassword(password), label, expire: expire || null };
  writePartages(data);

  const url = `${baseUrl}#g=${id}`;
  console.log(`
✔ Partage prêt.

   Lien      ${url}
   Mot de passe  ${password}
   ${expire ? `Expire    ${expire}` : "Sans expiration"}

À FAIRE : envoyer par FTP vers Free le dossier  prive/  (partages.php + boards/${fileName})
`);
};

function slug(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "board";
}
function stamp() {
  const d = new Date(); const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

main().finally(() => rl?.close());
