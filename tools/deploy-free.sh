#!/usr/bin/env bash
# Déploie la version courante du dépôt vers les Pages Perso Free (FTPS), en une
# commande, sans client FTP ni glisser-déposer de fichiers cachés.
#
#   bash tools/deploy-free.sh
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
for f in index.html app.js styles.css service-worker.js manifest.webmanifest soundboard-vl-notice.pdf; do
  [ -f "$f" ] && put "$f" "$REMOTE/$f"
done
while IFS= read -r f; do
  put "$f" "$REMOTE/$f"
done < <(find lib icons api -type f ! -name '.DS_Store' | sort)

# 3. Verrou du dossier privé (contenu géré par admin.php, jamais écrasé ici)
put "prive/.htaccess" "$REMOTE/prive/.htaccess"

v="$(grep -oE 'app\.js\?v=[0-9]+' index.html | grep -oE '[0-9]+' | head -1)"
echo "✓ Déployé — version ${v:-?} en ligne dans $REMOTE/"
