<?php
declare(strict_types=1);

// Console de partage — tout depuis le navigateur (ni Terminal, ni FTP).
//   1er accès : définir le mot de passe maître.
//   Ensuite   : se connecter → créer un lien (choisir le board exporté + mot de
//               passe invité + expiration) ou révoquer un partage existant.
// Écrit prive/partages.php et prive/boards/<board>.json, lus par share.php.
// tools/make-share.mjs reste utilisable en parallèle (même format de fichier).

const PRIVE_DIR      = __DIR__ . '/../prive';
const CONFIG_FILE    = PRIVE_DIR . '/admin-config.php';
const PARTAGES_FILE  = PRIVE_DIR . '/partages.php';
const BOARDS_DIR     = PRIVE_DIR . '/boards';
const RATE_FILE      = PRIVE_DIR . '/admin-rate.json';
const MAX_ATTEMPTS   = 6;
const WINDOW_SECONDS = 900;
const MIN_DELAY_MS   = 350;
const ITER           = 210000;

@ini_set('memory_limit', '256M'); // upload de board « avec audio » : plusieurs Mo
@set_time_limit(60);

// Free Pages Perso ne fournit pas de sessions PHP fiables (session_start()
// échoue → 503). On gère donc nous-mêmes une mini-session : un jeton aléatoire
// dans un cookie + un fichier serveur prive/admin-sess.json (hors du web via
// prive/.htaccess). Purge des entrées de plus de 12 h à chaque passage.
const SESS_FILE = PRIVE_DIR . '/admin-sess.json';
const SESS_TTL  = 43200;

// Le reste de la console est réparti dans api/admin-inc/ (voir l'en-tête de
// ces fichiers). Ordre de chargement = ordre d'origine du code, sauf le rendu,
// placé en tête parce que ses fonctions servent dès les premiers écrans.
define('SB_ADMIN', true);
require __DIR__ . '/admin-inc/rendu.php';
require __DIR__ . '/admin-inc/fonctions.php';
require __DIR__ . '/admin-inc/acces.php';
require __DIR__ . '/admin-inc/actions.php';
require __DIR__ . '/admin-inc/page.php';
