# Partager un board (lien + mot de passe)

Permet d'envoyer à quelqu'un **un seul board**, protégé par mot de passe, sans qu'il
puisse voir, charger ou éditer les autres boards.

## Vue d'ensemble

```
tondomaine.fr  ──redirection 301 HTTPS (LWS)──►  https://<login>.pages-perso.free.fr/soundboard/#g=<id>
```

- App + `api/share.php` : hébergés sur **Free Pages Perso** (PHP 8.5), dans un dossier `soundboard/`.
- `prive/` : secrets et contenu, **jamais commités**, envoyés par FTP à la main.
- Création des liens : **script local** `tools/make-share.mjs`. Aucune page d'admin en ligne.

## Installation (une fois)

1. **HTTPS.** Vérifier que `https://<login>.pages-perso.free.fr/` répond (Free l'a activé en 2026).
2. **Redirection LWS.** Dans l'espace LWS du domaine : redirection **301, en HTTPS**, de
   `tondomaine.fr` vers `https://<login>.pages-perso.free.fr/soundboard/`.
   (Pas de redirection « avec masquage » / iframe : ça casse le `#g=` et le service worker.)
3. **Envoi FTP** vers `.../soundboard/` :
   - tout le contenu de l'app (comme d'habitude)
   - `api/share.php`
   - `prive/.htaccess`
4. **Vérifier le verrou.** `https://<login>.pages-perso.free.fr/soundboard/prive/partages.php`
   doit renvoyer **403** (et pas le contenu du fichier).

## Créer un partage

1. Dans l'app : **Réglages → Exporter le board → avec audio**. On obtient un `.json`.
2. En local :
   ```bash
   node tools/make-share.mjs ~/Downloads/mon-board.….json
   ```
   Répondre aux questions : URL de base (mémorisée), identifiant du partage (**un par
   invité**), mot de passe, libellé, expiration facultative.
3. Le script écrit `prive/partages.php` et copie le board dans `prive/boards/`.
   **Envoyer par FTP le dossier `prive/`** vers Free.
4. Communiquer à l'invité : le **lien** (`…/#g=<id>`) et le **mot de passe** (séparément).

## Révoquer / modifier

```bash
node tools/make-share.mjs ~/Downloads/mon-board.….json
```
Reprendre le même identifiant → `r` (révoquer) ou `m` (modifier le mot de passe /
l'expiration). Puis ré-envoyer `prive/partages.php` par FTP. Un lien révoqué renvoie 403.

## Ce que voit l'invité

Ouvre le lien → saisit le mot de passe → l'app charge **ce board uniquement**, en **mode
scène**, sans contrôle à distance, sans sélecteur de boards, sans import ni éditeur ni
réglages.

## Sécurité — limites connues

- Mot de passe haché **PBKDF2-SHA256** (210 000 itérations), jamais stocké en clair.
- `share.php` : refuse le HTTP, temporise 350 ms, bloque après 8 échecs / IP / 10 min.
- Les boards privés sont hors d'atteinte du web (`.htaccess` + extension `.php` pour
  `partages`).
- Qui possède **lien + mot de passe** garde l'accès jusqu'à expiration ou révocation.
  Pour couper un accès : révoquer et ré-uploader.
