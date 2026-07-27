# Changelog

Historique manuel des changements publies. Pour les details fins, consulter `git log`.

## v564 - 2026-07-27

- Refonte des skins (phases 5a-6) : harmonies, roue chromatique partagee, tags/cues/badges qui suivent le skin, annulation/retablissement pas a pas dans l'editeur, export/import de skins perso.
- Aide contextuelle refondue : board garage, board studio, reglages audio du pad, editeur audio, panneau "Sons stockes".
- Selection manuelle des pads (studio et garage) avec edition en masse (bulk-edit).
- Garage : distribution multi-fichiers par glisser-deposer, suppression groupee, panneau "Sons stockes" (deduplication, export ZIP/dossier local), section "Infos board", annulation pas a pas des changements (reglages + suppression de pad avec reattachement de l'audio orphelin).
- Icones board/garage revues (grille de points au lieu du classeur) ; le bouton "reset board" reste desormais en garage au lieu de basculer en Studio.
- Correctifs : centrage de la duree du pad, scene mobile, bloc cues en scene, avertissement export video, creation de board (nombre de pads pre-rempli), selecteur de mode responsive sur portable.
- Resynchronisation de la version affichee (`#audioStatus`), des assets `index.html` et du cache `service-worker.js` (avaient derive : v423 / v555-563 / v519 selon l'endroit) ; precache du service worker rendu tolerant aux echecs individuels (`Promise.allSettled` au lieu de `cache.addAll`).

## v423 - 2026-06-26

- Ajout de `--color_pad_title_text` pour separer le titre des pads de `--color_ui_text`.
- Ajout du reglage `Pads / Titre` dans l'editeur de skins.

## v422 - 2026-06-26

- Synchronisation de la version affichee, des assets `index.html` et du cache `service-worker.js`.
- Creation de la documentation projet dans `docs/`.

## Versions precedentes

Le depot contient un historique Git detaille. Les versions anterieures n'etaient pas encore maintenues dans un changelog dedie.

Pour reconstruire l'historique :

```bash
git log --oneline
```
