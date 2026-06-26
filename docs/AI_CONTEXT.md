# Contexte IA - Soundboard Live

Derniere mise a jour : 2026-06-26.

Ce fichier sert de point d'entree pour Codex ou un autre assistant IA. Il doit rester synthetique et orienter vers les fichiers utiles, pas remplacer le code.

## Projet

Application web de soundboard pour performance live, stockee localement dans le navigateur.

Fichiers principaux :
- `index.html` : structure de l'application et dialogues.
- `styles.css` : skins, modes d'affichage, responsive.
- `app.js` : logique applicative, stockage local, IndexedDB, audio, cues, skins.
- `service-worker.js` : cache applicatif.

## Etat courant

- Branche de travail habituelle : `main`.
- Version publique synchronisee : `v423`.
- Le cache service worker doit rester aligne avec les versions d'assets dans `index.html`.
- Les notes de version internes de l'application sont des notes utilisateur attachees aux versions de board.

## Regles de travail

- Relire l'etat courant de `app.js`, `index.html`, `styles.css` et `service-worker.js` avant toute modification.
- Ne pas supposer que les anciens echanges Codex/Claude refletent encore l'etat actuel du depot.
- Eviter les refontes generales.
- Respecter les contraintes existantes de stockage local et IndexedDB.
- Ne pas modifier `applySkin()`, le stockage, ni les fonctions de sauvegarde/suppression sans raison explicite.

## Import de conversations IA

Ne pas coller les chats bruts Claude/Codex dans le depot. Les convertir en synthese :
- decisions validees dans `docs/DECISIONS.md`;
- bugs et chantiers futurs dans `docs/BACKLOG.md`;
- historique des versions publiees dans `docs/CHANGELOG.md`.
