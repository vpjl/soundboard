<?php
declare(strict_types=1);
// Morceau de api/admin.php — inclus par lui seul (accès direct bloqué).
// admin.php est découpé parce que le FTP de Free coupe l'envoi du fichier
// complet (filtre côté serveur) alors que chaque morceau passe.
defined('SB_ADMIN') || exit;
// Page du tableau de bord.

$formOld = ($errors && ($_POST['action'] ?? '') === 'create') ? [
  'password'  => (string) ($_POST['password'] ?? ''),
  'label'     => (string) ($_POST['label'] ?? ''),
  'expire'    => (string) ($_POST['expire'] ?? ''),
  'id'        => (string) ($_POST['id'] ?? ''),
  'guestskin' => (($_POST['guestskin'] ?? '') === 'all') ? 'all' : 'current',
  'assembled' => (string) ($_POST['assembled'] ?? ''),
] : [];

render_page('Console de partage', function () use ($partages, $errors, $notice, $createdLink, $httpsOk, $formOld) {
  $csrf = csrf_token();
  $idFmtMsg = "Identifiant : 4 à 40 caractères parmi A-Z a-z 0-9 _ -";
  $idFmtErr = in_array($idFmtMsg, $errors, true); // affiché sous le champ, pas en tête
  if (!$httpsOk) echo '<p class="warn">⚠ Page servie sans HTTPS.</p>';
  show_errors(array_values(array_filter($errors, fn($e) => $e !== $idFmtMsg)));
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

  <details class="foldout"<?= $formOld ? ' open' : '' ?>>
    <summary>Créer un lien d'invitation<span id="createBoardName"></span></summary>
    <p class="hint" id="createHint" hidden>Cette fenêtre doit être ouverte depuis le bouton
      « Partage du board » de l'application : c'est elle qui fournit le board.</p>
    <form method="post" autocomplete="off" id="createForm">
      <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
      <input type="hidden" name="action" value="create">
      <input type="hidden" name="assembled" id="assembledId" value="<?= h($formOld['assembled'] ?? '') ?>">
      <fieldset class="skin-choice">
        <legend>Skins accessibles à l'invité</legend>
        <label class="radio"><input type="radio" name="guestskin" value="current"<?= ($formOld['guestskin'] ?? 'current') !== 'all' ? ' checked' : '' ?>> Seulement le skin du board</label>
        <label class="radio"><input type="radio" name="guestskin" value="all"<?= ($formOld['guestskin'] ?? '') === 'all' ? ' checked' : '' ?>> Tous les skins intégrés</label>
      </fieldset>
      <label>Mot de passe pour l'invité<input type="text" name="password" value="<?= h($formOld['password'] ?? '') ?>" required></label>
      <label>Libellé affiché à l'invité (facultatif)<input type="text" name="label" maxlength="80" value="<?= h($formOld['label'] ?? '') ?>"></label>
      <label>Expiration (facultatif)<input type="date" name="expire" value="<?= h($formOld['expire'] ?? '') ?>"></label>
      <label>Identifiant du lien (facultatif — un par invité)
        <input type="text" name="id" id="linkId" pattern="[A-Za-z0-9_-]{4,40}" placeholder="généré automatiquement" value="<?= h($formOld['id'] ?? '') ?>">
        <span class="field-err" id="linkIdErr"<?= $idFmtErr ? '' : ' hidden' ?>>Identifiant : 4 à 40 caractères parmi A-Z a-z 0-9 _ -</span></label>
      <button type="submit" id="createBtn">Créer le lien</button>
      <p class="hint" id="createProgress" hidden></p>
    </form>
    <script>
    (function () {
      var form = document.getElementById('createForm');
      var btn = document.getElementById('createBtn');
      var prog = document.getElementById('createProgress');
      var hint = document.getElementById('createHint');
      var assembled = document.getElementById('assembledId');
      var idField = document.getElementById('linkId');
      var idErr = document.getElementById('linkIdErr');
      var csrf = form.querySelector('input[name=csrf]').value;
      var busy = false;

      // Signale l'identifiant invalide sous le champ ; renvoie false = bloquant.
      function idOk() {
        var v = (idField.value || '').trim();
        var ok = !v || /^[A-Za-z0-9_-]{4,40}$/.test(v);
        idErr.hidden = ok;
        if (!ok) idField.focus();
        return ok;
      }
      idField.addEventListener('input', function () { if (!idErr.hidden) idOk(); });

      // Sans fenêtre appelante, impossible de récupérer le board : on désactive la
      // création (la gestion des partages ci-dessus reste utilisable).
      if (!window.opener) {
        hint.hidden = false;
        btn.disabled = true;
        return;
      }

      try { window.opener.postMessage({ type: 'sb-admin-ready', csrf: csrf }, location.origin); } catch (e) {}

      window.addEventListener('message', function (ev) {
        if (ev.origin !== location.origin || ev.source !== window.opener) return;
        var d = ev.data || {};
        if (d.type === 'sb-board-info') {
          var s = document.getElementById('createBoardName');
          if (s && d.name) s.textContent = ' du board « ' + d.name + ' »';
        } else if (d.type === 'sb-board-progress') {
          prog.hidden = false;
          prog.textContent = 'Réception du board depuis le studio… ' + d.seq + ' / ' + d.total;
        } else if (d.type === 'sb-board-staged') {
          assembled.value = d.uid;
          prog.textContent = 'Board reçu, création du lien…';
          form.submit();
        } else if (d.type === 'sb-board-error') {
          prog.textContent = 'Le studio n’a pas pu envoyer le board (' + (d.message || '?') + ').';
          busy = false; btn.disabled = false;
        }
      });

      // « Créer le lien » : on demande d'abord le board courant à l'application,
      // qui l'envoie en tranches, puis la vraie soumission part (message staged).
      form.addEventListener('submit', function (e) {
        if (!idOk()) { e.preventDefault(); return; }
        if (assembled.value) return;              // board déjà reçu → soumission normale
        e.preventDefault();
        if (busy) return;
        busy = true; btn.disabled = true;
        var scope = (form.querySelector('input[name=guestskin]:checked') || {}).value || 'current';
        prog.hidden = false;
        prog.textContent = 'Demande du board au studio…';
        try {
          window.opener.postMessage({ type: 'sb-request-board', skinScope: scope, csrf: csrf }, location.origin);
        } catch (err) {
          prog.textContent = 'Fenêtre de l’application introuvable — rouvre-la via le bouton « Partage du board ».';
          busy = false; btn.disabled = false;
        }
      });
    })();
    </script>
  </details>

  <details class="foldout">
    <summary>Mot de passe maître</summary>
    <form method="post" autocomplete="off">
      <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
      <input type="hidden" name="action" value="chgmaster">
      <label>Mot de passe actuel<input type="password" name="current" required></label>
      <label>Nouveau mot de passe<input type="password" name="new" required minlength="10"></label>
      <label>Confirmer<input type="password" name="new2" required minlength="10"></label>
      <button type="submit">Changer le mot de passe maître</button>
    </form>
  </details>

  <form method="post" class="logout">
    <input type="hidden" name="csrf" value="<?= h($csrf) ?>">
    <input type="hidden" name="action" value="logout">
    <button type="submit">Se déconnecter</button>
  </form>
  <?php
});

/* ---------------------------------------------------------------- rendu     */
