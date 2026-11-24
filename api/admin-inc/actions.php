<?php
declare(strict_types=1);
// Morceau de api/admin.php — inclus par lui seul (accès direct bloqué).
// admin.php est découpé parce que le FTP de Free coupe l'envoi du fichier
// complet (filtre côté serveur) alors que chaque morceau passe.
defined('SB_ADMIN') || exit;
// Actions POST du tableau de bord (créer, révoquer, …).

if ($method === 'POST' && $_POST) {
  if (!csrf_ok()) {
    $errors[] = "Session expirée, recommencez.";
  } elseif (($_POST['action'] ?? '') === 'logout') {
    sess_destroy();
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
        $SESS['mk'] = base64_encode($newKey);
        sess_persist();
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
    $upOk    = $up && ($up['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK;

    // Source du board : soit l'upload direct (petits boards), soit le fichier
    // reconstitué à partir des tranches (gros boards « avec audio »).
    $asm      = (string) ($_POST['assembled'] ?? '');
    $asmPath  = $asm !== '' ? chunk_path($asm) : null;
    $srcPath  = null;
    $srcIsUpload = false;
    if ($asmPath && is_file($asmPath)) {
      $srcPath = $asmPath;
    } elseif ($upOk) {
      $srcPath = $up['tmp_name'];
      $srcIsUpload = true;
    } else {
      $code = $up['error'] ?? UPLOAD_ERR_NO_FILE;
      if (in_array($code, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
        $errors[] = "Envoi du board interrompu (taille). Réessaie ou utilise tools/make-share.mjs + FTP.";
      } else {
        $errors[] = "Aucun board reçu — ouvre cette fenêtre via le bouton « Partage du board » de l'application.";
      }
    }
    if (strlen($pass) < 4) $errors[] = "Mot de passe invité trop court.";
    if ($expire !== '' && strtotime($expire) === false) $errors[] = "Date d'expiration invalide.";

    // Board « avec audio » = plusieurs Mo → on ne charge PAS tout en mémoire
    // (Free plante en 503 : memory_limit bas). Validation sur un entête borné,
    // écriture par rename()/copy() du fichier source.
    $boardName = 'board';
    if (!$errors) {
      $head = (string) file_get_contents($srcPath, false, null, 0, 300000);
      if (!preg_match('/"format"\s*:\s*"soundboard-live-board"/', $head)) {
        $errors[] = "Ce fichier n'est pas un board exporté (format « soundboard-live-board » attendu).";
      } elseif (!preg_match('/"includesAudio"\s*:\s*true/', $head)) {
        $errors[] = "Ce board a été exporté SANS audio (ou son entête dépasse 300 Ko). Réexporter en « avec audio ».";
      }
      if (preg_match('/"board"\s*:\s*\{[^}]*?"name"\s*:\s*"((?:[^"\\\\]|\\\\.)*)"/', $head, $m)) {
        $boardName = json_decode('"' . $m[1] . '"') ?: 'board';
      }
    }

    if (!$errors) {
      $id = $wantId !== '' ? $wantId : slugify($boardName) . '-' . bin2hex(random_bytes(3));
      if (!preg_match('/^[A-Za-z0-9_-]{4,40}$/', $id)) {
        $errors[] = "Identifiant : 4 à 40 caractères parmi A-Z a-z 0-9 _ -";
      } elseif (isset($partages[$id])) {
        $errors[] = "L'identifiant « " . h($id) . " » existe déjà (révoquer d'abord, ou en choisir un autre).";
      } else {
        if (!is_dir(BOARDS_DIR)) @mkdir(BOARDS_DIR, 0755, true);
        $fileName = slugify($boardName) . '.' . date('Ymd-His') . '.json';
        $dest = BOARDS_DIR . '/' . $fileName;
        $moved = $srcIsUpload && is_uploaded_file($srcPath) && move_uploaded_file($srcPath, $dest);
        if (!$moved && !@rename($srcPath, $dest) && !@copy($srcPath, $dest)) {
          $errors[] = "Impossible d'écrire le board dans prive/boards/ (droits ou espace disque ?).";
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

// Création en échec : on réaffiche les valeurs saisies (dont le board déjà
// reçu, si sa tranche est encore sur le serveur) plutôt que de tout vider.
