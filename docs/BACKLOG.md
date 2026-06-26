# Backlog

Ce fichier liste les points a traiter plus tard. Les items doivent rester actionnables et rattaches a un comportement observable.

## A qualifier

- Verifier et eventuellement traiter `Audit_messages_statut.pdf`, present localement mais non suivi par Git.
- Consolider les anciennes notes techniques de `optimisation-notes.txt` si elles sont encore valables.

## Bugs notes dans `optimisation-notes.txt`

- Export complet impossible avec pad video seul.
  - Tests notes : export reglages seuls OK, export audio seul OK, export board sans video OK, export board avec uniquement un pad video en echec.
  - Hypothese historique : `videoRecordForExport()` ou `audioSourceToBase64(record.video)`.
- VU Cue : le VU cue affiche encore une valeur de volume plutot qu'une mesure du signal audio reel.
  - Piste historique : brancher la pre-ecoute cue sur un `AnalyserNode` ou calculer un niveau depuis l'element audio.

## Documentation a enrichir

- Ajouter les demandes Claude/Codex utiles sous forme de synthese, pas en conversation brute.
- Extraire les decisions fonctionnelles stables vers `docs/DECISIONS.md`.
