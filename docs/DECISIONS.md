# Decisions

Ce fichier consigne les decisions de conception validees, afin d'eviter de les redefinir a chaque chantier.

## Documentation

- Les conversations IA brutes ne doivent pas etre importees telles quelles dans le depot.
- Les echanges Claude/Codex utiles doivent etre synthetises dans les fichiers `docs/`.
- Les notes de version internes de l'application sont conservees dans l'application : elles servent aux versions de board utilisateur, pas au changelog du projet.

## Versions et cache

- La version affichee dans `#audioStatus`, les query strings d'assets dans `index.html` et le `CACHE_NAME`/assets de `service-worker.js` doivent rester coherents.
- En cas de doute sur une version publiee, verifier `index.html` et `service-worker.js` ensemble.

## Notes de version de l'application

- Ne pas supprimer les notes de version de l'application pour les deplacer dans `docs/`.
- Elles sont stockees avec les snapshots de board (`snapshot.notes`) et exportees/importees avec les versions de board.
- Les fichiers `docs/` servent a documenter le projet et les decisions de developpement, pas les notes utilisateur de chaque board.
