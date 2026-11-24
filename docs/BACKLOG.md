# Backlog

Ce fichier liste les points a traiter plus tard. Les items doivent rester actionnables et rattaches a un comportement observable.

## A qualifier

- Console de partage : `prive/admin-config.php` et `prive/partages.php` semblent disparaitre apres certains deploiements chez Free. `deploy-free.sh` n'y touche pas ; piste : faire lister `prive/` par le script avant et apres l'envoi.
- `app.js` (environ 23 000 lignes) : extraire des modules ES au fil de l'eau (moteur audio, stockage, controle a distance), chaque fichier sous 16 Ko.
- Verifier et eventuellement traiter `Audit_messages_statut.pdf`, present localement mais non suivi par Git.
- Consolider les anciennes notes techniques de `optimisation-notes.txt` si elles sont encore valables.

## Bugs notes dans `optimisation-notes.txt`

- ~~Export complet impossible avec pad video seul.~~
  - Clos le 2026-11-24 : l'export ne propose plus que « Reglages » et « Reglages + sons » ; les videos sont referencees et non embarquees (cf. `docs/DECISIONS.md`). Teste par `tests/smoke.test.mjs`.
- ~~VU Cue : le VU cue affiche encore une valeur de volume plutot qu'une mesure du signal audio reel.~~
  - Fait le 2026-07-27 : `connectCuePreviewMeter()` tente `captureStream()` (Chrome/Firefox) puis, si absent ET qu'aucune sortie Cue dediee n'est active, `createMediaElementSource()` sur un `AudioContext` cue dedie (compatible Safari). Quand aucun analyseur reel n'est disponible (TTS, ou Safari + sortie Cue dediee), le VU affiche 0 au lieu de mentir avec le volume regle.

## Documentation a enrichir

- Ajouter les demandes Claude/Codex utiles sous forme de synthese, pas en conversation brute.
- Extraire les decisions fonctionnelles stables vers `docs/DECISIONS.md`.
- Fait le 2026-07-27 : `CHANGELOG.md`/`AI_CONTEXT.md` rattrapes jusqu'a v564 (retard depuis v423).
- Fait le 2026-11-24 : `CHANGELOG.md`/`AI_CONTEXT.md` rattrapes jusqu'a v1051 (retard depuis v564).
