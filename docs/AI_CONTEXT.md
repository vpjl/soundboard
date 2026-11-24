# Contexte IA - Soundboard Live

Dernière mise à jour : 2026-11-24 (v1051).

Ce fichier sert de point d'entrée pour Claude, Codex ou un autre assistant IA. Il reste synthétique et oriente vers les fichiers utiles, sans remplacer le code. En cas de doute, le code fait foi.

## Projet

Application web de soundboard pour le spectacle vivant. Tout est stocké localement dans le navigateur (localStorage pour les réglages, IndexedDB pour les sons, vidéos et illustrations). Aucune étape de build pour l'app : les fichiers sources sont servis tels quels.

Fichiers principaux :
- `index.html` : structure, dialogues, script inline de pré-affichage du mode (évite un clignotement au rechargement).
- `styles.css` : skins, modes (studio, garage, scène), responsive ; organisé en `@layer` (base < mode < skin).
- `app.js` : toute la logique (environ 23 000 lignes) : audio, stockage, cues, skins, contrôle à distance, mode invité.
- `service-worker.js` : cache applicatif (fichiers versionnés en cache d'abord, le reste réseau d'abord avec délai de garde).
- `lib/` : bibliothèques de l'éditeur audio (wavesurfer, chargé à la demande).
- `api/` : console de partage PHP (`admin.php` + `admin-inc/`) et `share.php` ; `prive/` : données serveur, jamais accessibles par le web.
- `tests/` : tests de fumée Playwright (`npm test`).
- `tools/` : déploiement, version, notice.

## Hébergement et publication

- La version utilisée en spectacle est servie par **Free Pages Perso**, pas par GitHub Pages. Un `git push` ne la met pas à jour.
- Publication : `publier.command` (double-clic sur le Mac) lance les tests, régénère la notice si besoin, puis déploie par FTP avec `tools/deploy-free.sh` (identifiants dans `~/.netrc`, hors dépôt).
- Le FTP de Free tronque certains fichiers au-delà de 16 Ko : tout nouveau fichier déployé doit rester sous 16 Ko ou être découpé (voir `api/admin-inc/`, `lib/wavesurfer-1..3.txt`, `tools/split-wavesurfer.sh`).
- `app.js`, `styles.css` et `service-worker.js` partent minifiés (esbuild) ; les sources du dépôt restent lisibles.
- `deploy-free.sh` ne touche jamais au contenu de `prive/` (mots de passe, partages, boards partagés).

## Version

- Le numéro de version vit à 5 endroits dans 2 fichiers : `styles.css?v=` et `app.js?v=` dans `index.html`, `CACHE_NAME` et les deux `?v=` de `service-worker.js`.
- Le changer avec `bash tools/bump-version.sh` (version suivante) ou `bash tools/bump-version.sh <numéro>`, jamais à la main. Le déploiement refuse de partir si les 5 numéros ne concordent pas.
- Règle du projet : un nouveau numéro à chaque modification publiée de l'app.
- Le numéro affiché dans l'en-tête est dérivé du `?v=` de `app.js` au chargement.

## Tests

- `npm test` : 8 tests de fumée dans un Chromium sans écran (persistance du mode, lecture/arrêt, export/import, export avec pad vidéo, stockage plein, illustrations importées).
- Ils tournent sur un serveur local, jamais sur la version en ligne. Navigateur : `npx playwright install chromium`, ou `CHROME_PATH=/chemin/vers/chrome`.

## Console de partage

- Définir le mot de passe maître exige le fichier `prive/.autoriser-config`, déposé avec `bash tools/deploy-free.sh --autoriser-config` et effacé dès que le mot de passe est défini.
- Bug connu non résolu : après certains déploiements, `prive/admin-config.php` et `prive/partages.php` semblent disparaître côté Free. `deploy-free.sh` n'y touche pas ; cause non identifiée.

## Règles de travail

- Relire l'état courant de `app.js`, `index.html`, `styles.css` et `service-worker.js` avant toute modification.
- Ne pas supposer que les anciens échanges Codex/Claude reflètent encore l'état actuel du dépôt.
- Éviter les refontes générales ; extraire des modules au fil de l'eau seulement, en respectant la limite de 16 Ko.
- Respecter les contraintes de stockage local et d'IndexedDB ; écrire dans `localStorage` avec `storeSet()`.
- Ne pas modifier `applySkin()`, le stockage, ni les fonctions de sauvegarde/suppression sans raison explicite.
- Lancer `npm test` avant de proposer une publication.

## Import de conversations IA

Ne pas coller les chats bruts Claude/Codex dans le dépôt. Les convertir en synthèse :
- décisions validées dans `docs/DECISIONS.md` ;
- bugs et chantiers futurs dans `docs/BACKLOG.md` ;
- historique des versions publiées dans `docs/CHANGELOG.md`.
