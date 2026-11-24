<?php
declare(strict_types=1);
// Morceau de api/admin.php — inclus par lui seul (accès direct bloqué).
// admin.php est découpé parce que le FTP de Free coupe l'envoi du fichier
// complet (filtre côté serveur) alors que chaque morceau passe.
defined('SB_ADMIN') || exit;
// Rendu HTML (show_errors, render_page) — chargé en premier : utilisé dès l'écran de connexion.

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
  fieldset.skin-choice { border: 1px solid #333a47; border-radius: 7px; padding: 10px 12px; display: grid; gap: 6px; }
  fieldset.skin-choice legend { padding: 0 6px; font-size: 0.8rem; color: #9aa4b2; }
  label.radio { display: flex; align-items: center; gap: 8px; color: #e6e8ec; font-size: 0.9rem; }
  label.radio input { width: auto; padding: 0; }
  .field-err { color: #ff8a8f; font-size: 0.8rem; }
  .field-err[hidden] { display: none; }
  details.foldout { margin: 28px 0 0; border-top: 1px solid #2a2f3a; padding-top: 14px; }
  details.foldout > summary { cursor: pointer; font-size: 1rem; font-weight: 600; color: #e6e8ec; list-style: revert; }
  details.foldout[open] > summary { margin-bottom: 12px; }
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
