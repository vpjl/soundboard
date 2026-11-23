#!/usr/bin/env bash
# Déploie la version courante du dépôt vers les Pages Perso Free (FTPS), en une
# commande, sans client FTP ni glisser-déposer de fichiers cachés.
#
#   bash tools/deploy-free.sh          → n'envoie que les fichiers modifiés
#   bash tools/deploy-free.sh --all    → renvoie tout (après un doute sur le serveur)
#
# Envoi incrémental : l'empreinte (SHA-256) de chaque fichier envoyé avec succès
# est notée dans tools/.deploy-free-state (hors dépôt). Au déploiement suivant,
# seuls les fichiers dont l'empreinte a changé partent. Un fichier dont l'envoi
# a échoué n'est pas noté, donc il repart à coup sûr la fois d'après — un
# déploiement interrompu reprend là où il s'est arrêté.
#
# Identifiants : dans ~/.netrc (HORS du dépôt, donc jamais uploadable par erreur),
# chmod 600, au format :
#
#   machine ftpperso.free.fr
#     login   TON_IDENTIFIANT_FREE
#     password TON_MOT_DE_PASSE_PAGES_PERSO   # défini dans la console d'abonné Free,
#                                             # ≠ mot de passe du compte Free
#
# (ou un autre chemin via  DEPLOY_NETRC=/chemin/vers/netrc bash tools/deploy-free.sh)
#
# Ce que le script pousse :
#   - .htaccess d'activation PHP à la RACINE du compte (créé s'il manque)
#   - l'app dans soundboard/ : index.html, app.js, styles.css, service-worker.js,
#     manifest.webmanifest, lib/, icons/, api/
#   - soundboard/prive/.htaccess (le verrou)
#
# Ce qu'il NE touche JAMAIS : soundboard/prive/partages.php, prive/boards/,
# prive/admin-config.php — gérés en ligne par admin.php, les écraser effacerait
# les partages actifs.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

HOST="ftpperso.free.fr"
NETRC="${DEPLOY_NETRC:-$HOME/.netrc}"
REMOTE="soundboard"

if [ ! -f "$NETRC" ]; then
  echo "✖ Fichier d'identifiants manquant : $NETRC"
  echo "  Le créer (voir l'en-tête de ce script pour le format), chmod 600, puis relancer."
  exit 1
fi
case "$(cd "$(dirname "$NETRC")" && pwd)/" in
  "$ROOT"/*) echo "✖ $NETRC est dans le dépôt — le placer hors du dépôt (~/.netrc)."; exit 1;;
esac

CURL=(curl -fsS --ssl-reqd --netrc-file "$NETRC" --ftp-pasv --ftp-create-dirs --connect-timeout 20)

# Le FTP de Free a des ratés passagers (« FTP response timeout ») : chaque fichier
# est retenté jusqu'à 5 fois. Boucle bash plutôt que les options --retry* de curl,
# dont certaines (--retry-all-errors) n'existent pas dans les curl anciens.
STATE="$ROOT/tools/.deploy-free-state"
FULL=0
[ "${1:-}" = "--all" ] && FULL=1
[ "$FULL" -eq 1 ] && rm -f "$STATE"
touch "$STATE"
SENT=0
SKIPPED=0

file_hash() {
  if command -v shasum >/dev/null 2>&1; then shasum -a 256 "$1" | cut -d' ' -f1
  else sha256sum "$1" | cut -d' ' -f1; fi
}

# Note l'empreinte d'un fichier envoyé (remplace l'éventuelle ligne précédente).
# Format : "<sha256> <chemin distant>" ; compatible bash 3.2 (macOS), sans tableau associatif.
record_sent() {
  local tmpstate
  tmpstate="$(mktemp)"
  awk -v p="$2" '$2 != p' "$STATE" > "$tmpstate"
  echo "$1 $2" >> "$tmpstate"
  mv "$tmpstate" "$STATE"
}

# Envoie le fichier seulement s'il a changé depuis le dernier envoi réussi.
put_if_changed() {
  local hash
  hash="$(file_hash "$1")"
  if awk -v h="$hash" -v p="$2" '$1 == h && $2 == p { found = 1 } END { exit !found }' "$STATE"; then
    SKIPPED=$((SKIPPED + 1))
    return 0
  fi
  put "$1" "$2" || return 1
  record_sent "$hash" "$2"
  SENT=$((SENT + 1))
}

put() {
  echo "  ↑ $2"
  local attempt
  for attempt in 1 2 3 4 5; do
    if "${CURL[@]}" -T "$1" "ftp://$HOST/$2"; then return 0; fi
    [ "$attempt" -lt 5 ] && { echo "    … nouvel essai ($((attempt + 1))/5) dans 3 s"; sleep 3; }
  done
  echo "  ✖ échec définitif sur $2"
  return 1
}

echo "→ Déploiement vers $HOST"

# 1. Activation PHP 8.5 — .htaccess à la racine du compte (pas dans soundboard/)
tmp="$(mktemp)"
# Test de connexion + lecture du .htaccess racine. On ne crée ce fichier QUE si le
# serveur répond qu'il n'existe pas (curl 78). Toute autre erreur (connexion coupée,
# timeout…) arrête le déploiement : avant, un simple raté réseau faisait renvoyer
# le .htaccess local à la racine, au risque d'écraser la configuration PHP en ligne.
get_status=0
"${CURL[@]}" -o "$tmp" "ftp://$HOST/.htaccess" 2>/dev/null || get_status=$?
if [ "$get_status" -ne 0 ] && [ "$get_status" -ne 78 ]; then
  rm -f "$tmp"
  echo "✖ Connexion au FTP de Free impossible (erreur curl $get_status) — rien n'a été envoyé."
  echo "  Réessayer plus tard. Diagnostic : curl -v --ssl-reqd --netrc-file ~/.netrc --ftp-pasv ftp://$HOST/"
  exit 1
fi
if [ "$get_status" -eq 0 ]; then
  if grep -q 'php85' "$tmp"; then
    echo "  = .htaccess racine : 'php85' déjà présent, on n'y touche pas"
  else
    echo "  ! Un .htaccess existe à la racine SANS 'php85 1'."
    echo "    Ajoute-y manuellement ces lignes :"
    echo "        <IfDefine Free>"
    echo "        php85 1"
    echo "        </IfDefine>"
  fi
else
  put ".htaccess" ".htaccess"
fi
rm -f "$tmp"

# 2. Fichiers de l'app
appv="$(grep -oE 'app\.js\?v=[0-9]+' index.html | grep -oE '[0-9]+' | head -1)"
noticev="$(cat .notice-build 2>/dev/null || echo '?')"
if [ "$noticev" != "$appv" ]; then
  echo "  ⚠ notice PDF bâtie pour v${noticev}, app en v${appv}."
  echo "    Pour la mettre à jour :  npm run capture-notice && python3 generate-notice.py"
fi
# Ordre : d'abord tout ce que la page charge, index.html et le service worker EN
# DERNIER. Ainsi, si l'envoi s'interrompt, la page en ligne reste l'ancienne et
# cohérente, au lieu d'un nouvel index.html (?v=nouveau) qui chargerait un
# app.js encore ancien — et le mettrait en cache sous le nouveau numéro.
while IFS= read -r f; do
  put_if_changed "$f" "$REMOTE/$f"
done < <(find lib icons api -type f ! -name '.DS_Store' | sort)
for f in app.js styles.css manifest.webmanifest soundboard-vl-notice.pdf service-worker.js index.html; do
  [ -f "$f" ] && put_if_changed "$f" "$REMOTE/$f"
done

# 3. Verrou du dossier privé (contenu géré par admin.php, jamais écrasé ici)
put_if_changed "prive/.htaccess" "$REMOTE/prive/.htaccess"

echo "  ($SENT fichier(s) envoyé(s), $SKIPPED inchangé(s) ignoré(s))"

v="$(grep -oE 'app\.js\?v=[0-9]+' index.html | grep -oE '[0-9]+' | head -1)"
echo "✓ Déployé — version ${v:-?} en ligne dans $REMOTE/"
