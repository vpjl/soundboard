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

// Free Pages Perso ne fournit pas de dossier de sessions : on en crée un dans
// prive/ (interdit d'accès web par prive/.htaccess).
$sessionDir = PRIVE_DIR . '/sessions';
if (!is_dir($sessionDir)) @mkdir($sessionDir, 0700, true);
if (!is_dir($sessionDir) || !is_writable($sessionDir)) {
  $sessionDir = sys_get_temp_dir(); // repli si prive/ non inscriptible
}
@session_save_path($sessionDir);
@session_start();
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');

$httpsOk = (($_SERVER['HTTPS'] ?? '') === 'on')
  || (($_SERVER['REQUEST_SCHEME'] ?? '') === 'https')
  || (strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
  || (($_SERVER['SERVER_PORT'] ?? '') === '443');

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
  $b64 = $_SESSION['mk'] ?? '';
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
  if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
  return $_SESSION['csrf'];
}
function csrf_ok(): bool {
  return isset($_POST['csrf'], $_SESSION['csrf'])
    && hash_equals($_SESSION['csrf'], (string) $_POST['csrf']);
}

function base_link(string $id): string {
  $scheme = 'https';
  $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
  $dir = rtrim(str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/soundboard/api/admin.php'))), '/');
  return "{$scheme}://{$host}{$dir}/#g={$id}";
}

/* ------------------------------------------------------------------- state  */

$config = is_file(CONFIG_FILE) ? (@include CONFIG_FILE) : null;
$hasMaster = is_array($config) && !empty($config['hash']);
$loggedIn = ($_SESSION['admin'] ?? false) === true;
$errors = [];
$notice = null;
$createdLink = null;

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ---- 1. Bootstrap : définir le mot de passe maître -------------------------
if (!$hasMaster) {
  if ($method === 'POST' && ($_POST['action'] ?? '') === 'bootstrap') {
    $p1 = (string) ($_POST['master'] ?? '');
    $p2 = (string) ($_POST['master2'] ?? '');
    if (strlen($p1) < 10) $errors[] = "Mot de passe maître trop court (10 caractères minimum).";
    elseif ($p1 !== $p2) $errors[] = "Les deux saisies ne correspondent pas.";
    else {
      if (!is_dir(PRIVE_DIR)) @mkdir(PRIVE_DIR, 0755, true);
      $kdf = base64_encode(random_bytes(16));
      if (!write_config(pbkdf2_hash($p1), $kdf)) {
        $errors[] = "Impossible d'écrire " . h(CONFIG_FILE) . " (droits ?).";
      } else {
        $_SESSION['admin'] = true;
        $_SESSION['mk'] = base64_encode(derive_key($p1, $kdf));
        header('Location: ' . $_SERVER['REQUEST_URI']);
        exit;
      }
    }
  }
  render_page('Définir le mot de passe maître', function () use ($errors) {
    ?>
    <p class="lead">Première utilisation. Choisissez le mot de passe maître de la console
      (celui qui protège cette page — à ne pas confondre avec les mots de passe des invités).</p>
    <?php show_errors($errors); ?>
    <form method="post" autocomplete="off">
      <input type="hidden" name="action" value="bootstrap">
      <label>Mot de passe maître<input type="password" name="master" required minlength="10"></label>
      <label>Confirmer<input type="password" name="master2" required minlength="10"></label>
      <button type="submit">Enregistrer</button>
    </form>
    <?php
  });
  exit;
}

// ---- 2. Connexion --------------------------------------------------------
if (!$loggedIn) {
  if ($method === 'POST' && ($_POST['action'] ?? '') === 'login') {
    if (rate_blocked()) {
      $errors[] = "Trop d'essais. Réessayez dans quelques minutes.";
    } else {
      usleep(MIN_DELAY_MS * 1000);
      $master = (string) ($_POST['master'] ?? '');
      if (pbkdf2_verify($master, (string) $config['hash'])) {
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        // Sel de dérivation : présent depuis cette version ; migré ici pour les
        // installs plus anciennes (on a le mot de passe sous la main).
        $kdf = $config['kdf'] ?? '';
        if ($kdf === '') {
          $kdf = base64_encode(random_bytes(16));
          @write_config((string) $config['hash'], $kdf);
        }
        $_SESSION['mk'] = base64_encode(derive_key($master, $kdf));
        header('Location: ' . $_SERVER['REQUEST_URI']);
        exit;
      }
      rate_note_failure();
      $errors[] = "Mot de passe incorrect.";
    }
  }
  render_page('Console de partage', function () use ($errors, $httpsOk) {
    if (!$httpsOk) echo '<p class="warn">⚠ Page ouverte sans HTTPS : le mot de passe transiterait en clair.</p>';
    show_errors($errors);
    ?>
    <form method="post" autocomplete="off">
      <input type="hidden" name="action" value="login">
      <label>Mot de passe maître<input type="password" name="master" required autofocus></label>
      <button type="submit">Se connecter</button>
    </form>
    <?php
  });
  exit;
}

/* ------------------------------------------------------- tableau de bord    */

$partages = load_partages();

if ($method === 'POST') {
  if (!csrf_ok()) {
    $errors[] = "Session expirée, recommencez.";
  } elseif (($_POST['action'] ?? '') === 'logout') {
    $_SESSION = [];
    session_destroy();
    header('Location: ' . strtok($_SERVER['REQUEST_URI'], '?'));
    exit;
  } elseif (($_POST['action'] ?? '') === 'chgmaster') {
    $cur = (string) ($_POST['current'] ?? '');
    $n1  = (string) ($_POST['new'] ?? '');
    $n2  = (string) ($_POST['new2'] ?? '');
    if (!pbkdf2_verify($cur, (string) $config['hash'])) {
      $errors[] = "Mot de passe maître actuel incorrect.";
    } elseif (strlen($n1) < 10) {
      $errors[] = "Nouveau mot de passe trop court (10 caractères minimum).";
    } elseif ($n1 !== $n2) {
      $errors[] = "Les deux saisies du nouveau mot de passe ne correspondent pas.";
    } else {
      $oldKey = derive_key($cur, $config['kdf'] ?? '');
      $newKdf = base64_encode(random_bytes(16));
      $newKey = derive_key($n1, $newKdf);
      foreach ($partages as $k => $e) {           // re-chiffrer les mots de passe invités
        if (!empty($e['enc'])) {
          $plain = dec_password($e['enc'], $oldKey);
          $partages[$k]['enc'] = $plain !== null ? enc_password($plain, $newKey) : '';
        }
      }
      $newHash = pbkdf2_hash($n1);
      if (write_config($newHash, $newKdf) && save_partages($partages)) {
        $_SESSION['mk'] = base64_encode($newKey);
        $config = ['hash' => $newHash, 'kdf' => $newKdf]; // valeurs à jour pour ce rendu
        $notice = "Mot de passe maître modifié.";
      } else {
        $errors[] = "Écriture impossible (droits sur prive/ ?).";
      }
    }
  } elseif (($_POST['action'] ?? '') === 'revoke') {
    $id = (string) ($_POST['id'] ?? '');
    if (isset($partages[$id])) {
      $file = $partages[$id]['file'] ?? '';
      unset($partages[$id]);
      $stillUsed = false;
      foreach ($partages as $e) if (($e['file'] ?? '') === $file) $stillUsed = true;
      if ($file && !$stillUsed) @unlink(BOARDS_DIR . '/' . basename($file));
      if (save_partages($partages)) $notice = "Partage « " . h($id) . " » révoqué.";
      else $errors[] = "Écriture de partages.php impossible (droits ?).";
    }
  } elseif (($_POST['action'] ?? '') === 'create') {
    $label   = trim((string) ($_POST['label'] ?? ''));
    $pass    = (string) ($_POST['password'] ?? '');
    $expire  = trim((string) ($_POST['expire'] ?? ''));
    $wantId  = trim((string) ($_POST['id'] ?? ''));
    $up      = $_FILES['board'] ?? null;

    if (!$up || ($up['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
      $code = $up['error'] ?? UPLOAD_ERR_NO_FILE;
      if (in_array($code, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
        $errors[] = "Board trop volumineux pour l'upload PHP de Free. Utiliser tools/make-share.mjs + FTP pour ce board.";
      } else {
        $errors[] = "Aucun fichier de board reçu.";
      }
    }
    if (strlen($pass) < 4) $errors[] = "Mot de passe invité trop court.";
    if ($expire !== '' && strtotime($expire) === false) $errors[] = "Date d'expiration invalide.";

    $payload = null;
    if (!$errors) {
      $raw = file_get_contents($up['tmp_name']) ?: '';
      $payload = json_decode($raw, true);
      if (!is_array($payload) || ($payload['format'] ?? '') !== 'soundboard-live-board') {
        $errors[] = "Ce fichier n'est pas un board exporté (format « soundboard-live-board » attendu).";
      } elseif (empty($payload['includesAudio'])) {
        $errors[] = "Ce board a été exporté SANS audio. Réexporter en « avec audio ».";
      }
    }

    if (!$errors) {
      $boardName = (string) ($payload['board']['name'] ?? 'board');
      $id = $wantId !== '' ? $wantId : slugify($boardName) . '-' . bin2hex(random_bytes(3));
      if (!preg_match('/^[A-Za-z0-9_-]{4,40}$/', $id)) {
        $errors[] = "Identifiant : 4 à 40 caractères parmi A-Z a-z 0-9 _ -";
      } elseif (isset($partages[$id])) {
        $errors[] = "L'identifiant « " . h($id) . " » existe déjà (révoquer d'abord, ou en choisir un autre).";
      } else {
        if (!is_dir(BOARDS_DIR)) @mkdir(BOARDS_DIR, 0755, true);
        $fileName = slugify($boardName) . '.' . date('Ymd-His') . '.json';
        if (file_put_contents(BOARDS_DIR . '/' . $fileName, $raw, LOCK_EX) === false) {
          $errors[] = "Impossible d'écrire le board dans prive/boards/ (droits ?).";
        } else {
          $sk = session_key();
          $partages[$id] = [
            'file'   => $fileName,
            'hash'   => pbkdf2_hash($pass),
            'label'  => $label !== '' ? $label : $boardName,
            'expire' => $expire !== '' ? $expire : null,
            // copie chiffrée, pour pouvoir ré-afficher le mot de passe plus tard
            'enc'    => $sk ? enc_password($pass, $sk) : '',
          ];
          if (save_partages($partages)) {
            $createdLink = base_link($id);
            $notice = "Lien créé.";
          } else {
            @unlink(BOARDS_DIR . '/' . $fileName);
            $errors[] = "Écriture de partages.php impossible (droits ?).";
          }
        }
      }
    }
  }
  $partages = load_partages();
}

render_page('Console de partage', function () use ($partages, $errors, $notice, $createdLink, $httpsOk) {
  $csrf = csrf_token();
  if (!$httpsOk) echo '<p class="warn">⚠ Page servie sans HTTPS.</p>';
  show_errors($errors);
  if ($notice) echo '<p class="ok">' . h($notice) . '</p>';
  if ($createdLink): ?>
    <div class="link-out">
      <strong>Lien à envoyer à l'invité :</strong>
      <div class="link-row">
        <input id="shareLink" type="text" readonly value="<?= h($createdLink) ?>" onclick="this.select()">
        <button type="button" class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('shareLink').value).then(()=>{var b=this;b.textContent='Copié !';setTimeout(function(){b.textContent='Copier';},1500);})">Copier</button>
      </div>
      <p class="hint">Le mot de passe, lui, se communique à part (SMS d'un côté, lien de l'autre).</p>
    </div>
  <?php endif; ?>

  <h2>Créer un lien</h2>
  <form method="post" enctype="multipart/form-data" autocomplete="off">
    <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
    <input type="hidden" name="action" value="create">
    <label>Board exporté (.json « avec audio »)
      <input type="file" name="board" accept="application/json,.json" required></label>
    <label>Mot de passe pour l'invité<input type="text" name="password" required></label>
    <label>Libellé affiché à l'invité (facultatif)<input type="text" name="label" maxlength="80"></label>
    <label>Expiration (facultatif)<input type="date" name="expire"></label>
    <label>Identifiant du lien (facultatif — un par invité)
      <input type="text" name="id" pattern="[A-Za-z0-9_-]{4,40}" placeholder="généré automatiquement"></label>
    <button type="submit">Créer le lien</button>
  </form>

  <h2>Partages actifs (<?= count($partages) ?>)</h2>
  <?php
  $sk = session_key();
  if (!$partages): ?>
    <p class="hint">Aucun pour l'instant.</p>
  <?php else: ?>
    <table>
      <thead><tr><th>Identifiant</th><th>Lien</th><th>Libellé</th><th>Mot de passe</th><th>Expire</th><th></th></tr></thead>
      <tbody>
      <?php foreach ($partages as $id => $e):
        $plain = ($sk && !empty($e['enc'])) ? dec_password($e['enc'], $sk) : null;
      ?>
        <tr>
          <td><code><?= h((string) $id) ?></code></td>
          <td><button type="button" class="copy-btn" data-link="<?= h(base_link((string) $id)) ?>" onclick="var b=this;navigator.clipboard.writeText(b.dataset.link).then(function(){var t=b.textContent;b.textContent='Copié !';setTimeout(function(){b.textContent=t;},1500);});">Copier le lien</button></td>
          <td><?= h((string) ($e['label'] ?? '')) ?></td>
          <td>
            <?php if ($plain !== null): ?>
              <span class="pw" data-pw="<?= h($plain) ?>">••••••</span>
              <button type="button" class="reveal-btn" onclick="var s=this.previousElementSibling;var on=s.textContent!=='••••••';s.textContent=on?'••••••':s.dataset.pw;this.textContent=on?'Afficher':'Masquer';">Afficher</button>
            <?php elseif (!empty($e['enc']) && !$sk): ?>
              <span class="hint">reconnecte-toi pour l'afficher</span>
            <?php else: ?>
              <span class="hint">— non récupérable</span>
            <?php endif; ?>
          </td>
          <td><?= h((string) ($e['expire'] ?? '—') ?: '—') ?></td>
          <td>
            <form method="post" onsubmit="return confirm('Révoquer ce partage ?');">
              <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
              <input type="hidden" name="action" value="revoke">
              <input type="hidden" name="id" value="<?= h((string) $id) ?>">
              <button type="submit" class="danger">Révoquer</button>
            </form>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
    <p class="hint">Les mots de passe sont chiffrés au repos ; seul le mot de passe maître permet de les réafficher.</p>
  <?php endif; ?>

  <h2>Mot de passe maître</h2>
  <form method="post" autocomplete="off">
    <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
    <input type="hidden" name="action" value="chgmaster">
    <label>Mot de passe actuel<input type="password" name="current" required></label>
    <label>Nouveau mot de passe<input type="password" name="new" required minlength="10"></label>
    <label>Confirmer<input type="password" name="new2" required minlength="10"></label>
    <button type="submit">Changer le mot de passe maître</button>
  </form>

  <form method="post" class="logout">
    <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
    <input type="hidden" name="action" value="logout">
    <button type="submit">Se déconnecter</button>
  </form>
  <?php
});

/* ---------------------------------------------------------------- rendu     */

function show_errors(array $errors): void {
  foreach ($errors as $e) echo '<p class="err">' . $e . '</p>';
}

function render_page(string $title, callable $body): void {
  ?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title><?= h($title) ?></title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
    background: #12151c; color: #e6e8ec; }
  main { max-width: 620px; margin: 0 auto; }
  h1 { font-size: 1.2rem; margin: 0 0 18px; }
  h2 { font-size: 1rem; margin: 28px 0 10px; border-top: 1px solid #2a2f3a; padding-top: 18px; }
  .lead, .hint { color: #9aa4b2; }
  .hint { font-size: 0.85rem; }
  form { display: grid; gap: 12px; }
  label { display: grid; gap: 4px; font-size: 0.85rem; color: #9aa4b2; }
  input { padding: 9px 10px; border: 1px solid #333a47; border-radius: 7px;
    background: #1b1f28; color: #e6e8ec; font-size: 0.95rem; }
  input[readonly] { background: #171a21; }
  button { justify-self: start; padding: 9px 16px; border: 1px solid #49d3a0; border-radius: 7px;
    background: rgba(73,211,160,0.16); color: #e6e8ec; font-size: 0.9rem; cursor: pointer; }
  button.danger { border-color: #e5484d; background: rgba(229,72,77,0.14); padding: 5px 10px; font-size: 0.8rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #262b35; font-size: 0.86rem; vertical-align: middle; }
  th { color: #9aa4b2; font-weight: 600; }
  td form { display: inline; }
  code { background: #1b1f28; padding: 1px 5px; border-radius: 4px; }
  .err { color: #ff8a8f; background: rgba(229,72,77,0.1); padding: 8px 10px; border-radius: 6px; margin: 6px 0; }
  .ok { color: #7ee7bf; background: rgba(73,211,160,0.1); padding: 8px 10px; border-radius: 6px; }
  .warn { color: #f4c04e; }
  .link-out { background: #1b1f28; border: 1px solid #333a47; border-radius: 8px; padding: 14px; margin: 12px 0; }
  .pw { font-family: ui-monospace, monospace; }
  .reveal-btn { padding: 3px 8px; font-size: 0.75rem; border-color: #444c5a; background: #222732; margin-left: 6px; }
  .link-out .link-row { display: flex; gap: 8px; margin-top: 8px; }
  .link-out .link-row input { flex: 1; min-width: 0; }
  .copy-btn { padding: 8px 14px; white-space: nowrap; }
  .logout { margin-top: 30px; }
  .logout button { border-color: #444c5a; background: #222732; }
</style>
</head>
<body>
<main>
<h1><?= h($title) ?></h1>
<?php $body(); ?>
</main>
</body>
</html>
<?php
}
