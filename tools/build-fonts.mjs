// Régénère fonts/ : polices des skins auto-hébergées (sous-ensemble latin,
// graisses 400 et 700), découpées en morceaux < 16 Ko (le FTP de Free tronque
// certains envois au-delà) et recollées par loadSkinFont() dans app.js.
//
//   npm i --no-save @fontsource/roboto @fontsource/open-sans @fontsource/lato \
//     @fontsource/montserrat @fontsource/oswald @fontsource/raleway @fontsource/nunito \
//     @fontsource/ubuntu @fontsource/source-code-pro @fontsource/playfair-display
//   node tools/build-fonts.mjs
//
// Affiche la table SKIN_FONT_FILES à recopier dans app.js si le découpage change.
// Licences : SIL OFL 1.1 (Ubuntu : Ubuntu Font Licence), voir fonts/LICENCES.txt.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "fonts");
const CHUNK = 15000;
const WEIGHTS = [400, 700];
const FONTS = {
  "Roboto": "roboto", "Open Sans": "open-sans", "Lato": "lato", "Montserrat": "montserrat",
  "Oswald": "oswald", "Raleway": "raleway", "Nunito": "nunito", "Ubuntu": "ubuntu",
  "Source Code Pro": "source-code-pro", "Playfair Display": "playfair-display",
};
const base = process.env.FONTSOURCE_DIR || path.join(ROOT, "node_modules/@fontsource");
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith(".bin")) fs.unlinkSync(path.join(OUT, f));
const table = {};
const licences = [];
for (const [name, slug] of Object.entries(FONTS)) {
  table[name] = { slug, parts: {} };
  for (const w of WEIGHTS) {
    const src = path.join(base, slug, "files", `${slug}-latin-${w}-normal.woff2`);
    const buf = fs.readFileSync(src);
    const n = Math.ceil(buf.length / CHUNK);
    for (let i = 0; i < n; i++) {
      fs.writeFileSync(path.join(OUT, `${slug}-${w}-${i + 1}.bin`), buf.subarray(i * CHUNK, (i + 1) * CHUNK));
    }
    table[name].parts[w] = n;
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(base, slug, "package.json"), "utf8"));
  licences.push(`${name} — ${pkg.license} — ${pkg.homepage || ""}`);
}
fs.writeFileSync(path.join(OUT, "LICENCES.txt"),
  "Polices des skins, auto-hébergées (fichiers woff2 Fontsource, sous-ensemble latin, découpés en .bin).\n\n" + licences.join("\n") + "\n");
console.log("const SKIN_FONT_FILES = " + JSON.stringify(table) + ";");
