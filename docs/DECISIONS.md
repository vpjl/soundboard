# Decisions

Ce fichier consigne les decisions de conception validees, afin d'eviter de les redefinir a chaque chantier.

## Documentation

- Les conversations IA brutes ne doivent pas etre importees telles quelles dans le depot.
- Les echanges Claude/Codex utiles doivent etre synthetises dans les fichiers `docs/`.
- Les notes de version internes de l'application sont conservees dans l'application : elles servent aux versions de board utilisateur, pas au changelog du projet.

## Versions et cache

- Les query strings d'assets dans `index.html` et le `CACHE_NAME`/assets de `service-worker.js` doivent rester coherents : les changer uniquement avec `tools/bump-version.sh` (le deploiement verifie la concordance).
- La version affichee (en-tete, `#audioStatus`) est derivee du `?v=` de `app.js` : plus de numero en dur ailleurs.
- En cas de doute sur une version publiee, `bash tools/bump-version.sh --check`.

## Scene

- Les pads se declenchent au `click` (relachement), pas au `pointerdown` : option essayee en v1049, retiree en v1050, gain non perceptible en jeu.

## Export et import

- Les videos ne sont pas embarquees dans l'export d'un board (trop lourdes) : l'app previent, exporte la reference, et la video se relie apres import (« Selectionner un dossier de videos »).
- A l'import, seules les illustrations integrees (`data:image/…`) sont gardees : une adresse externe serait chargee depuis Internet et absente hors ligne.

## Console de partage

- La definition du mot de passe maitre exige le fichier `prive/.autoriser-config`, depose a la main (`bash tools/deploy-free.sh --autoriser-config`) et efface aussitot apres : si `prive/` se vide, la console reste fermee au lieu de s'ouvrir au premier venu.

## Skins

- `--color_ui_text` pilote les textes principaux de l'interface.
- Le titre interne des pads est pilote separement par `--color_pad_title_text`.

## Notes de version de l'application

- Ne pas supprimer les notes de version de l'application pour les deplacer dans `docs/`.
- Elles sont stockees avec les snapshots de board (`snapshot.notes`) et exportees/importees avec les versions de board.
- Les fichiers `docs/` servent a documenter le projet et les decisions de developpement, pas les notes utilisateur de chaque board.
