<?php
declare(strict_types=1);

// Renvoie UN board partagé si l'id + le mot de passe sont bons.
// - Aucune interface d'admin : les partages sont décrits dans ../prive/partages.php
//   (généré en local par tools/make-share.mjs puis envoyé par FTP).
// - Le dossier ../prive/ est interdit d'accès web (.htaccess) ; ce script y accède
//   par le disque.
// - Hash des mots de passe : PBKDF2-SHA256 (dispo nativement côté PHP et côté Node,
//   contrairement à bcrypt/argon2 qui manquent à l'un ou l'autre).

const PRIVE_DIR      = __DIR__ . '/../prive';
const MAX_ATTEMPTS   = 8;    // essais ratés tolérés par IP...
const WINDOW_SECONDS = 600;  // ...sur cette fenêtre glissante (10 min)
const MIN_DELAY_MS   = 350;  // temporisation systématique (anti-force-brute)

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex');

function fail(int $code, string $msg): never {
  http_response_code($code);
  echo json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

// --- HTTPS obligatoire : le mot de passe ne doit jamais transiter en clair ---
$https = (($_SERVER['HTTPS'] ?? '') === 'on')
  || (($_SERVER['REQUEST_SCHEME'] ?? '') === 'https')
  || (strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
  || (($_SERVER['SERVER_PORT'] ?? '') === '443');
if (!$https) fail(400, 'https_requis');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') fail(405, 'method');

$in = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($in)) fail(400, 'json');
$id       = (string) ($in['id'] ?? '');
$password = (string) ($in['password'] ?? '');
if (!preg_match('/^[A-Za-z0-9_-]{4,40}$/', $id)) fail(400, 'id');

// --- Anti-force-brute par IP (petit compteur fichier) ---
$ip  = $_SERVER['REMOTE_ADDR'] ?? 'x';
$now = time();
$rl  = PRIVE_DIR . '/rate.json';
$hits = [];
$fh = @fopen($rl, 'c+');
if ($fh && flock($fh, LOCK_EX)) {
  $hits = json_decode(stream_get_contents($fh) ?: '[]', true) ?: [];
  $hits = array_values(array_filter($hits, fn($h) => ($h['t'] ?? 0) > $now - WINDOW_SECONDS));
  $mine = array_filter($hits, fn($h) => ($h['ip'] ?? '') === $ip);
  if (count($mine) >= MAX_ATTEMPTS) {
    fseek($fh, 0); ftruncate($fh, 0); fwrite($fh, json_encode($hits));
    flock($fh, LOCK_UN); fclose($fh);
    fail(429, 'trop_d_essais');
  }
}

usleep(MIN_DELAY_MS * 1000);

$partages = @include PRIVE_DIR . '/partages.php';
$entry = (is_array($partages) && isset($partages[$id]) && is_array($partages[$id]))
  ? $partages[$id]
  : null;

$ok = false;
$reason = 'inconnu';        // lien absent / supprimé / révoqué
$expireDate = null;
if ($entry) {
  $expire  = $entry['expire'] ?? null;
  $expired = $expire && strtotime((string) $expire) !== false && strtotime((string) $expire) < $now;
  if ($expired) {
    $reason = 'expire';
    $expireDate = (string) $expire;
  } elseif (!pbkdf2_verify($password, (string) ($entry['hash'] ?? ''))) {
    $reason = 'mot_de_passe';
  } else {
    $ok = true;
  }
}

// On ne compte que les échecs : un usage normal ne doit pas finir verrouillé.
if ($fh) {
  if (!$ok) $hits[] = ['ip' => $ip, 't' => $now];
  fseek($fh, 0); ftruncate($fh, 0); fwrite($fh, json_encode($hits));
  flock($fh, LOCK_UN); fclose($fh);
}

if (!$ok) {
  http_response_code(403);
  echo json_encode(['error' => $reason, 'date' => $expireDate], JSON_UNESCAPED_UNICODE);
  exit;
}

$boardPath = PRIVE_DIR . '/boards/' . basename((string) ($entry['file'] ?? ''));
if (!is_file($boardPath)) fail(500, 'board_absent');

// Le fichier est déjà un payload « soundboard-live-board » : on le sert tel quel.
header('Content-Type: application/json; charset=utf-8');
readfile($boardPath);

// Format du hash : pbkdf2_sha256$<iterations>$<sel base64>$<derivé base64>
function pbkdf2_verify(string $password, string $stored): bool {
  $parts = explode('$', $stored);
  if (count($parts) !== 4 || $parts[0] !== 'pbkdf2_sha256') return false;
  $iter = (int) $parts[1];
  $salt = base64_decode($parts[2], true);
  $want = base64_decode($parts[3], true);
  if ($iter < 1 || $salt === false || $want === false) return false;
  $got = hash_pbkdf2('sha256', $password, $salt, $iter, strlen($want), true);
  return hash_equals($want, $got);
}
