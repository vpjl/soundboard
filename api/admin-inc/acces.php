<?php
declare(strict_types=1);
// Morceau de api/admin.php — inclus par lui seul (accès direct bloqué).
// admin.php est découpé parce que le FTP de Free coupe l'envoi du fichier
// complet (filtre côté serveur) alors que chaque morceau passe.
defined('SB_ADMIN') || exit;
// État, définition du mot de passe maître, connexion, upload en tranches.

$config = is_file(CONFIG_FILE) ? (@include CONFIG_FILE) : null;
$hasMaster = is_array($config) && !empty($config['hash']);
$loggedIn = ($SESS['admin'] ?? false) === true;
$errors = [];
$notice = null;
$createdLink = null;

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ---- 1. Bootstrap : définir le mot de passe maître -------------------------
// Uniquement si SETUP_FILE est présent (voir admin.php) : si prive/ se vide,
// la console reste fermée au lieu de laisser le premier venu s'en emparer.
if (!$hasMaster && !is_file(SETUP_FILE)) {
  http_response_code(403);
  render_page('Console fermée', function () {
    ?>
    <p class="lead">Aucun mot de passe maître n'est défini sur ce serveur, et sa définition
      n'est pas autorisée pour l'instant.</p>
    <p>Pour l'autoriser, depuis le Mac, dans le dossier du projet :</p>
    <pre>bash tools/deploy-free.sh --autoriser-config</pre>
    <p>puis rechargez cette page. L'autorisation est retirée dès que le mot de passe est défini.</p>
    <?php
  });
  exit;
}
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
        @unlink(SETUP_FILE); // autorisation à usage unique
        $SESS['admin'] = true;
        $SESS['mk'] = base64_encode(derive_key($p1, $kdf));
        sess_persist(true);
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
        sess_rotate();
        $SESS['admin'] = true;
        // Sel de dérivation : présent depuis cette version ; migré ici pour les
        // installs plus anciennes (on a le mot de passe sous la main).
        $kdf = $config['kdf'] ?? '';
        if ($kdf === '') {
          $kdf = base64_encode(random_bytes(16));
          @write_config((string) $config['hash'], $kdf);
        }
        $SESS['mk'] = base64_encode(derive_key($master, $kdf));
        sess_persist(true);
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

// POST reçu mais corps vide = dépassement de post_max_size (Free : souvent 8 Mo).
// Sans ça la page se recharge en silence et l'invité n'est pas créé.
if ($method === 'POST' && !$_POST && ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
  $mb = round(((int) $_SERVER['CONTENT_LENGTH']) / 1048576, 1);
  $errors[] = "Envoi de {$mb} Mo refusé par l'hébergeur (limite de taille des formulaires). "
    . "Ce board est trop lourd pour l'upload navigateur : passer par tools/make-share.mjs + FTP.";
}

/* ---- Upload en tranches : gros boards « avec audio » > post_max_size Free -- */
const CHUNK_DIR       = PRIVE_DIR . '/tmp';
// 300 Mio : marge large sous les 10 Go du quota « pages perso » Free, tout en
// restant un plafond volontaire — pas un simple retrait de garde-fou — pour
// éviter qu'un envoi qui boucle ne remplisse prive/tmp.
const CHUNK_MAX_TOTAL = 300 * 1048576;

function chunk_path(string $uid): ?string {
  return preg_match('/^[a-f0-9]{16,40}$/', $uid) ? CHUNK_DIR . '/' . $uid . '.part' : null;
}

if ($method === 'POST' && ($_POST['action'] ?? '') === 'chunk') {
  header('Content-Type: application/json; charset=utf-8');
  if (!csrf_ok())        { http_response_code(403); exit('{"error":"csrf"}'); }
  $path = chunk_path((string) ($_POST['uid'] ?? ''));
  $seq  = (int) ($_POST['seq'] ?? -1);
  $part = $_FILES['part'] ?? null;
  if ($path === null || !$part || ($part['error'] ?? 1) !== UPLOAD_ERR_OK) {
    http_response_code(400); exit('{"error":"part"}');
  }
  if (!is_dir(CHUNK_DIR)) @mkdir(CHUNK_DIR, 0755, true);
  foreach (glob(CHUNK_DIR . '/*.part') ?: [] as $old) {          // purge orphelins > 1 h
    if (@filemtime($old) < time() - 3600) @unlink($old);
  }
  if ($seq === 0) @unlink($path);                                // nouvel envoi
  $cur = is_file($path) ? (int) filesize($path) : 0;
  if ($cur + (int) ($part['size'] ?? 0) > CHUNK_MAX_TOTAL) {
    @unlink($path); http_response_code(413); exit('{"error":"too_big"}');
  }
  $in = @fopen($part['tmp_name'], 'rb');
  $out = @fopen($path, 'ab');
  if (!$in || !$out) { http_response_code(500); exit('{"error":"io"}'); }
  stream_copy_to_stream($in, $out);
  fclose($in); fclose($out);
  exit(json_encode(['ok' => true, 'seq' => $seq, 'bytes' => (int) filesize($path)]));
}
