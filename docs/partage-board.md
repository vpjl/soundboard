# Partager un board (lien + mot de passe)

Permet d'envoyer à quelqu'un **un seul board**, protégé par mot de passe, sans qu'il
puisse voir, charger ou éditer les autres boards.

## Vue d'ensemble

```
tondomaine.fr  ──redirection 301 HTTPS (LWS)──►  https://<login>.pages-perso.free.fr/soundboard/#g=<id>
```

- App + `api/share.php` + `api/admin.php` : hébergés sur **Free Pages Perso** (PHP 8.5), dans un dossier `soundboard/`.
- `prive/` : secrets et contenu, **jamais commités**. Écrits par `admin.php` (ou `make-share.mjs`).
- Création des liens : **console web** `api/admin.php` (rien à installer côté poste). `tools/make-share.mjs` reste dispo en secours (gros boards qui dépassent la limite d'upload PHP de Free).

## Installation (une fois, par FTP)

1. **HTTPS.** Vérifier que `https://<login>.pages-perso.free.fr/` répond (Free l'a activé en 2026).
2. **Redirection LWS.** Dans l'espace LWS du domaine : redirection **301, en HTTPS**, de
   `tondomaine.fr` vers `https://<login>.pages-perso.free.fr/soundboard/`.
   (Pas de redirection « avec masquage » / iframe : ça casse le `#g=` et le service worker.)
3. **Envoi FTP** vers `.../soundboard/` — `api/` et `prive/` restent frères de `index.html` :
   - tout le contenu de l'app (comme d'habitude)
   - **`.htaccess`** à la racine `soundboard/` (active PHP 8.5 sur Free — sans lui,
     `api/*.php` renvoie « Parse error: unexpected T_CONST »)
   - `api/share.php` et `api/admin.php`
   - `prive/.htaccess`
   (`prive/partages.php`, `prive/boards/`, `prive/admin-config.php` n'existent pas encore —
   ils seront créés par `admin.php` lui-même.)
4. **Premier accès à la console.** Ouvrir `https://<login>.pages-perso.free.fr/soundboard/api/admin.php`
   → l'écran demande de **définir le mot de passe maître** (celui qui protège la console ;
   rien à voir avec les mots de passe des invités). Le choisir long et unique.
5. **Vérifier le verrou.** `https://<login>.pages-perso.free.fr/soundboard/prive/partages.php`
   doit renvoyer **403** (et pas le contenu du fichier). Idem `.../prive/admin-config.php`.

## Créer un partage — console web (recommandé)

1. Dans l'app : **Réglages → Exporter le board → avec audio** → un `.json` dans les Téléchargements.
2. Ouvrir `.../soundboard/api/admin.php`, se connecter avec le mot de passe maître.
3. Formulaire **« Créer un lien »** : choisir le fichier du board, saisir le mot de passe
   de l'invité, une expiration facultative, un libellé. **Créer le lien.**
4. La page affiche le **lien** (`…/#g=<id>`) — le communiquer à l'invité, le **mot de passe** à part.

**Révoquer** : dans la même page, bouton **Révoquer** en face du partage. Effet immédiat (403).

## Créer un partage — script local (secours)

Pour un board trop lourd pour l'upload PHP de Free :

```bash
node tools/make-share.mjs ~/Downloads/mon-board.….json
```
Répondre aux questions, puis **envoyer par FTP** `prive/partages.php` + `prive/boards/` vers Free.
Reprendre le même identifiant → `r` (révoquer) / `m` (modifier). Format de fichier commun
avec `admin.php` : les deux méthodes sont interchangeables.

## Ce que voit l'invité

Ouvre le lien → saisit le mot de passe → l'app charge **ce board uniquement**, en **mode
scène**, sans contrôle à distance, sans sélecteur de boards, sans import ni éditeur ni
réglages.

## Sécurité — limites connues

- Mots de passe hachés **PBKDF2-SHA256** (210 000 itérations), jamais stockés en clair
  (invités *et* mot de passe maître de la console).
- `share.php` : refuse le HTTP, temporise 350 ms, bloque après 8 échecs / IP / 10 min.
- `admin.php` : `noindex`, temporise, bloque après 6 échecs / IP / 15 min, jeton CSRF sur
  les actions, session régénérée à la connexion. Surface d'attaque d'une page en ligne :
  la protéger par un mot de passe maître fort est essentiel. Pour réinitialiser ce mot de
  passe : supprimer `prive/admin-config.php` (le prochain accès le redemande).
- Les boards privés sont hors d'atteinte du web (`.htaccess` + extension `.php` pour
  `partages`).
- Qui possède **lien + mot de passe** garde l'accès jusqu'à expiration ou révocation.
  Pour couper un accès : révoquer et ré-uploader.
