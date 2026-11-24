<?php
declare(strict_types=1);
// Morceau de api/admin.php — inclus par lui seul (accès direct bloqué).
// admin.php est découpé parce que le FTP de Free coupe l'envoi du fichier
// complet (filtre côté serveur) alors que chaque morceau passe.
defined('SB_ADMIN') || exit;
// Mini-session, crypto, partages, limitation des tentatives, CSRF.

$httpsOk = (($_SERVER['HTTPS'] ?? '') === 'on')
  || (($_SERVER['REQUEST_SCHEME'] ?? '') === 'https')
  || (strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
  || (($_SERVER['SERVER_PORT'] ?? '') === '443');

function sess_all(): array {
  if (!is_file(SESS_FILE) || filesize(SESS_FILE) > 500000) return [];
  $d = json_decode((string) @file_get_contents(SESS_FILE), true);
  return is_array($d) ? $d : [];
}

$SESS = [];
$sessTok = preg_replace('/[^a-f0-9]/', '', (string) ($_COOKIE['adm'] ?? ''));
$sessAll = array_filter(sess_all(), fn($e) => ($e['t'] ?? 0) > time() - SESS_TTL);
if ($sessTok !== '' && strlen($sessTok) === 64 && isset($sessAll[$sessTok])) {
  $SESS = is_array($sessAll[$sessTok]['d'] ?? null) ? $sessAll[$sessTok]['d'] : [];
} else {
  $sessTok = bin2hex(random_bytes(32));
}

// Persiste $SESS (fichier). $withCookie : rafraîchit aussi le cookie — à
// n'appeler QUE tant qu'aucune sortie n'a commencé (avant render_page).
function sess_persist(bool $withCookie = false): void {
  global $SESS, $sessTok, $httpsOk;
  if (!is_dir(PRIVE_DIR)) @mkdir(PRIVE_DIR, 0755, true);
  $all = array_filter(sess_all(), fn($e) => ($e['t'] ?? 0) > time() - SESS_TTL);
  $all[$sessTok] = ['t' => time(), 'd' => $SESS];
  @file_put_contents(SESS_FILE, json_encode($all), LOCK_EX);
  if ($withCookie) {
    setcookie('adm', $sessTok, [
      'expires'  => time() + SESS_TTL,
      'path'     => rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/') ?: '/',
      'httponly' => true,
      'samesite' => 'Lax',
      'secure'   => $httpsOk,
    ]);
  }
}

function sess_rotate(): void {
  global $SESS, $sessTok;
  $all = array_filter(sess_all(), fn($e) => ($e['t'] ?? 0) > time() - SESS_TTL);
  unset($all[$sessTok]);
  @file_put_contents(SESS_FILE, json_encode($all), LOCK_EX);
  $sessTok = bin2hex(random_bytes(32));
}

function sess_destroy(): void {
  global $SESS, $sessTok;
  $all = array_filter(sess_all(), fn($e) => ($e['t'] ?? 0) > time() - SESS_TTL);
  unset($all[$sessTok]);
  @file_put_contents(SESS_FILE, json_encode($all), LOCK_EX);
  $SESS = [];
}

// Jeton CSRF prêt dès maintenant (avant toute sortie) puis cookie + fichier posés.
if (empty($SESS['csrf'])) $SESS['csrf'] = bin2hex(random_bytes(16));
sess_persist(true);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');

/* ------------------------------------------------------------------ helpers */

function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

function pbkdf2_hash(string $password): string {
  $salt = random_bytes(16);
  $d = hash_pbkdf2('sha256', $password, $salt, ITER, 32, true);
  return 'pbkdf2_sha256$' . ITER . '$' . base64_encode($salt) . '$' . base64_encode($d);
}

function pbkdf2_verify(string $password, string $stored): bool {
  $p = explode('$', $stored);
  if (count($p) !== 4 || $p[0] !== 'pbkdf2_sha256') return false;
  $iter = (int) $p[1];
  $salt = base64_decode($p[2], true);
  $want = base64_decode($p[3], true);
  if ($iter < 1 || $salt === false || $want === false) return false;
  return hash_equals($want, hash_pbkdf2('sha256', $password, $salt, $iter, strlen($want), true));
}

// --- Chiffrement réversible des mots de passe invités -----------------------
// Clé dérivée du mot de passe maître (jamais stockée en clair) + sel `kdf`
// gardé dans admin-config.php. Permet de RE-AFFICHER un mot de passe invité
// oublié, tout en le gardant chiffré au repos. AES-256-GCM (openssl, partout).
function derive_key(string $masterPassword, string $kdfSaltB64): string {
  $salt = base64_decode($kdfSaltB64, true) ?: $kdfSaltB64;
  return hash_pbkdf2('sha256', $masterPassword, $salt, ITER, 32, true);
}

function enc_password(string $plain, string $key): string {
  $iv = random_bytes(12);
  $tag = '';
  $ct = openssl_encrypt($plain, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag, '', 16);
  return $ct === false ? '' : base64_encode($iv . $tag . $ct);
}

function dec_password(string $stored, string $key): ?string {
  $raw = base64_decode($stored, true);
  if ($raw === false || strlen($raw) < 29) return null;
  $iv  = substr($raw, 0, 12);
  $tag = substr($raw, 12, 16);
  $ct  = substr($raw, 28);
  $pt = openssl_decrypt($ct, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
  return $pt === false ? null : $pt;
}

function write_config(string $hash, string $kdfSaltB64): bool {
  return file_put_contents(
    CONFIG_FILE,
    "<?php\n// Mot de passe maître de la console de partage. NE PAS commiter.\nreturn " .
    var_export(['hash' => $hash, 'kdf' => $kdfSaltB64], true) . ";\n",
    LOCK_EX
  ) !== false;
}

function session_key(): ?string {
  global $SESS;
  $b64 = $SESS['mk'] ?? '';
  $k = is_string($b64) && $b64 !== '' ? base64_decode($b64, true) : false;
  return ($k !== false && strlen($k) === 32) ? $k : null;
}

function slugify(string $s): string {
  $s = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s) ?: $s;
  $s = strtolower(preg_replace('/[^A-Za-z0-9_-]+/', '-', $s));
  $s = trim($s, '-');
  return $s !== '' ? $s : 'board';
}

// Store canonique = le JSON du bloc commentaire ; le `return [...]` en est dérivé
// (lu tel quel par share.php via include). Format partagé avec make-share.mjs.
function load_partages(): array {
  if (!is_file(PARTAGES_FILE)) return [];
  $src = file_get_contents(PARTAGES_FILE) ?: '';
  if (preg_match('/\/\* make-share:begin\n(.*?)\nmake-share:end \*\//s', $src, $m)) {
    $data = json_decode($m[1], true);
    if (is_array($data)) return $data;
  }
  $arr = @include PARTAGES_FILE; // repli : ancien fichier sans bloc JSON
  return is_array($arr) ? $arr : [];
}

function save_partages(array $data): bool {
  $q = static fn($s) => "'" . str_replace(['\\', "'"], ['\\\\', "\\'"], (string) $s) . "'";
  $lines = '';
  foreach ($data as $id => $e) {
    $lines .= '  ' . $q($id) . " => [\n"
      . "    'file'   => " . $q($e['file'] ?? '') . ",\n"
      . "    'hash'   => " . $q($e['hash'] ?? '') . ",\n"
      . "    'label'  => " . $q($e['label'] ?? '') . ",\n"
      . "    'expire' => " . (empty($e['expire']) ? 'null' : $q($e['expire'])) . ",\n"
      . "  ],\n";
  }
  $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  $out = "<?php\n"
    . "// Généré par api/admin.php (ou tools/make-share.mjs) — ne pas éditer à la main.\n"
    . "/* make-share:begin\n" . $json . "\nmake-share:end */\n"
    . "return [\n" . $lines . "];\n";
  return file_put_contents(PARTAGES_FILE, $out, LOCK_EX) !== false;
}

// Lecture défensive du fichier de comptage : s'il est absent, énorme ou
// corrompu, on repart d'une liste vide plutôt que de faire planter la page.
function rate_read(): array {
  if (!is_file(RATE_FILE) || filesize(RATE_FILE) > 200000) return [];
  $data = json_decode((string) @file_get_contents(RATE_FILE), true);
  return is_array($data) ? $data : [];
}

function rate_blocked(): bool {
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
  $now = time();
  $hits = rate_read();
  $hits = array_values(array_filter($hits, fn($x) => ($x['t'] ?? 0) > $now - WINDOW_SECONDS));
  $mine = array_filter($hits, fn($x) => ($x['ip'] ?? '') === $ip);
  return count($mine) >= MAX_ATTEMPTS;
}

function rate_note_failure(): void {
  $ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
  $now = time();
  $hits = rate_read();
  $hits = array_values(array_filter($hits, fn($x) => ($x['t'] ?? 0) > $now - WINDOW_SECONDS));
  $hits[] = ['ip' => $ip, 't' => $now];
  @file_put_contents(RATE_FILE, json_encode($hits), LOCK_EX);
}

function csrf_token(): string {
  global $SESS;
  if (empty($SESS['csrf'])) $SESS['csrf'] = bin2hex(random_bytes(16));
  return $SESS['csrf'];
}
function csrf_ok(): bool {
  global $SESS;
  return isset($_POST['csrf'], $SESS['csrf'])
    && hash_equals($SESS['csrf'], (string) $_POST['csrf']);
}

function base_link(string $id): string {
  $scheme = 'https';
  $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
  $dir = rtrim(str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/soundboard/api/admin.php'))), '/');
  return "{$scheme}://{$host}{$dir}/#g={$id}";
}

/* ------------------------------------------------------------------- state  */
